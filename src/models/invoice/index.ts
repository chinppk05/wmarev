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
  createdAt: Date,
  taxId: String,
  period: String,
  name: String,
  address: String,
  category: String,
  qty: Number,
  rate: Number,
  year: Number,
  month: Number,
  area: { type: ObjectId, ref: "Contract" },
  usage: { type: ObjectId, ref: "Usage" },
  condition: { type: ObjectId, ref: "Condition" },
  totalAmount: Number,
  isNextStage: Boolean,
  isPaid: { type: Boolean, default: false },

})
schema.plugin(mongoosePaginate)
const Invoice = mongoose.model("Invoice", schema)
export default Invoice