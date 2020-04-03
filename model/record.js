const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var Schema = mongoose.Schema


var recordSchema = new Schema({
    appInfo: {},
    records: {},
    uploadFiles: {}
})

module.exports = mongoose.model('record', recordSchema);