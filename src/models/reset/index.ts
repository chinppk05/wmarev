const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const bcrypt = require("bcryptjs")
import { v4 as uuidv4 } from 'uuid';
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  username: String,
  userId: String,
  uuid: String,
  expires: Date, 
  createdIP: String,
  createdAt: Date, 
})
schema.pre('save', async function (next: NextFunction) {
  var date = new Date();
  this.uuid = uuidv4();
  this.createdAt = new Date()
  this.expires = date.setDate(date.getDate() + 5);
  next();
})
schema.plugin(mongoosePaginate)
const Reset = mongoose.model("Reset", schema)
export default Reset