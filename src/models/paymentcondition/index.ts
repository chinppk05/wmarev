const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const schema = new Schema({
  name: String,
  rate: Number

})
schema.plugin(mongoosePaginate)
const PaymentCondition = mongoose.model("PaymentCondition", schema)
export default PaymentCondition