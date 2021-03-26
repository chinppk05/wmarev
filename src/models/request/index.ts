const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  requestType: String,
  list: [String],
  reason: String,
  status: String,

  priority: String,

  requester: { type: ObjectId, ref: "user" },
  approver: { type: ObjectId, ref: "user" },

  approvedDate: Date,
  requestDate: Date,
  remark: String,
  views: Number,

  createdIP: String,
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const Request = mongoose.model("Request", schema)
export default Request