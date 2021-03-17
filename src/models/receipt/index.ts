const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    number:String,
    meter:String,
    code:String,
    createdAt: Date,
    period:String,
    remainingAmount:Number,
    paymentAmount:Number,
    invoice:{type: ObjectId, ref: 'Invoice'},
    usage:{type: ObjectId, ref: 'Usage'},
    customer: {type: ObjectId, ref: 'Customer'},
    printDate:Date,
    isNextStage: Boolean,
}) 
schema.plugin(mongoosePaginate)
const Receipt = mongoose.model("Receipt",schema)
export default Receipt