const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  name: String,
  area: { type: ObjectId, ref: "Area" },
  condition: { type: ObjectId, ref: "AreaCondition" },

  category: String,
  fileUrl: [String],
  amount: Number,
  year: Number,
  month: Number,
  quarter: Number,
  isDebt: Boolean,
  value: String,
  value2: String,

  createdAt:Date,
  recordDate:Date,
})
schema.plugin(mongoosePaginate)
const AreaIncome = mongoose.model("AreaIncome", schema)
export default AreaIncome