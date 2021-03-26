const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const schema = new Schema({
  area: { type: ObjectId, ref: "area" },
  areaCondition: { type: ObjectId, ref: "areaCondition" },
  operationYear: Number,
  contractYear: Number,
  calendarYear: Number,
  quater: Number,
  ledgers: ["mixed"],
  SAOLedgers: ["mixed"],
  selected: ["mixed"],
  SAOselected: ["mixed"],

  calc1: Number,
  calc2: Number,
  calc3: Number,
  calc4: Number,
  calc5: Number,
  calc6: Number,
  calc7: Number,
  calc8: Number,
  calc9: Number,

  note1: String,
  note2: String,
  note3: String,
  note4: String,
  note5: String,
  note6: String,
  note7: String,
  note8: String,
  note9: String,

  createdIP: String,
  createdAt: Date,
})
schema.plugin(mongoosePaginate)
const Calculation = mongoose.model("Calculation", schema)
export default Calculation



