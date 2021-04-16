const Excel = require('exceljs');
const mongoose = require('mongoose')
import Payment from "../src/models/payment"
import Receipt from "../src/models/receipt"
import Invoice from "../src/models/invoice"

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let prepArray: Array<any> = [];

(async () => {
  await Payment.deleteMany({}).exec()
  await Receipt.deleteMany({}).exec()
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(__dirname + "/prep/receipt.xlsx");
  let sheet = workbook.getWorksheet("Data")

  sheet.eachRow(function (row: any, rowNumber: number) {
    if (rowNumber > 1) {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;

      prepArray.push({
        sequence: row.getCell(2).value,
        year: row.getCell(3).value,
        month: row.getCell(4).value,
        meter: row.getCell(5).value,
        name: row.getCell(6).value,
        address: row.getCell(7).value,
        qty: row.getCell(8).value,
        rate: row.getCell(9).value,
        flatRate: row.getCell(10).value,
        debtText: row.getCell(11).value,

        debtAmount: row.getCell("L").value,
        vatRate: row.getCell("M").value,
        totalAmount: row.getCell("N").value,
        invoiceAmount: (row.getCell(8).value * row.getCell(9).value) * (1 + row.getCell("M").value),
        paymentAmount: row.getCell("O").value,
        paymentDate: row.getCell("P").value,
        category: row.getCell("Q").value,
        categoryType: row.getCell("R").value,
        calculationType: row.getCell("S").value,
        invoiceNumber: row.getCell("T").value,
        code: "01-kb",
        isNextStage: true, isPrint: true
      })
      console.log((row.getCell(8).value * row.getCell(9).value) * (1 + row.getCell("M").value), `reading ${rowNumber}: Collecting... The script uses approximately ${Math.round(used * 100) / 100} MB`);
    }
  })
  savePayment()
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
        payment = new Payment({ ...prepArray[i], invoiceNumber: "notfound" })
      await payment.save().then(() => {
        delete mongoose.models['Payment'];
        delete mongoose.connection.collections['payments'];
        delete mongoose.modelSchemas['Payment'];
        Invoice.updateOne({ year: prepArray[i].year, month: prepArray[i].month, meter: prepArray[i].meter }, { $set: { isPaid: true, paidReceipt: prepArray[i].sequence } }).then(async (data: any) => {
          // setTimeout(() => {
            savePayment()
            console.log(`${(data ?? { sequence: "notfound" }).sequence} ${prepArray[i].year} ${prepArray[i].month} /payments ${i}: Saving... The script uses approximately ${Math.round(used * 100) / 100} MB`);
            i++
          // }, 1);
        })
      })
    })
  }
  else {
    saveReceipt()
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