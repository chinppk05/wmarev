import mongoose from "mongoose"
import Excel from "exceljs"

import Payment from "../../src/models/payment";
import Receipt from "../../src/models/receipt";
mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })

//12170367740 << ธนาวัฒน์ คิดแบบ บาท/เดือน
const main = async () => {
  let deleteQuery = {
    $or: [
      { month: 10, year: 2564 },
      { month: 11, year: 2564 },
      { month: 12, year: 2564 }
    ]
  }
  let prepArray: Array<any> = [];
  await Payment.deleteMany(deleteQuery).exec()
  await Receipt.deleteMany(deleteQuery).exec()
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(__dirname + "/data.xlsx");
  let sheet = workbook.getWorksheet("Import")
  sheet.eachRow((row: any, rowNumber: number) => {
    console.log(rowNumber)
    if(rowNumber==1) return
    prepArray.push({
      no: row.getCell("H"),
      number: row.getCell("H"),
      sequence: row.getCell("G"),
      year: row.getCell("E").value,
      month: row.getCell("D").value,
      meter: row.getCell("K").value,
      name: row.getCell("L").value,
      address: row.getCell("M").value,
      paymentAmount: row.getCell("X").value,
      paymentDate: new Date(row.getCell("B").text),
      debtText: row.getCell("N").value,
      debtAmount: row.getCell("Q").value,
      debtVat: row.getCell("P").value,
      qty: row.getCell("R").value,
      totalAmount: row.getCell("W").value,
      vatRate: 0.07,
      vat: row.getCell("T").value,
      invoiceAmount: row.getCell("W").value,
      code: "01-kb",
      category: row.getCell("F").text,
      categoryType: row.getCell("K").text == "12170367740"?"บาท/เดือน":"บาท/ลบ.ม.",
      // rate: row.getCell("AD")=='บาท/เดือน'?row.getCell("R"):row.getCell("K"),
      isNextStage: true,
      isPrint: true,
      isRequested: true,
      isApproved: true,
      isSigned: true,
      process: true,
      createdAt: new Date()
    })
  })
  let i = 0
  for(const prep of prepArray){
    const payment = new Payment(prep)
    await payment.save()
    const receipt = new Receipt(prep)
    await receipt.save()
    console.log("done ", ++i)
  }
}

main()