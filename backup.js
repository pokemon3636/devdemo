const kintoneModule = require("./kintone/modules");
const mongoose = require('mongoose');
const fileDir = "./kintoneBackup/files/";
// const kintoneAppModel = require("./model/kintoneAppModel");
var kintoneInfo = {
    "domain": "devdemo2.cybozu.cn",
    "username": "Administrator",
    "password": "IN4LRlFVVa",
    // "appids":[1292]
}
const mongodbUrl = "mongodb://localhost:27017/kintoneDemoDev";
const recordSchemaInstance = mongoose.Schema({
    appName: String,
    appId: String,
    records: Object,
    uploadFiles: Object
});

mongoose.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });



async function backup() {
    const kintone = new kintoneModule(kintoneInfo);
    const kintoneApp = kintone.getAppModule();

    const kintoneFile = kintone.getFileModule();
    const kintoneRecordCursor = kintone.getRecordCursorModule();
    const offset = 0;
    const limit = 100;
    let appInfos;
    if (kintoneInfo.hasOwnProperty('appids')) {
        appInfos = await kintoneApp.getAppsByIDs({ ids: kintoneInfo.appids, offset: offset, limit: limit });

    }
    else {
        appInfos = await kintoneApp.getApps({ offset: offset, limit: limit });
    }

    let Record = mongoose.model("record", recordSchemaInstance);


    let downloadPromise = [];
    for (let appInfo of appInfos["apps"]) {
        let appId = appInfo.appId;
        let appName = appInfo.name;

        const rcOption = {
            app: appId,
            size: 100,
            query: "order by $id asc"
        }

        var cursor = await kintoneRecordCursor.createCursor(rcOption);

        var allrecords = await kintoneRecordCursor.getAllRecords({ id: cursor.id });
        var newRecords = generateNewRecords(allrecords);
        let fileList = newRecords[1];
        let fileNameList = [];
        for (let fileKey in fileList) {
            let params = {
                fileKey: fileKey,
                outPutFilePath: fileDir + fileKey
            };
            downloadPromise.push (kintoneFile.download(params));
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

backup().catch();


