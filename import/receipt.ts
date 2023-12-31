const Excel = require('exceljs');
const mongoose = require('mongoose')
import Payment from "../src/models/payment"
import Receipt from "../src/models/receipt"
import Invoice from "../src/models/invoice"
import { DateTime } from "luxon";

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let prepArray: Array<any> = [];

(async () => {
  await Payment.deleteMany({}).exec()
  await Receipt.deleteMany({}).exec()
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(__dirname + "/prep/excel_processed/combined_R01.xlsx");
  let sheet = workbook.getWorksheet("ใบเสร็จรับเงิน")

  sheet.eachRow(function (row: any, rowNumber: number) {
    if (rowNumber > 1) {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      let seq = row.getCell(2).value??""
      try {
        seq = seq.replace("wma-","").replace("WMA-","")
      } catch (error) {
        
      }
      prepArray.push({
        no: row.getCell("A"),
        sequence: row.getCell("C"),
        year: row.getCell("D").value,
        month: row.getCell("E").value,
        meter: row.getCell("G").value,
        oldMeter: row.getCell("H").value,
        name: row.getCell("I").value,
        address: row.getCell("J").value,
        paymentAmount: row.getCell("K").value,
        paymentDate: row.getCell("L").value,
        invoiceNumber: row.getCell("M").value,
        debtText: row.getCell("X").value,
        debtAmount: row.getCell("Y").value,
        debtVat: row.getCell("P").value,
        qty: row.getCell("Q").value,
        totalAmount: row.getCell("R").value,
        vatRate: row.getCell("S").value,
        vat: row.getCell("T").value,
        invoiceAmount: row.getCell("W").value,
        code: "01-kb",
        category: row.getCell("AB").value,
        categoryType: row.getCell("AC").text,
        // rate: row.getCell("AD")=='บาท/เดือน'?row.getCell("R"):row.getCell("K"),
        isNextStage: true, 
        isPrint: true,
        isRequested:true,
        isApproved:true,
        isSigned:true,
        process:true,
        createdAt:new Date()


      
        // no: row.getCell("A"),
        // sequence: row.getCell("C"),
        // year: row.getCell(3).value,
        // month: row.getCell(4).value,
        // meter: row.getCell(5).value,
        // name: row.getCell(6).value,
        // address: row.getCell(7).value,
        // qty: row.getCell(8).value,
        // rate: row.getCell(9).value,
        // flatRate: row.getCell(10).value,
        // debtText: row.getCell(11).value,

        // debtAmount: row.getCell("L").value,
        // vatRate: row.getCell("M").value,
        // totalAmount: row.getCell("N").value,
        // paymentAmount: row.getCell("O").value,
        // paymentDate: row.getCell("P").value,
        // category: row.getCell("Q").value,
        // categoryType: row.getCell("R").value,
        // calculationType: row.getCell("S").value,
        // invoiceAmount: row.getCell("T").value, // invoiceAmount: (row.getCell(8).value * row.getCell(9).value) * (1 + row.getCell("M").value),
        // vat: row.getCell("U").value,
        // code: "01-kb",
        // isNextStage: true, 
        // isPrint: true,
        // isRequested:true,
        // isApproved:true,
        // isSigned:true,
        // process:true,
        // createdAt:new Date()
      })
      // console.log((row.getCell(8).value * row.getCell(9).value) * (1 + row.getCell("M").value), `reading ${rowNumber}: Collecting... The script uses approximately ${Math.round(used * 100) / 100} MB`);
      // console.log(row.getCell("P").value)
    }
  })
  savePayment()
  saveReceipt()
})()
var i = 0
var j = 0
let savePayment = async () => {
  // console.log(prepArray[i].year,prepArray[i].month)
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (prepArray[i] != undefined) {
    await Invoice.findOne({ year: prepArray[i].year, month: prepArray[i].month, meter: prepArray[i].meter }).then(async (data: any) => {
      let payment
      if (data != null)
        payment = new Payment({ ...prepArray[i], invoiceNumber: data.sequence })
      else
        payment = new Payment({ ...prepArray[i], invoiceNumber: "ไม่พบรายการชำระ" })
      await payment.save().then(() => {
        delete mongoose.models['Payment'];
        delete mongoose.connection.collections['payments'];
        delete mongoose.modelSchemas['Payment'];
        if (prepArray[i] != undefined) {
          try {
            let offset = DateTime.fromObject({ year: prepArray[i].year - 543, month: prepArray[i].month, day: 15 }).minus({ months: 2 }).toObject()
            let { month, year } = offset
            Invoice.updateOne({$or:[
              { year: year + 543, month: month, meter: prepArray[i].meter },
              { year: year + 543, month: month, oldMeter: prepArray[i].meter }
            ]}, { $set: { isPaid: true, receipts: [prepArray[i].sequence] } }).then(async (newData: any) => {
              // setTimeout(() => {
              let jssl = JSON.stringify({ year: prepArray[i].year, month: prepArray[i].month, meter: prepArray[i].meter })
              // console.log(`${jssl} - ${(data ?? { sequence: "notfound" }).sequence} ${prepArray[i].year} ${prepArray[i].month} /payments ${i}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`);
              console.log(`payments ${i}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`)
              savePayment()
              i++
              // }, 1);
            })
          } catch (error) {
            console.log("payment error", error)
          }
        }
      })
    })
  }
  else {
    // saveReceipt()
  }
}
let saveReceipt = async () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (prepArray[j] != undefined) {
    let usage = new Receipt(prepArray[j])
    await usage.save().then(() => {
      console.log(`receipts ${j}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`);
      j++
      delete mongoose.models['Receipt'];
      delete mongoose.connection.collections['receipts'];
      delete mongoose.modelSchemas['Receipt'];
      setTimeout(() => {
        saveReceipt()
      }, 1);
    })
  }
  else {
    console.log('done!', i, j)
  }
}