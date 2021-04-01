const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const Schema = mongoose.Schema
import Counter from "../counter";
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  meter: String,
  number: Number,
  numberInit: String,
  taxId: String,
  code:String,
  period: String,
  name: String,
  signature:String,
  address: String,
  category: String,
  categoryType: String,
  qty: { type: Number, default: 0 },
  rate:{ type: Number, default: 0 },
  year:{ type: Number, default: 0 },
  month: Number,
  area: { type: ObjectId, ref: "Contract" },
  usage: { type: ObjectId, ref: "Usage" },
  condition: { type: ObjectId, ref: "Condition" },
  totalAmount: Number,
  isNextStage: Boolean,
  isPrint: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  createdAt: Date,

})
schema.plugin(mongoosePaginate)
const Invoice = mongoose.model("Invoice", schema)
export default Invoice