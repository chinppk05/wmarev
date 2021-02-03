import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
    name:String,
    address:String,
    contractStart:Date,
    contractSign:String,
    province:String,
    district:String,
    subDistrict:String,
    signedBy:String,
    signedPosition:String,
    activeYear:Date,
}) 
schema.plugin(paginate)
const Sector = mongoose.model("Sector",schema)
export default Sector