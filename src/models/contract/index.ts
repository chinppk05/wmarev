const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    name:String,
    address:String,
    contractStart:Date,
    contractSigned:Date,
    province:String,
    district:String,
    subDistrict:String,
    postal:String,
    signedBy:String,
    signedPosition:String,
    activeYear:Number,
    accountCode:Number,
    description:String,
    fileUrl:String,
}) 
schema.plugin(mongoosePaginate)
const Contract = mongoose.model("Contract",schema)
export default Contract