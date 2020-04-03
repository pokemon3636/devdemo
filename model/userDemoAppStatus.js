const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true });

var Schema = mongoose.Schema

var userDemoAppStatusSchema = new Schema({
    domain: String,
    includeApps: {}
})

module.exports = mongoose.model('userDemoAppStatus', userDemoAppStatusSchema);