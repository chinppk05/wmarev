import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema
const schema = new Schema({
    name:String,
rate:Number

}) 
schema.plugin(paginate)
const PaymentCondition = mongoose.model("PaymentCondition",schema)
export default PaymentCondition