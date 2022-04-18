const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  name: String,
  description: String,
  percent: Number,
  status: String,
  year: Number,
  month: Number,
  yearText: Number,
  monthText: Number,
  historyText:String,
  history:[String],
  success: Number,
  failed:Number,
  createdIP: String,
  createdAt: Date,
  modifiedAt: Date,
})
schema.plugin(mongoosePaginate)
const Task = mongoose.model("Task", schema)
export default Task