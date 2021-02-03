const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
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
schema.plugin(mongoosePaginate)
const Collectcondition = mongoose.model(" Collectcondition ",schema)
export default  Collectcondition 