const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  name: String,
  documentId: String,
  username: String,
  version: Number,
  from: 'Mixed',
  to: 'Mixed',
  createdAt: Date,
})
schema.pre('save', async function (next: NextFunction) {
  console.log("saving history...")
  next();
})
schema.plugin(mongoosePaginate)
const History = mongoose.model("History", schema)
export default History