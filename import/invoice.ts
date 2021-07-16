const Excel = require('exceljs');
const mongoose = require('mongoose')
import Invoice from "../src/models/invoice";
import Usage from "../src/models/usage";

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let prepArray: Array<any> = [];

(async () => {
  await Invoice.deleteMany({}).exec()
  await Usage.deleteMany({}).exec()
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(__dirname + "/prep/WMA_INV_CONSOL_R3.xlsx");
  let sheet = workbook.getWorksheet("รวม INV")

  sheet.columns = [
    { header: 'Id', key: 'id', width: 10 },
    { header: 'Sequence', key: 'sequence', width: 15 },
    { header: 'Year', key: 'year', width: 10 },
    { header: 'Month', key: 'month', width: 10 },
    { header: 'Meter', key: 'meter', width: 10 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Rate', key: 'rate', width: 10 },
    { header: 'FlatRate', key: 'flatRate', width: 10 },
    { header: 'DebtText', key: 'debtText', width: 10 },
    { header: 'DebtAmount', key: 'debtAmount', width: 10 },
    { header: 'TotalAmount', key: 'totalAmount', width: 10 },
    { header: 'Category', key: 'category', width: 10 },
    { header: 'CategoryType', key: 'categoryType', width: 10 },
  ];

  let no = 1
  let lastYearMonth = ""
  let currentYearMonth = ""
  sheet.eachRow(function (row: any, rowNumber: number) {
    if (rowNumber > 1) {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      currentYearMonth = row.getCell(16)+row.getCell(17)

      let vatText = (row.getCell(12).text??"").replace(",","")
      let vat = parseFloat(vatText)
      prepArray.push({
        no:no,
        sequence: row.getCell(3),
        name: row.getCell(5),
        address: row.getCell(6),
        debtText: row.getCell(7),
        debtAmount: row.getCell(8),
        qty: row.getCell(9),
        rate: row.getCell(24)=='บาท/เดือน'?row.getCell(11):row.getCell(10),
        totalAmount: row.getCell(11),
        vat: vat,
        invoiceAmount: row.getCell(14).value,
        category: row.getCell(15).value,
        year: row.getCell(16).value,
        month: row.getCell(17).value,
        meter: row.getCell(21).value,
        flatRate: row.getCell(22).value,
        categoryType: row.getCell(23).value,
        calculationType:row.getCell(24).value,
        vatRate: 0.07,
        code: "01-kb",
        isNextStage: true, isPrint: true,
        status: row.getCell("v").text=="เลิกใช้น้ำแล้ว"?"เลิกใช้น้ำแล้ว":"ปกติ",
        createdAt:new Date()
        // no:no,
        // sequence: row.getCell(2),
        // year: row.getCell(3),
        // month: row.getCell(4),
        // meter: row.getCell(5),
        // name: row.getCell(6),
        // address: row.getCell(7),
        // qty: row.getCell(8),
        // rate: row.getCell(16)=='บาท/เดือน'?row.getCell(13):row.getCell(9),
        // flatRate: row.getCell(10),
        // debtText: row.getCell(11),
        // debtAmount: row.getCell(12),
        // totalAmount: row.getCell(13),
        // invoiceAmount: (parseFloat(row.getCell(13))*1.07) + parseFloat(row.getCell(12)),
        // billAmount: (row.getCell(13)*1.07),
        // category: row.getCell(14),
        // categoryType: row.getCell(15),
        // calculationType:row.getCell(16),
        // vatRate: 0.07,
        // code: "01-kb",
        // isNextStage: true, isPrint: true,
        // createdAt:new Date()
      })
      if(lastYearMonth!=currentYearMonth) no = 1
      lastYearMonth = row.getCell(3)+row.getCell(4)
      // if(row.getCell(5)==='12170456052'){
      if(row.getCell(5)=='12170456052'){
        console.log('row',row.getCell(3),row.getCell(4))
      }else{
        // console.log('row',row)
      }
      console.log(`reading ${rowNumber}: ${(parseFloat(row.getCell(13))*1.07) + parseFloat(row.getCell(12))} Collecting... The script uses approximately ${Math.round(used * 100) / 100} MB`);
    }
  })
  saveInvoice()
})()
var i = 0
var j = 0
let saveInvoice = async () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (prepArray[i] != undefined) {
    let invoice = new Invoice(prepArray[i])
    await invoice.save().then(() => {
      console.log(`invoices ${i}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`);
      i++
      delete mongoose.models['Invoice'];
      delete mongoose.connection.collections['invoices'];
      delete mongoose.modelSchemas['Invoice'];
      setTimeout(() => {
        saveInvoice()
      }, 1);
    })
  }
  else {
    saveUsage()
  }
}
let saveUsage = async () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (prepArray[j] != undefined) {
    try {
      prepArray[i-1] = null
    } catch (error) {
      
    }
    let usage = new Usage(prepArray[j])
    await usage.save().then(() => {
      console.log(`usages ${j}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`);
      j++
      delete mongoose.models['Usage'];
      delete mongoose.connection.collections['usages'];
      delete mongoose.modelSchemas['Usage'];
      setTimeout(() => {
        saveUsage()
      }, 1);
    })
  }
  else {
    console.log('done!', i, j)
  }
}