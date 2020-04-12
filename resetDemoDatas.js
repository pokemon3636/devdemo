const kintoneApi = require("./kintoneApi");
const config = require("./config");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');
const kintoneModule = require("./kintone/modules");
const logger = require("./utils/logger").logger;
const kintoneDemo = new kintoneApi(config.kintoneInfo);
const utils = require("./utils/utils");

const ExtraTypes = {
    "record": ["RECORD_NUMBER", "STATUS", "CATEGORY", "STATUS_ASSIGNEE", "CALC"]
}

const kintoneSDK = new kintoneModule(config.kintoneInfo);
const kintoneApp = kintoneSDK.getAppModule();
const kintoneRecord = kintoneSDK.getRecordModule();

async function getApps() {
    let appids = utils.getArgv();
    if (appids.length === 0) {
        appids = config.restoreAppids;
    }
    const offset = 0;
    const limit = 100;
    let appInfos;
    if (appids.length > 0) {
        let appsByIDs = await kintoneApp.getAppsByIDs({ ids: appids, offset: offset, limit: limit });
        appInfos = appsByIDs.apps;
    }
    else {
        appInfos = await fetchApps(offset, limit);
    }
    if (config.exceptAppid.length > 0) {
        let exceptId = config.exceptAppid;
        appInfos = appInfos.filter(function (appInfo) {
            let appid = Number(appInfo.appId);
            if (!exceptId.includes(appid)) {
                return appInfo;
            }
        });

    }
    return appInfos;
}

function deleteRecords(appInfos) {
    var deleteList = [];
    for (let app of appInfos) {
        var deletePromise = kintoneDemo.deleteData(app['appId']);
        deleteList.push(deletePromise);
    }
    return Promise.all(deleteList);
}

async function restoreRecords(appInfos) {
    mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

    const recordSchemaInstance = mongoose.Schema({
        appName: String,
        appId: String,
        records: Object,
        uploadFiles: Object
    });

    const kintoneRecordModel = mongoose.model('record', recordSchemaInstance);
    for (let app of appInfos) {
        let records = await kintoneRecordModel.findOne({ appName: app.name }).exec();
        if (records === null || records.records.length == 0) {
            continue;
        }
        let newRecords = records.records;
        let recordFilekeyList;
        if (records.uploadFiles.length > 0) {
            recordFilekeyList = await uploadFiles(records.uploadFiles);
        }
        newRecords = await generateNewRecord(recordFilekeyList, newRecords);
        try {
            await kintoneRecord.addAllRecords({ app: app.appId, records: newRecords });
        }
        catch (err) {
            logger.error("errorappid:" + app.appId + " restoreRecords:" + JSON.stringify(err));
        }
    }
    mongoose.disconnect();
}

function fetchApps(opt_offset, opt_limit, opt_allApps) {
    let offset = opt_offset || 0;
    let limit = opt_limit || 100;
    let allApps = opt_allApps || [];

    return kintoneApp.getApps({ offset: offset, limit: limit }).then(function (resp) {
        let apps = resp.apps;
        allApps = allApps.concat(apps);
        if (apps.length === limit) {
            return fetchApps(offset + limit, limit, allApps);
        }
        return allApps;
    })
}

async function uploadFiles(files) {
    const kintoneFile = kintoneSDK.getFileModule();
    let filekeyList = {};
    for (let fileInfo of files) {
        let fileNewName = fileInfo.name;
        let fileOldName = fileInfo.fileKey;
        const params = {
            fileContent: fs.createReadStream(config.fileDir + fileOldName),
            fileName: path.basename(config.fileDir + fileNewName)
        };
        filekeyList[fileOldName] = await kintoneFile.upload(params);
    }
    return filekeyList;
}

async function generateNewRecord(filekeyList, records) {
    for (let record of records) {
        delete record["id"];
        for (let key in record) {
            let type = record[key].type;
            if (ExtraTypes.record.includes(type)) {
                delete record[key];
                continue;
            }
            if (record[key].type === "FILE") {
                if (record[key].value.length == 0) continue;
                let fileArray = [];
                for (let r of record[key].value) {
                    fileArray.push(filekeyList[r.fileKey])
                }
                record[key].value = fileArray;
            }
            else if (record[key].type === "SUBTABLE") {
                let tableData = record[key].value;
                if (tableData.length == 0) continue;
                for (let tableValue of tableData) {
                    let itemValue = tableValue.value;
                    if (tableData.length == 0) continue;
                    for (let i in itemValue) {
                        if (itemValue[i].type === "FILE") {
                            if (itemValue[i].length == 0) continue;
                            let tableFileArray = [];
                            for (let r of itemValue[i].value) {
                                tableFileArray.push(filekeyList[r.fileKey]);
                            }
                            itemValue[i].value = tableFileArray;
                        }
                    }
                }
            }
        }
    }
    return records;
}

exports.resetData = async function resetData() {
    let appInfos = await getApps();
    await deleteRecords(appInfos);
    await utils.sleep(30000);
    await restoreRecords(appInfos);
}