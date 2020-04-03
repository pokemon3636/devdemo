const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var Schema = mongoose.Schema


var appFormSchema = new Schema({
    appInfo: {},
    name: {
        type: String,
        require: true
    },
    generalSettings: {},
    fields: {},
    layout: {},
    views: {},
    customizeSettings: {},
    appStatus: {},
    appAcl: {},
    fieldAcl: {},
    recordAcl: {},
    uploadFiles: {}
})

module.exports = mongoose.model('appForm', appFormSchema);