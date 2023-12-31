const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  requestType: String,
  username: String,
  list: [String],
  reason: String,
  status: String,
  priority: String,
  requester: { type: ObjectId, ref: "User" },
  approver: { type: ObjectId, ref: "User" },

  fileUrl:String,
  from:"Mixed",
  to:"Mixed",

  approvedDate: Date,
  requestDate: Date,
  signDate: Date,
  remark: String,
  note: String,
  views: Number,

  createdIP: String,
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const Request = mongoose.model("Request", schema)
export default Request

