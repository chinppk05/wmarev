import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  customer: {type:ObjectId,ref:"Customer"},
  meter: String,
  qty: Number,
  firstName: String,
  lastName: String,
  address: String,
  period: String

})
schema.plugin(paginate)
const Usage = mongoose.model("Usage", schema)
export default Usage