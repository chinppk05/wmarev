import mongoose from "mongoose"
import Excel from "exceljs"

import Payment from "../../src/models/payment";
import Receipt from "../../src/models/receipt";
mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })

//12170367740 << ธนาวัฒน์ คิดแบบ บาท/เดือน
const main = async () => {
  // let deleteQuery = {
  //   $or: [
  //     { month: 10, year: 2564 },
  //     { month: 11, year: 2564 },
  //     { month: 12, year: 2564 }
  //   ]
  // }
  let deleteQuery = {
    $or:[
      { paymentDate:{$gte: new Date('2021-10-01T00:00:00.000+07:00'), $lte: new Date('2021-10-31T23:59:59.999+07:00')} },
      { paymentDate:{$gte: new Date('2022-10-01T00:00:00.000+07:00'), $lte: new Date('2022-10-31T23:59:59.999+07:00')} },
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
      no: parseInt(row.getCell("H").value),
      number: row.getCell("H").text,
      sequence: row.getCell("G").text,
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
  let count_2 = 0
  let count_3 = 0
  for(const prep of prepArray){
    const payment = new Payment(prep)
    let paymentResult = await payment.save()
    const receipt = new Receipt(prep)
    let receiptResult = await receipt.save()
    console.log("done ", ++i, prep.sequence)
    if(prep.category == "2") count_2++
    if(prep.category == "3") count_3++
    if(!paymentResult || !receiptResult) {

      console.log(paymentResult)
      console.log(receiptResult)
    }
  }

  console.log({count_2,count_3})

}

main()