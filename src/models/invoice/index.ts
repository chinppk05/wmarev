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
schema.pre("save", async function (next: NextFunction) {
  let data = this
  var options = { upsert: true, new: true,useFindAndModify: false };
  let type = this.category.replace("ประเภทที่ ")
  Counter.findOneAndUpdate(
    { name: "Invoice", year: new Date().getFullYear() },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let year = (new Date().getFullYear() + 543).toString()
      let yearString = year.substring(2, 4);
      data.number = yearString + type + doc.sequence;
      next();
    }
  );
});
schema.plugin(mongoosePaginate)
const Invoice = mongoose.model("Invoice", schema)
export default Invoice