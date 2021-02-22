const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  ledgerName: String,
  ledgerCode: Number,
  amount: Number,
  accountCode: Number,
  month: Number,
  accountName: String,
  year: Number,
  category: Number,
})
schema.plugin(mongoosePaginate)
const Estimate = mongoose.model("Estimate", schema)
export default Estimate