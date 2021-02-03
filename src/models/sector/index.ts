import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    name:String,
    address:String,
    contractStart:Date,
    contractSigned:Date,
    province:String,
    district:String,
    subDistrict:String,
    signedBy:String,
    signedPosition:String,
    activeYear:Number,
}) 
schema.plugin(paginate)
const Sector = mongoose.model("Sector",schema)
export default Sector