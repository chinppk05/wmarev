import mongoose from "mongoose"
import paginate from "mongoose-paginate"
const Schema = mongoose.Schema
const schema = new Schema({
  prefix: String,
  firstName: String,
  lastName: String,
  address: String,
  province: String,
  district: String,
  subDistrict: String,
  postal: String,
  taxId: String

})
schema.plugin(paginate)
const Customer = mongoose.model("Customer", schema)
export default Customer