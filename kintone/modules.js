const kintone = require('@kintone/kintone-js-sdk');

class kintoneModule {
    constructor(userInfo) {
        let auth = new kintone.Auth();
        const passwordAuthParam = {
            username: userInfo.username,
            password: userInfo.password
        };
        auth.setPasswordAuth(passwordAuthParam);
        const connParam = {
            domain: userInfo.domain,
            auth: auth
        };
        this.kintoneConnection = new kintone.Connection(connParam);
        connParam.user = true;
        this.kintoneUserConnection = new kintone.Connection(connParam);
    }
    getAppModule() {
        let connection = this.kintoneConnection
        return new kintone.App({ connection });
    }
    getRecordModule() {
        let connection = this.kintoneConnection
        return new kintone.Record({ connection });
    }
    getRecordCursorModule() {
        let connection = this.kintoneConnection
        return new kintone.RecordCursor({ connection });
    }

    getFileModule() {
        let connection = this.kintoneConnection
        return new kintone.File({ connection });
    }
    getUserModule() {
        let connection = this.kintoneUserConnection
        return new kintone.Member({ connection });
    }
}

module.exports = kintoneModule;