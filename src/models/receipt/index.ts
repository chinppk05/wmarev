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
  no: Number,
  sequence: { type: String, index: true },
  meter: String,
  oldMeter: String,
  oldMeter2: String,
  oldMeter3: String,
  status: String,
  category: String,
  categoryType: String,
  code: String,
  name: String,
  address: String,
  period: String,
  signature: String,
  debtText: String,

  taxRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  qty: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  rate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  remainingAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  vatRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  vat: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  billAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  debtAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  debtVat: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  previousAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  totalAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  paymentAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  invoiceAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },

  invoiceNumber: String,
  invoice: { type: ObjectId, ref: 'Invoice' },
  invoices: [String],
  invoicesYearMonth: [{
    year: Number,
    month: Number
  }],
  usage: { type: ObjectId, ref: 'Usage' },
  customer: { type: ObjectId, ref: 'Customer' },
  year: { type: Number, default: 0 },
  month: Number,
  paidDate: Date,
  printDate: Date,
  paymentDate: Date,
  isNextStage: Boolean,
  processing: Boolean,
  paids:[Object],

  isRequested: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isSigned: { type: Boolean, default: false },

  isPrint: { type: Boolean, default: false },
  calculationType: String,
  description: String,
  createdAt: Date,
  isPaidOver: Boolean,
  isPaidUnder: Boolean,
  isPaidExact: Boolean,
  notes: String,
  ref: String,
  excelNum: { type: Number },
  tempSequence: String
})

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true, useFindAndModify: false };
  if (this.sequence === undefined) {
    let payment = DateTime.fromJSDate(this.paymentDate)
    if(!payment) payment = DateTime.now()
    let month = (payment.month ?? (new Date().getMonth() + 1)) - 2
    let year = (payment.year ?? new Date().getFullYear()) + 543
    if (month > 10) year = year + 1
    console.log(this)
    Counter.findOneAndUpdate(
      { name: "Receipt", year: year, category: this.category },
      { $inc: { sequence: 1 } },
      options,
      async (err: Error, doc: any) => {
        console.log(year, this.category,doc )
        let sequence
        if (this.sequence != undefined) sequence = this.sequence
        else sequence = doc.year.toString().slice(-2) + (this.category ?? "9") + doc.sequence.toString().padStart(6, "0");
        let recordDate = DateTime.fromObject({ day: 15, month: month, year: year - 543 }).toJSDate()
        // console.log("sequence for receipt ", sequence)
        await Receipt.findOneAndUpdate({ _id: this._id }, { $set: { sequence, recordDate } }).exec()
        next();
      }
    );
  }
});

/*
schema.pre(/findOne/g, async function (next: NextFunction) {
  if(this.processing!==true) next()
  var options = { upsert: true, new: true, useFindAndModify: false };
  let year = (this.year + 0)
  if(this.month > 10) year = year + 1
  Counter.findOneAndUpdate(
    { name: "Receipt", year: year, category: this.category },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let sequence
      if (this.sequence != undefined) sequence = this.sequence
      else {
        console.log('pre',this._update['$set'])
        try {
          sequence = this._update['$set'].year.toString().slice(-2) + (this.category ?? "9") + doc.sequence.toString().padStart(7, "0");
        } catch (error) {
          sequence = "0000000000"
        }
      }
      let recordDate = DateTime.fromObject({ day: 15, month: this.month, year: this._update.year - 543 }).toJSDate()
      // console.log("sequence for receipt ", sequence)
      this.processing = false
      Receipt.findOneAndUpdate({ _id: this._id }, { $set: { sequence, recordDate } }).exec()
      next();
    }
  );
});
*/

schema.virtual('taxDebt').get(function () {
  return parseFloat((this.debtAmount * this.vatRate).toFixed(2))
});
schema.virtual('taxAmount').get(function () {
  return parseFloat((this.qty * this.rate * this.vatRate).toFixed(2))
});

schema.set('toJSON', {
  getters: true,
});

schema.plugin(mongoosePaginate)
const Receipt = mongoose.model("Receipt", schema)
export default Receipt