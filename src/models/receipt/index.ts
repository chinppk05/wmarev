const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    number:Number,
    numberInit:String,
    meter:String,
    category: String,
    categoryType: String,
    code:String,
    name:String,
    address:String,
    period:String,
    signature:String,
    qty: Number,
    rate: Number,
    remainingAmount:Number,
    debtText:String,
    debtAmount:Number,
    paymentAmount:Number,
    invoiceNumber:String,
    invoice:{type: ObjectId, ref: 'Invoice'},
    usage:{type: ObjectId, ref: 'Usage'},
    customer: {type: ObjectId, ref: 'Customer'},
    year:{ type: Number, default: 0 },
    month: Number,
    paidDate:Date,
    printDate:Date,
    isNextStage: Boolean,
    isPrint: Boolean,
    calculationType:String,
    description:String,
    createdAt: Date,
}) 
schema.plugin(mongoosePaginate)
const Receipt = mongoose.model("Receipt",schema)
export default Receipt