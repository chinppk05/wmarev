import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  meter: String,
  number: String,
  createdAt: Date,
  period: String,
  address: String,
  usage: {type:ObjectId,ref:"Usage"},
  condition: {type:ObjectId,ref:"Condition"},
  totalAmount: Number

})
schema.plugin(paginate)
const Invoice = mongoose.model("Invoice", schema)
export default Invoice