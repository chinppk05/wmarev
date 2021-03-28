const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  area: String,
  documentNumber: String,
  issueDate: Date,
  subject: String,
  to: String,
  calculation: { type: ObjectId, ref: "Calculation" },
  method:'Mixed',
  details: String,
  content:String,
  repayment:Number,
  signature:String,
  remark:String,
  attachments: [String],
  attachmentsName: [String],
  createdIP:String,
  createdAt:Date,
})
schema.plugin(mongoosePaginate)
const CoverLetter = mongoose.model("CoverLetter", schema)
export default CoverLetter