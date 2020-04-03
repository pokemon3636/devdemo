const mongoose = require('mongoose');

const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var Schema = mongoose.Schema


var userSchema = new Schema({
    name: String,
    password: String,
    role: String
})

module.exports = mongoose.model('user', userSchema);