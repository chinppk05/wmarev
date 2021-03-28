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
  quarter: Number,
  ledgers: [
    {
      selected: Boolean,
      code: String,
      name: String,
      totalAmount: Number,
      category: String,
      months: [
        {
          month: Number,
          year: Number,
          amount: Number,
        }
      ]
    }
  ],
  SAOLedgers: [
    {
      selected: Boolean,
      code: String,
      name: String,
      totalAmount: Number,
      months: [
        {
          month: Number,
          year: Number,
          amount: Number,
        }
      ]
    }
  ],

  allocationPerUnit: Number,
  allocationCost: Number,
  treatmentQty: Number,
  wmaExpenses: Number,
  areaExpenses: Number,
  totalExpenses: Number,
  totalIncome: Number,
  areaCost01: Number,
  areaCost02: Number,
  areaCost03: Number,
  areaCost04: Number,
  areaCost05: Number,
  areaCost06: Number,
  areaCost07: Number,
  areaCost08: Number,
  areaCost09: Number,
  income01: Number,
  income02: Number,
  income03: Number,
  income04: Number,
  income05: Number,
  income06: Number,
  income07: Number,
  income08: Number,
  income09: Number,

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



