const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  sector: {type:ObjectId,ref:"Sector"},
  name: String,
  province: String,
  amount: Number,
  collectType: String,
  A: Number,
  B: Number,
  percentage: Number

})
schema.plugin(mongoosePaginate)
const CollectionEstimate = mongoose.model("CollectionEstimate", schema)
export default CollectionEstimate