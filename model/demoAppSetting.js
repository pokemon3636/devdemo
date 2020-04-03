const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var Schema = mongoose.Schema


var demoAppSettingSchema = new Schema({
    appInfo: {},
    ids: {},
    isNeedRecords: {}
})

module.exports = mongoose.model('demoAppSetting', demoAppSettingSchema);