const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  collection: String,
  documentId: String,
  username: String,
  version: Number,
  from: 'Mixed',
  to: 'Mixed',
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const History = mongoose.model("History", schema)
export default History