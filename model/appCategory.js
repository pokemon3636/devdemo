const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true });

var Schema = mongoose.Schema

 //todo package需要加唯一索引
var appCategorySchema = new Schema({
    domain: String,
    packageName: String, 
    ids:{}
})

module.exports = mongoose.model('appCategory', appCategorySchema);