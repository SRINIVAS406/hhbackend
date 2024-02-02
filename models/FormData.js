const mongoose = require('mongoose');

const FormDataSchema = new mongoose.Schema({
    name : String,
    email: String,
    password: String,
    child:Array,
    job:String,
    companyname:String,
    parentId:String,
    skill:String,
    about:String,
    active:{ type: Boolean, default: false }
})

const FormDataModel = mongoose.model('hhusers', FormDataSchema);

module.exports = FormDataModel;
