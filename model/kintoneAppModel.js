// const fs = require('fs');
const appFormdb = require("./appForm");
const recorddb = require("./record");
const userDemoAppStatusdb = require("./userDemoAppStatus");
const demoAppSettingdb = require("./demoAppSetting");
const kintoneUserdb = require("./kintoneUser");
const appCategory = require("./appCategory");

class kintoneAppModel {
    static saveAppConfig(appFormJson) {
        appFormdb.findOneAndUpdate({ appInfo: appFormJson.appInfo }, appFormJson, { upsert: true }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    static saveRecords(recordsJson) {
        recorddb.findOneAndUpdate({ appInfo: recordsJson.appInfo }, recordsJson, { upsert: true }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    static async getAppConfig(appInfo) {
        return await appFormdb.findOne(appInfo).exec();
    }

    static async getRecords(appInfo) {
        return await recorddb.findOne(appInfo).exec();
    }

    static async getUserDemoAppStatus(domain) {
        return await userDemoAppStatusdb.findOne({ domain: domain }).exec();
    }

    static setUserDemoAppStatus(configJson) {
        userDemoAppStatusdb.findOneAndUpdate({ domain: configJson.domain }, configJson, { upsert: true }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    static async getDemoAppSetting() {
        return await demoAppSettingdb.findOne().exec();
    }

    static setDemoAppSetting(configJson) {
        demoAppSettingdb.findOneAndUpdate({}, configJson, { upsert: true }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    static saveUsers(usersJson) {
        kintoneUserdb.findOneAndUpdate({ domain: usersJson.domain }, usersJson, { upsert: true }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    static async getUsers(domain) {
        return await kintoneUserdb.findOne(domain).exec();
    }

    static async getAppCategoryList() {
        return await appCategory.find().exec();
    }

    //获取分类by packagename
    static async getAppCategory(packageName) {
        return await appCategory.findOne({ packageName: packageName }).exec();
    }

    //获取多个分类 by packagename
    static async getAppCategories(packageNameArray) {
        return await appCategory.find({ packageName: { $in: packageNameArray } }).exec();
    }

    static setAppCategory(cateInfo) {
        appCategory.findOneAndUpdate({ packageName: cateInfo.packageName }, cateInfo, { upsert: true }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    static deleteAppCategory(packageName) {
        appCategory.deleteOne({ packageName: packageName }, function (err, data) {
            if (err) return console.log(err)
        });
    }

    //获取多个app conf  by appinfo
    static async getAppConfigs(appInfo) {
        return await appFormdb.find({ appInfo: { $in: appInfo } }).exec();
    }
}

module.exports = kintoneAppModel;
