const kintoneModule = require("./kintone/modules");
const config = require('./config');
const mongoose = require('mongoose');
const utils = require("./utils/utils");
const recordSchemaInstance = mongoose.Schema({
    appName: String,
    appId: String,
    records: Object,
    uploadFiles: Object
});
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const kintone = new kintoneModule(config.kintoneInfo);
const kintoneApp = kintone.getAppModule();
const kintoneFile = kintone.getFileModule();
const kintoneRecord = kintone.getRecordModule();

async function backup() {  
    let appids = utils.getArgv();
    if (appids.length === 0) {
        appids = config.backupAppids;
    }
    const offset = 0;
    const limit = 100;
    let appInfos;
    if (appids.length > 0) {
        let appsByIDs  = await kintoneApp.getAppsByIDs({ ids: appids, offset: offset, limit: limit });
        appInfos = appsByIDs.apps;
    }
    else {
        appInfos = await fetchApps(offset, limit);
    }

    let Record = mongoose.model("record", recordSchemaInstance);
    let downloadPromise = [];
    for (let appInfo of appInfos) {
        let appId = appInfo.appId;
        let appName = appInfo.name;

        const rcOption = {
            app: appId,
            query: "order by $id asc"
        }
        let allrecords = await kintoneRecord.getAllRecordsByCursor(rcOption);
        let newRecords = generateNewRecords(allrecords);
        let fileList = newRecords[1];
        let fileNameList = [];
        for (let fileKey in fileList) {
            let params = {
                fileKey: fileKey,
                outPutFilePath: config.fileDir + fileKey
            };
            downloadPromise.push(kintoneFile.download(params));
            let fileInfo = {
                fileKey: fileKey,
                name: fileList[fileKey]
            }
            fileNameList.push(fileInfo);
        }
        let records = newRecords[0];

        let recordsJson = {
            appId: appId,
            appName: appName,
            records: records['records'],
            uploadFiles: fileNameList
        };
        await Record.findOneAndUpdate({ appId: appId }, recordsJson, { upsert: true }).exec();;
    }
    await Promise.all([downloadPromise]);
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

function generateNewRecords(records) {
    if (records !== null && records.hasOwnProperty("records")) {
        let fileList = [];
        for (let record of records.records) {
            for (let key in record) {
                let type = record[key].type;
                if (type === "FILE") {
                    if (record[key].value.length == 0) continue;
                    for (let r of record[key].value) {
                        let fileName = r.name;
                        let fileKey = r.fileKey;
                        fileList[fileKey] = fileName;
                    }
                }
                else if (type === "SUBTABLE") {
                    let tableData = record[key].value;
                    if (tableData.length == 0) continue;
                    for (let tableValue of tableData) {
                        let itemValue = tableValue.value;
                        if (tableData.length == 0) continue;
                        for (let i in itemValue) {
                            if (itemValue[i].type === "FILE") {
                                if (itemValue[i].length == 0) continue;
                                for (let r of itemValue[i].value) {
                                    let fileName = r.name;
                                    let fileKey = r.fileKey;
                                    fileList[fileKey] = fileName;
                                }
                            }
                        }
                    }
                }
            }
            record['id'] = record['$id'];
            delete record['$id'];
            delete record['$revision'];
        }
        return [records, fileList];
    }
    return null;
}

backup();


