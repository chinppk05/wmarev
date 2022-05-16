const mongoose = require("mongoose");
import { getDecimal, setDecimal } from "../../helpers/decimal";
const Decimal = mongoose.Schema.Types.Decimal;
const mongoosePaginate = require("mongoose-paginate");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const schema = new Schema({
  area: { type: ObjectId, ref: "area" },
  areaCondition: { type: ObjectId, ref: "areaCondition" },
  operationYear: Number,
  contractYear: Number,
  calendarYear: Number,
  collectYear: Number,
  paybackYearText: String,
  collectYearText: String,
  expenseYearText: String,
  quarter: Number,
  isKrob2: Boolean,
  isKrob3: Boolean,
  isKrob4: Boolean,
  isPrint: Boolean,
  isVat: Boolean,
  isShowRemain: Boolean,
  vat: Number,

  ledgers: [
    {
      selected: Boolean,
      code: String,
      name: String,
      totalAmount: { type: Number, default: 0 },
      category: String,
      months: [
        {
          month: Number,
          year: Number,
          amount: { type: Number, default: 0 },
        },
      ],
    },
  ],
  endorsedLedgers: [
    {
      selected: Boolean,
      code: String,
      name: String,
      totalAmount: { type: Number, default: 0 },
      category: String,
      months: [
        {
          month: Number,
          year: Number,
          amount: { type: Number, default: 0 },
        },
      ],
    },
  ],

  expenses: [
    {
      name: String,
      symbol: String,
      amount: { type: Number, default: 0 },
      eAmount: { type: Number, default: 0 },
    },
  ],

  manuals: [
    {
      order: Number,
      enable: Boolean,
      name: String,
      type: { type: String, default: "plus" },
      calculation: String,
      value: { type: Number, default: 0 },
      eValue: { type: Number, default: 0 },
    }
  ],

  modifications: [
    {
      name: String,
      symbol: String,
      amount: { type: Number, default: 0 },
      eAmount: { type: Number, default: 0 },
    },
  ],
  qtyYear: Number, //ปีของปริมาณน้ำบำบัด
  newText: String,
  oldText: String,
  isLeftText: String,
  isRightText: String,
  areaTotalExpenses: Number,

  allocationPerUnit: Number,
  allocationCost: Number,
  treatmentQty: Number,
  wmaExpenses: Number,
  areaExpenses: Number,
  totalExpenses: { type: Number, default: 0 },
  totalIncome: { type: Number, default: 0 },
  advanceAmount: Number,
  eAdvanceAmount: Number,

  contributionText: String,
  contributionAmount: Number,

  remainingAmount: Number,
  eRemainingAmount: Number,
  modificationSum: Number,
  modificationeSum: Number,

  //สตง.รับรอง
  eContributionAmount: Number,
  eTreatmentQty: Number,
  eAllocationPerUnit: Number,
  eAllocationCost: Number,
  eWmaExpenses: { type: Number, default: 0 },
  eAreaExpenses: { type: Number, default: 0 },
  eTotalExpenses: { type: Number, default: 0 },
  eTotalIncome: { type: Number, default: 0 },

  eAreaCost01: Number,
  eAreaCost02: Number,
  eAreaCost03: Number,
  eIncome01: Number,
  eIncome02: Number,

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

  display: [String],
  createdIP: String,
  createdAt: Date,
  modifiedAt: Date,
});

// schema.set('toJSON', {
//   getters: true,
//   setters: true,
// });

schema.plugin(mongoosePaginate);
const Calculation = mongoose.model("Calculation", schema);
export default Calculation;
