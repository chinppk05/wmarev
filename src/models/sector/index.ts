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
    signedBy:String,
    signedPosition:String,
    activeYear:Number,
    accountCode:Number
}) 
schema.plugin(mongoosePaginate)
const Sector = mongoose.model("Sector",schema)
export default Sector