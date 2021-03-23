const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    name: String,
    address: String,
    contractNumber: String,
    contractStart: Date,
    contractEnd: Date,
    contractSigned: Date,
    contractLaunch: Date,
    contractYear:Number,
    province: String,
    district: String,
    subDistrict: String,
    postal: String,
    signedBy: String,
    signedPosition: String,
    fileUrl1:[String],
    fileUrl2:[String],
})
schema.plugin(mongoosePaginate)
const Area = mongoose.model("Area", schema)
export default Area