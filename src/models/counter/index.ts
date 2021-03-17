const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  name: String,
  sequence: Number,
  year: Number,
  createdIP: String,
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const Counter = mongoose.model("Counter", schema)
export default Counter