const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  uuid: String,
  email:String,
  isReset: Boolean,
  expiredAt: Date,
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const resetpassword = mongoose.model("resetpassword", schema)
export default resetpassword