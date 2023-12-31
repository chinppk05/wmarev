const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  name: String,
  province: String,
  amount: Number,
  collectType: String,
  A: Number,
  B: Number,
  percentage: Number

})
schema.plugin(mongoosePaginate)
const CollectionInvoice = mongoose.model("CollectionInvoice", schema)
export default CollectionInvoice