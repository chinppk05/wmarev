const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  name: String,
  area: { type: ObjectId, ref: "Area" },

  oerationDate:Date,
  operationYear:Number,
  calendarYear:Number,
  contractYear:Number,

  conditions: [{
    category: String,
    value: String,
    valueProfit: String,
    valueLoss: String,
    value2: String,
    description: String,
    collector: String,
    calculation: String,
    period: String,
}],


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