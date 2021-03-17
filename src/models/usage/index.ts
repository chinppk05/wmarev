const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
import { NextFunction } from "express";
import Counter from "../counter";
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  customer: { type: ObjectId, ref: "Customer" },
  number: Number,
  meter: String,
  taxId: String,
  qty: Number,
  name: String,
  firstName: String,
  lastName: String,
  address: String,
  period: String,
  area: { type: ObjectId, ref: "Contract" },
  category: String,
  year: Number,
  month: Number,
  remark:String,
  fileUrl: [String],
  note: String,
  rate:Number,
  flatRate: Number,
  isNextStage: Boolean,
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
export default Usage;
