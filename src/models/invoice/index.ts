const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const Schema = mongoose.Schema
import Counter from "../counter";
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  meter: String,
  number: String,
  createdAt: Date,
  period: String,
  address: String,
  category: String,
  rate:Number,
  year: Number,
  month: Number,
  usage: {type:ObjectId,ref:"Usage"},
  condition: {type:ObjectId,ref:"Condition"},
  totalAmount: Number,
  isNextStage: Boolean,

})
schema.plugin(mongoosePaginate)
const Invoice = mongoose.model("Invoice", schema)
export default Invoice