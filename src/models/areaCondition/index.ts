const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  name: String,
  area: { type: ObjectId, ref: "Area" },

  operationYear:Number,
  calendarYear:Number,
  category: String,
  contributionPercent: Number,
  contributionLimit: Number,
  profitType: Number,
  lossType: Number,
  description: String,
  collector: String,
  calculation: String,
  period: String,

})
schema.plugin(mongoosePaginate)
const AreaCondition = mongoose.model("AreaCondition", schema)
export default AreaCondition