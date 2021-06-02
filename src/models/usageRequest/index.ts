const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  name:String,
  meter: String,
  date: Date,
  invoiceNumber:String,
  address:String,
  moo:String,
  soi:String,
  street:String,
  subDistrict:String,
  district:String,
  province:String,
  tel:String,
  complaint:[String],
  payment:[String],
  complaintDetail:String,
  note:String,
  fileUrl: String,
})
schema.plugin(mongoosePaginate)
const UsageRequest = mongoose.model("UsageRequest", schema)
export default UsageRequest