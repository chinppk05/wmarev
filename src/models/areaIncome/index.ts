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
  // isDebt: { type: Boolean, detault: false },
  isDebt:Boolean,
  value: String,
  value2: String,

  remark1:String,
  remark2:String,
  remark3:String,
  remark4:String,
  text1:String,
  text2:String,
  text3:String,
  text4:String,
  number1:Number,
  number2:Number,
  number3:Number,
  number4:Number,

  createdAt: Date,
  recordDate: Date,
})
schema.plugin(mongoosePaginate)
const AreaIncome = mongoose.model("AreaIncome", schema)
export default AreaIncome