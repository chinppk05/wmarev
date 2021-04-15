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
  date: Date,
  time: Number,
  sequence: String,
  invoiceAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  
  invoiceNumber: String,
  amount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  name: String,
  code: String,
  address: String,
  meter: String,
  category: String,
  categoryType: String,
  method: String,
  period: String,
  isNextStage: Boolean,
  invoice: { type: ObjectId, ref: 'Invoice' },
  usage: { type: ObjectId, ref: 'Usage' },
  customer: { type: ObjectId, ref: 'Customer' },
  qty: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  rate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  vatRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  paymentAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },

  debtText: String,
  debtAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },

  paidDate: Date,
  printDate: Date,
  calculationType: String,
  paymentDate: Date,
  createdAt: Date,
  year: Number,
  month: Number,
})

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true, useFindAndModify: false };
  Counter.findOneAndUpdate(
    { name: "Payment", year: this.year },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let sequence
      if (this.sequence) sequence = this.sequence
      else
        sequence = doc.year.toString().slice(-2) + (this.category ?? "9") + doc.sequence.toString().padStart(7, "0");
      // console.log(this)
      let recordDate = DateTime.fromObject({ day: 15, month: this.month, year: this.year - 543 }).toJSDate()
      Payment.findOneAndUpdate({ _id: this._id }, { $set: { sequence, recordDate } }).exec()
      next();
    }
  );
});

schema.set('toJSON', {
  getters: true,
});


schema.plugin(mongoosePaginate)
const Payment = mongoose.model("Payment", schema)
export default Payment