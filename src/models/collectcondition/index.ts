import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    sector:{type: ObjectId, ref: 'Sector'},
    collector:String,
    calculation:Number,
    period:String,
    province:String,
    paymentTerm:String,
    contributionType:String,
    maximumValue:Number,
    percentage:Number,
    fixCost:Number,
    actualCost:Number,
    profitType:String,
    lossType:String,
}) 
schema.plugin(paginate)
const Collectcondition = mongoose.model(" Collectcondition ",schema)
export default  Collectcondition 