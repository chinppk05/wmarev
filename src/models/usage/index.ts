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
  qty: Decimal,
  name: String,
  code:String,
  firstName: String,
  lastName: String,
  address: String,
  period: String,
  area: { type: ObjectId, ref: "Contract" },
  category: String,
  categoryType: String,
  year: Number,
  month: Number,
  remark:String,
  fileUrl:String,
  note: String,
  rate:Decimal,
  flatRate: Decimal,
  isNextStage: Boolean,
  calculationType:String,
  createdAt: Date,
});

schema.pre("save", async function (next: NextFunction) {
  var options = { upsert: true, new: true,useFindAndModify: false };
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

// Usage.set('toJSON', {
//   getters: true,
//   transform: (doc:any, ret:any) => {
//     if (ret.price) {
//       ret.price = ret.price.toString();
//     }
//     delete ret.__v;
//     return ret;
//   },
// });

export default Usage;
