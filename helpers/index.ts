import Area from "../src/models/area"
import AreaCollection from "../src/models/areaCollection"
import AreaCondition from "../src/models/areaCondition"
import AreaIncome from "../src/models/areaIncome"
import AreaRate from "../src/models/areaRate"
import AreaRation from "../src/models/areaRation"
import Calculation from "../src/models/calculation"
import CollectionType from "../src/models/collectionType"
import Cost from "../src/models/cost"
import CostCode from "../src/models/costCode"
import Counter from "../src/models/counter"
import CoverLetter from "../src/models/coverLetter"
import Customer from "../src/models/customer"
import History from "../src/models/history"
import Invoice from "../src/models/invoice"
import Payment from "../src/models/payment"
import Receipt from "../src/models/receipt"
import Request from "../src/models/request"
import Reset from "../src/models/reset"
import ResetPassword from "../src/models/resetpassword"
import Risk from "../src/models/risk"
import Usage from "../src/models/usage"
import UsageRequest from "../src/models/usageRequest"
import User from "../src/models/user"

let models = [
  Area,
  AreaCollection,
  AreaCondition,
  AreaIncome,
  AreaRate,
  AreaRation,
  Calculation,
  CollectionType,
  Cost,
  CostCode,
  Counter,
  CoverLetter,
  Customer,
  History,
  Invoice,
  Payment,
  Receipt,
  Request,
  Reset,
  ResetPassword,
  Risk,
  Usage,
  UsageRequest,
  User,
]

let main = async () => {
  const Excel = require("exceljs");
  var workbook = new Excel.Workbook();
  let sheets: Array<any> = []
  models.forEach((model, i) => {
    const props = Object.keys(model.schema.paths);
    const collectionName = model.collection.collectionName;
    sheets[i] = workbook.addWorksheet(collectionName);
    let header1 = ["Field", "Data Type", "Description"];
    sheets[i].addRow(header1);
    props.forEach(prop => {
      console.log(prop, model.schema.paths[prop].instance)
      let desc = getDescription(prop, model.schema.paths[prop].instance)
      sheets[i].addRow([prop, model.schema.paths[prop].instance, desc])
    })
    sheets[i].getColumn(1).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    sheets[i].getColumn(2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    sheets[i].getColumn(1).width = 30
    sheets[i].getColumn(2).width = 25
    sheets[i].getColumn(3).width = 60
  });
  await workbook.xlsx.writeFile('data_dictionary.xlsx');
}

let getDescription = (field: string, type: string) => {
  if (field != "_id" && type == "ObjectId")
    return "ฟิลด์แบบเก็บข้อมูล Unique Identification ที่อ้างอิงกลับไปยัง Model ของ " + field
  if (field != "__v")
    return "ฟิลด์แบบเก็บข้อมูล เก็บเวอร์ชันการอัพเดทของข้อมูล"
  else if (type == "String")
    return "ฟิลด์แบบเก็บข้อมูล สายอักขระ"
  else if (type == "Number")
    return "ฟิลด์แบบเก็บข้อมูล ตัวเลข"
  else if (type == "Date")
    return "ฟิลด์แบบเก็บข้อมูล วันที่พร้อมกับเวลา"
  else if (type == "Boolean")
    return "ฟิลด์แบบเก็บข้อมูล ตรรกะจริง/เท็จ"
  else if (type == "Array")
    return "ฟิลด์แบบเก็บข้อมูล แถวข้อมูล(อะเรย์)เพื่อเก็บข้อมูลหลายชุด"
}

main()