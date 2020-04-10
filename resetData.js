const config = require("./config");
const kintoneApi = require("./kintoneApi");
const resetDemoData = require("./resetDemoDatas");
const utils = require("./utils/utils");
const kintoneDemo = new kintoneApi(config.kintoneInfo);
const kintoneKviewer = new kintoneApi(config.kintoneViewer);

resetDemoData.resetData();
let newpw = utils.createPassword();
updateUserInfo().then(updateKviewData);

function updateUserInfo() {
    let userInfo = [
        {
            "code": "demo-guest",
            "valid": true,
            "password": newpw,
            "name": "demo-guest"
        }
    ]
    return kintoneDemo.updateUserInfo(userInfo);
}

function updateKviewData() {
    let body = {
        "app": config.kintoneViewer.appId,
        "id": config.kintoneViewer.recordId,
        "record": {
            "password": {
                "value": newpw
            }
        }
    }
    return kintoneKviewer.updateRecord(body);
}

