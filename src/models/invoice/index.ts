import { NextFunction } from "express";
import Counter from "../counter";
import { getDecimal, setDecimal } from "../../helpers/decimal"
import { DateTime } from "luxon"
const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const Decimal = mongoose.Schema.Types.Decimal
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  no: Number,
  meter: String,
  number: Number,
  sequence: String,
  taxId: String,
  code: String,
  name: String,
  signature: String,
  address: String,
  category: String,
  categoryType: String,

  invoice: { type: ObjectId, ref: 'Invoice' },
  usage: { type: ObjectId, ref: 'Usage' },

  debtText: String,
  debtAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },

  qty: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  rate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  year: { type: Number, default: 0 },
  month: Number,
  area: { type: ObjectId, ref: "Contract" },
  condition: { type: ObjectId, ref: "Condition" },
  totalAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  invoiceAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  vatRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  tax: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  isNextStage: Boolean,
  isPrint: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  paidReceipt: String,
  calculationType: String,
  printDate: Date,
  createdAt: Date,
  ref: String,
  notes: String,
  invoiceDate: Date,
})

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true, useFindAndModify: false };
  Counter.findOneAndUpdate(
    { name: "Invoice", year: this.year },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let sequence
      if (this.sequence) sequence = this.sequence
      else
        sequence = doc.year.toString().slice(-2) + (this.category ?? "9") + doc.sequence.toString().padStart(7, "0");
      let recordDate = DateTime.fromObject({ day: 15, month: this.month, year: this.year - 543 }).toJSDate()
      // console.log(sequence)
      Invoice.findOneAndUpdate({ _id: this._id }, { $set: { sequence, recordDate } }).exec()
      next();
    }
  );
});

schema.set('toJSON', {
  getters: true,
});

schema.plugin(mongoosePaginate)
const Invoice = mongoose.model("Invoice", schema)
export default Invoice