const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    customer: {type: ObjectId, ref: 'Customer'},
    date:Date,
    rate:Number,
    time: Number,
    amount:Number,
    method:String,
    period:String,
    isNextStage: Boolean,
    invoice:{type: ObjectId, ref: 'Invoice'},
}) 
schema.plugin(mongoosePaginate)
const Payment = mongoose.model("Payment",schema)
export default Payment