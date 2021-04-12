const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
import { NextFunction } from "express";
import Counter from "../counter";
const Schema = mongoose.Schema;
const Decimal = mongoose.Schema.Types.Decimal
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  customer: { type: ObjectId, ref: "Customer" },
  number: Number,
  meter: String,
  taxId: String,
  name: String,
  code: String,
  firstName: String,
  lastName: String,
  address: String,
  period: String,
  area: { type: ObjectId, ref: "Contract" },
  category: String,
  categoryType: String,
  year: Number,
  month: Number,
  remark: String,
  fileUrl: String,
  note: String,
  qty: { type: Decimal, get: getDecimal, set: setDecimal },
  rate: { type: Decimal, get: getDecimal, set: setDecimal },
  flatRate: { type: Decimal, get: getDecimal, set: setDecimal },
  isNextStage: Boolean,
  calculationType: String,
  createdAt: Date,
});

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true, useFindAndModify: false };
  Counter.findOneAndUpdate(
    { name: "Usage", year: new Date().getFullYear() },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      this.number = doc.sequence;
      next();
    }
  );
});
schema.plugin(mongoosePaginate);
const Usage = mongoose.model("Usage", schema);

schema.set('toJSON', {
  getters: true,
  transform: (doc: any, ret: any) => {
    ret.amount = ret.rate * ret.qty
    delete ret.__v;
    return ret;
  },
});

function getDecimal(num: any) {
  return parseFloat(num)/100;
}

function setDecimal(num: number) {
  return Math.round(num * 100);
}

export default Usage;
