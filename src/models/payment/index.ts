const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    date: Date,
    time: Number,
    invoiceAmount:Number,
    invoiceNumber:String,
    amount: Number,
    name:String,
    code:String,
    address:String,
    meter:String,
    category:String,
    categoryType: String,
    method: String,
    period: String,
    isNextStage: Boolean,
    invoice: { type: ObjectId, ref: 'Invoice' },
    usage: { type: ObjectId, ref: 'Usage' },
    customer: { type: ObjectId, ref: 'Customer' },
    qty: Number,
    rate: Number,
    paidDate:Date,
    printDate:Date,
    createdAt: Date,
})
schema.plugin(mongoosePaginate)
const Payment = mongoose.model("Payment", schema)
export default Payment