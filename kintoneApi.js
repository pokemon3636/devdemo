const axios = require('axios');
const fs = require('fs');
const logger = require("./utils/logger").logger;

class kintoneApi {
    constructor(kintoneInfo) {
        this.preUrl = "https://" + kintoneInfo.domain;
        if (kintoneInfo.hasOwnProperty("apiToken")) {
            this.apiToken = kintoneInfo.apiToken;
        }
        else {
            let auth = new Buffer.from(kintoneInfo.username + ":" + kintoneInfo.password);
            this.authbase64 = auth.toString('base64');
        }
    }

    setRequestInfo(url, params, type) {
        let headers;
        if (this.apiToken) {
            headers = {
                'X-Cybozu-API-Token': this.apiToken
            }
        }
        else {
            headers = {
                'X-Cybozu-Authorization': this.authbase64
            }
        }
        let options = {
            method: type,
            baseURL: this.preUrl,
            url: url,
            headers: headers
        };
        if (type == "GET") {
            options.params = params;
        } else {
            options.data = params;
            options.headers["Content-Type"] = 'application/json';
        }
        return options;
    }

    getAppAcl(appid) {
        let url = "/k/v1/app/acl.json";
        let params = {
            app: appid
        };
        return axios(this.setRequestInfo(url, params, "GET")).then(res => {
            let rights = res.data;
            return rights.rights;
        }).catch(e => {
            logger.error("getAppAcl:" + JSON.stringify(e.response.data));
        });
    }

    updateAppAcl(appid, rights) {
        let url = "/k/v1/app/acl.json";
        let params = {
            app: appid,
            rights: rights
        };
        return axios(this.setRequestInfo(url, params, "PUT")).then(res => {
            return res.data;
        }).catch(e => {
            logger.error("updateAppAcl:" + JSON.stringify(e.response.data));
        });
    }

    async getAppIdlist(limit, offset) {
        let url = "/k/v1/apps.json";
        let params = {
            limit: limit,
            offset: offset
        };
        let option = this.setRequestInfo(url, params, "GET");
        return axios(option).then(res => {
            let apps = res.data.apps;
            let appidList = [];
            apps.forEach(app => {
                appidList.push(app.appId);
            });
            return appidList;
        }).catch(e => {
            logger.error("getAppIdlist:" + JSON.stringify(e.response.data));
        });
    }

    getFieldsIds(appid) {
        let url = "/k/api/dev/form/get.json";
        let params = {
            "app": appid
        }
        let request = this.setRequestInfo(url, params, "POST");
        return axios(request).then(res => {
            let result = { appid: appid, fieldList: [] };
            if (this.has(res.data, "result.schema.table.fieldList")) {
                var fieldList = res.data.result.schema.table.fieldList;
                result.fieldList = Object.values(fieldList);
            }
            return result;
        }).catch(e => {
            logger.error("getFieldsIds:" + JSON.stringify(e.response.data));
        });
    }

    exportCsv(res) {
        let url = "/k/api/record/exportCsv.json";
        let sort = '';
        res.fieldList.forEach(field => {
            if (field.type == "RECORD_ID") {
                sort = "f" + field.id;
            }
        });
        let params = {
            "charset": "UTF-8",
            "addBomUtf8": true,
            "separator": "COMMA",
            "outputHeader": true,
            "offset": 0,
            "app": res.appid,
            "q": "",
            "sort": [
                sort
            ],
            "order": [
                "DESC"
            ],
            "fields": res.fieldList
        };
        let request = this.setRequestInfo(url, params, "POST");
        return axios(request).then().catch(e => {
            logger.error("exportCsv:" + JSON.stringify(e.response.data));
        });
    }

    getLastCsvCreateAt() {
        let url = "/k/api/record/getCsvDownloadList.json";
        let params = { appId: null }
        return axios(this.setRequestInfo(url, params, "POST")).then(res => {
            let oldListData = res.data.result.available;
            let lastCreateAt = '';
            if (oldListData.length > 0) {
                for (let data of oldListData) {
                    let lastDate = data.createdAt;
                    lastCreateAt = Date.parse(lastDate);
                    break;
                }
            }
            return lastCreateAt;
        }).catch(e => {
            logger.error("getLastCsvCreateAt:" + JSON.stringify(e.response.data));
        });
    }

    getCsvDownloadList(startTime) {
        let url = "/k/api/record/getCsvDownloadList.json";
        let params = { appId: null }
        return axios(this.setRequestInfo(url, params, "POST")).then(res => {
            let available = res.data.result.available;
            let processing = res.data.result.processing;
            let downloadUrlList = [];
            for (let file of available) {
                let fileTime = Date.parse(file.createdAt);
                if (fileTime > startTime) {
                    let downloadUrl = this.preUrl + "/k/api/record/downloadCsvDownloadList.do/-/" + encodeURIComponent(file.fileName) + "?" + "uuid=" + file.uuid;
                    let fileInfo = {
                        fileName: file.fileName,
                        uuid: file.uuid,
                        downloadUrl: downloadUrl
                    }
                    downloadUrlList.push(fileInfo);
                }
                else {
                    break;
                }
            }
            let result = { available: downloadUrlList, processing: processing };
            return result;
        }).catch(e => {
            logger.error("getCsvDownloadList:" + JSON.stringify(e.response.data));
        });
    }

    downloadFiles(dirpath, downloadUrlList) {
        downloadUrlList.forEach(
            fileInfo => {
                let request = this.setRequestInfo(fileInfo.downloadUrl, '', "GET");
                request.responseType = 'stream';
                axios(request).then(response => {
                    const rs = response.data;
                    let dir = dirpath + fileInfo.fileName;
                    if (fs.existsSync(dir)) {
                        let oldFileName = fileInfo.fileName.replace(/(.*\/)*([^.]+).*/ig, "$2");
                        dir = dirpath + oldFileName + fileInfo.uuid + ".csv";
                    }
                    const ws = fs.createWriteStream(dir);
                    rs.pipe(ws);
                }).catch(e => {
                    logger.error("downloadFiles:" + JSON.stringify(e.response.data));
                });
            }
        )
    }

    has(obj, key) {
        return key.split(".").every(function (x) {
            if (typeof obj != "object" || obj === null || !x in obj)
                return false;
            obj = obj[x];
            return true;
        });
    }

    deleteData(appId) {
        let url = "/k/api/record/deleteBulkRecords.json";
        let params = {
            app: appId,
            query: { q: "" }
        };
        return axios(this.setRequestInfo(url, params, "POST")).then().catch(e => {
            logger.error("deleteData:" + JSON.stringify(e.response.data));
        });
    }

    updateUserInfo(userInfo) {
        let url = "/v1/users.json";
        let params = {
            users: userInfo
        };
        return axios(this.setRequestInfo(url, params, "PUT")).then().catch(e => {
            logger.error("updateUserInfo:" + JSON.stringify(e.response.data));
        });
    }

    updateRecord(params) {
        let url = "/k/v1/record.json";
        return axios(this.setRequestInfo(url, params, "PUT")).then().catch(e => {
            logger.error("updateRecord:" + JSON.stringify(e.response.data));
        });
    }
}
module.exports = kintoneApi;



