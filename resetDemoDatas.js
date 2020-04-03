const kintoneApi = require("./kintoneApi");
const config = require("./config");
const fs = require("fs");
const path = require("path");
const kintoneModule = require("./kintone/modules");
const kintone = new kintoneApi();
const dir = __dirname + '/kintoneBackup/files/';
const mongoose = require('mongoose');
const ExtraTypes = {
    "record": ["RECORD_NUMBER", "STATUS", "CATEGORY", "STATUS_ASSIGNEE", "CALC"]
}
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const recordSchemaInstance = mongoose.Schema({
    appName: String,
    appId: String,
    records: Object,
    uploadFiles: Object
});

const kintoneRecordModel = mongoose.model('record', recordSchemaInstance);


let userInfo = {
    "username": config.username,
    "password": config.password,
    "domain": config.domain
}
const kintoneSDK = new kintoneModule(userInfo);
async function getAppIdlist(limit, offset) {
    let params = {
        limit: 100,
        offset: 0
    };
    const kintoneApp = kintoneSDK.getAppModule();
    return kintoneApp.getApps(params);
}

function fetchApps(opt_offset, opt_limit, opt_allApps) {
    let offset = opt_offset || 0;
    let limit = opt_limit || 100;
    let allApps = opt_allApps || [];
    return getAppIdlist(limit, offset).then(function (resp) {
        allApps = allApps.concat(resp);
        if (resp.length === limit) {
            return fetchApps(offset + limit, limit, allApps);
        }
        return allApps;
    })
}
async function resetData() {
    let apps = await getAppIdlist();
    // console.log(apps);return;
    if (!apps.hasOwnProperty("apps")) return;
    // console.log(apps);
    for (let app of apps['apps']) {
        await kintone.deleteData(app['appId']);
    }
    setTimeout(async () => await restoreRecords(apps['apps']), 5000);
}

async function restoreRecords(apps) {
    const kintoneRecord = kintoneSDK.getRecordModule();

    for (let app of apps) {
        // console.log(app.name);

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
            // console.log(err);
        }
    }
    mongoose.disconnect();
}

async function uploadFiles(files) {
    const kintoneFile = kintoneSDK.getFileModule();
    let filekeyList = {};
    for (let fileInfo of files) {
        let fileNewName = fileInfo.name;
        let fileOldName = fileInfo.fileKey;
        const params = {
            fileContent: fs.createReadStream(dir + fileOldName),
            fileName: path.basename(dir + fileNewName)
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
resetData();