const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  area: { type: ObjectId, ref: "area" },
  areaCondition: { type: ObjectId, ref: "areaCondition" },
  documentNumber: String,
  issueDate: Date,
  subject: String,
  to: String,
  isPrint: Boolean,
  
  operationYear: Number,
  contractYear: Number,
  calendarYear: Number,

  calculation: 'Mixed',
  calculationId: { type: ObjectId, ref: "Calculation" },
  method: 'Mixed',
  details: String,
  content: String,
  repayment: Number,
  signature: String,
  approverName: String,
  approverPosition: String,
  remark: String,
  attachments: [String],
  attachmentsName: [String],
  createdIP: String,
  createdAt: Date,
  modifiedAt: Date,
})
schema.plugin(mongoosePaginate)
const CoverLetter = mongoose.model("CoverLetter", schema)
export default CoverLetter