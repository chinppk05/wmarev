const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  name: String,
  address: String,
  currentMeter: String,
  meters: String,
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const Customer = mongoose.model("Customer", schema)
export default Customer