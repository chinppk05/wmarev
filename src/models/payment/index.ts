import mongoose from "mongoose"
import paginate from "mongoose-paginate"
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
    invoice:{type: ObjectId, ref: 'Invoice'},
}) 
schema.plugin(paginate)
const Payment = mongoose.model("Payment",schema)
export default Payment