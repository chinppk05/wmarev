const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
import { NextFunction } from "express";
const bcrypt = require("bcryptjs")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  }, //ชื่อผู้ใช้
  password: String,//รหัสผ่าน
  accessLevel: Number, //สิทธิการใช้งาน
  access: [String],
  position: String, // ตำแหน่ง
  prefix: String, //คำนำหน้า
  firstName: String, //ชื่อต้น
  lastName: String, //นามสกุล
  sector:String,
  manager: {type:ObjectId,ref:"User"},
  lastLogin: Date,
  createdIP: String,
  createdAt: Date, 
})
schema.pre('save', async function (next: NextFunction) {
  const user = this; //'this' refers to the current document about to be saved
  const hash = await bcrypt.hash(this.password, 8);
  this.password = hash;
  next();
})
schema.methods.isValidPassword = async function (password: string) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
}
schema.plugin(mongoosePaginate)
const User = mongoose.model("User", schema)
export default User