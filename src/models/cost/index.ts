const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  ledgerName: String,
  ledgerCode: Number,
  amount: Number,
  accountCode: Number,
  mouth: Number,
  accountName: String,
  year: Number
})
schema.plugin(mongoosePaginate)
const Cost = mongoose.model("Cost", schema)
export default Cost