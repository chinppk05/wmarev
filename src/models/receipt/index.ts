import { NextFunction } from "express";
import Counter from "../counter";
import { getDecimal, setDecimal } from "../../helpers/decimal"
import { DateTime } from "luxon"

const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema;
const Decimal = mongoose.Schema.Types.Decimal
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  number: Number,
  sequence: String,
  meter: String,
  category: String,
  categoryType: String,
  code: String,
  name: String,
  address: String,
  period: String,
  signature: String,
  taxRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  qty: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  rate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  remainingAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  vatRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  debtAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  previousAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  totalAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  paymentAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  invoiceAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  
  invoiceNumber: String,
  invoice: { type: ObjectId, ref: 'Invoice' },
  usage: { type: ObjectId, ref: 'Usage' },
  customer: { type: ObjectId, ref: 'Customer' },
  year: { type: Number, default: 0 },
  month: Number,
  paidDate: Date,
  printDate: Date,
  isNextStage: Boolean,
  isPrint: Boolean,
  calculationType: String,
  description: String,
  createdAt: Date,
})

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true, useFindAndModify: false };
  Counter.findOneAndUpdate(
    { name: "Receipt", year: this.year },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let sequence
      if (this.sequence) sequence = this.sequence
      else
        sequence = doc.year.toString().slice(-2) + (this.category ?? "9") + doc.sequence.toString().padStart(7, "0");
      let recordDate = DateTime.fromObject({ day: 15, month: this.month, year: this.year - 543 }).toJSDate()
      Receipt.findOneAndUpdate({ _id: this._id }, { $set: { sequence, recordDate } }).exec()
      next();
    }
  );
});

schema.set('toJSON', {
  getters: true,
});

schema.plugin(mongoosePaginate)
const Receipt = mongoose.model("Receipt", schema)
export default Receipt