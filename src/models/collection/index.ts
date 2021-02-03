import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  sector: {type:ObjectId,ref:"Sector"},
  name: String,
  province: String,
  amount: Number,
  collectType: String,
  A: Number,
  B: Number,
  percentage: Number

})
schema.plugin(paginate)
const Collection = mongoose.model("Collection", schema)
export default Collection