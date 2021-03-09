const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  customer: {type:ObjectId,ref:"Customer"},
  meter: String,
  taxId: String,
  qty: Number,
  name: String,
  firstName: String,
  lastName: String,
  address: String,
  period: String,
  area: String,
  category: Number,
  year: Number,
  month: Number,
  fileUrl:[String],
  note: String,
  flatRate: Number,
})
schema.plugin(mongoosePaginate)
const Usage = mongoose.model("Usage", schema)
export default Usage