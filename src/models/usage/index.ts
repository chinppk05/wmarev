import { NextFunction } from "express";
import Counter from "../counter";
import { getDecimal, setDecimal } from "../../helpers/decimal"
import { DateTime } from "luxon"
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const Schema = mongoose.Schema;
const Decimal = mongoose.Schema.Types.Decimal
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  customer: { type: ObjectId, ref: "Customer" },
  no: Number,
  sequence: { type: String, index: true },
  invoiceSequence: { type: String, index: true },
  meter: String,
  oldMeter: String,
  oldMeter2: String,
  oldMeter3: String,
  taxId: String,
  name: String,
  code: String,
  excelNum: Number,
  firstName: String,
  lastName: String,
  address: String,
  period: String,
  area: { type: ObjectId, ref: "Contract" },
  category: String,
  categoryType: String,
  year: { type: Number, index: true },
  month: { type: Number, index: true },
  recordDate: Date,
  remark: String,
  fileUrl: String,
  note: String,
  qty: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  rate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  flatRate: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  debtAmount: { type: Decimal, get: getDecimal, set: setDecimal, default: 0 },
  debtText: String,
  isNextStage: Boolean,
  isPrint: Boolean,
  calculationType: String,
  createdAt: Date,
  notes: String,
  ref: String,
  status: String,
});

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true, useFindAndModify: false };
  Counter.findOneAndUpdate(
    { name: "Usage", year: this.year, category: this.category },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let sequence
      if (this.sequence) sequence = this.sequence
      else
        sequence = doc.year.toString().slice(-2) + (this.category ?? "9") + doc.sequence.toString().padStart(7, "0");
      // let recordDate = DateTime.fromObject({ day: 15, month: this.month, year: this.year - 543 }).toJSDate()
      Usage.findOneAndUpdate({ _id: this._id }, { $set: { sequence } }).exec()
      next();
    }
  );
});

schema.set('toJSON', {
  getters: true,
  transform: (doc: any, ret: any) => {
    if (ret.calculationType == "บาท/ลบ.ม.")
      ret.amount = ret.rate * ret.qty
    else
      ret.amount = ret.flatRate
    delete ret.__v;
    return ret;
  },
});

schema.plugin(mongoosePaginate);
const Usage = mongoose.model("Usage", schema);
export default Usage;
