const mongoose = require('mongoose');

const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var Schema = mongoose.Schema


var kintoneUserSchema = new Schema({
    domain: {},
    users: {},
    organizations: {},
    groups: {}
    // userGroups: {},
    // userOrganizations: {}
})

module.exports = mongoose.model('kintoneUser', kintoneUserSchema);