const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  areaId: { type: ObjectId, ref: "area" },
  area: String,
  problemType: String,
  problem: String,
  solution: String,
  active: Boolean,
  createdIP: String,
  createdAt: Date,
  modifiedAt: Date,
})
schema.plugin(mongoosePaginate)
const Risk = mongoose.model("Risk", schema)
export default Risk