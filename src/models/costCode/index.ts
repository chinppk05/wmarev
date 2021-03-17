const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  code: String,
  name: String,
})
schema.plugin(mongoosePaginate)
const CostCode = mongoose.model("CostCode", schema)
export default CostCode