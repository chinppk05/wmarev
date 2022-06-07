import express, { Request, Response, NextFunction } from 'express'
import Receipt from '../../models/receipt/index'
import Invoice from '../../models/invoice/index'
import Usage from '../../models/usage/index'
import Payment from '../../models/payment/index'
import RequestModel from '../../models/request/index'
import Counter from '../../models/counter/index'
import Task from '../../models/task/index'
import mongoose, { Mongoose } from "mongoose";
import { DateTime } from "luxon";
import * as _ from "lodash"

var options = { upsert: true, new: true, useFindAndModify: false };

let rounddown = (num: number) => {
  let newNum = parseFloat(num.toFixed(3))
  let multiply100 = newNum * 100
  multiply100 = parseFloat(multiply100.toFixed(3))
  let result = Math.floor(multiply100) / 100;
  return result
}
let roundup = (num: number) => {
  let newNum = parseFloat(num.toFixed(3))
  let multiply100 = newNum * 100
  multiply100 = parseFloat(multiply100.toFixed(3))
  let result = Math.ceil(multiply100) / 100;
  return result
}

export const findZeroRemaining = async (req: Request, res: Response) => {
  let results = await Invoice.aggregate([{
    $group: {
      _id: {
        month: '$month',
        year: '$year'
      },
      debtAmount: {
        $sum: '$debtAmount'
      }
    }
  }, {
    $match: {
      debtAmount: {
        $lte: 50
      }
    }
  }]).exec()
}

export const invoiceNumberAdjustment = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let invoices = await Invoice.find({ month, year, category }).sort({ no: 1 }).exec()
  for (const invoice of invoices) {
    starter = starter ?? "642"
    invoice.sequence = starter + String(start++).padStart(7, "0")
    let result = await invoice.save()
    console.log(result)
  }
  res.send("done!")
}

export const receiptNumberAdjustment = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let paymentStart = DateTime.fromObject({ day: 1, month, year: year - 543 }).plus({ month: 2 }).startOf('day').toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 1, month, year: year - 543 }).plus({ month: 2 }).endOf('month').endOf('day').toJSDate()
  //{paymentDate:{$gte: ISODate('2021-12-01T00:00:00.000+07:00'), $lte: ISODate('2021-12-31T23:59:59.999+07:00')}}
  let receipts = await Receipt.find({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
    category
  }).sort({ excelNum: 1 }).exec()
  let prep: Array<any> = []
  console.log("length", receipts.length)
  for (const receipt of receipts) {
    starter = starter ?? "642"
    receipt.sequence = starter + String(start++).padStart(6, "0")
    // console.log('receipt', receipt.sequence)
    let result = await receipt.save()

    // console.log(result)
    prep.push(result)
  }
  res.send(prep)

}
//

export const receiptSequenceTemp = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let deleteResult = await Receipt.deleteMany({ sequence: { $exists: false } }).exec()
  console.log({ deleteResult })

  let receipts = await Receipt.find({}).sort({ no: 1 }).exec()
  let i = 0
  for (const receipt of receipts) {
    try {
      receipt.tempSequence = receipt.sequence
      let result = await receipt.save()
      console.log(i++, receipts.length)
    } catch (error) {

    }

  }
  res.send("done receipt!")
}


export const receiptInvoiceMap = async (req: Request, res: Response) => {
  let invoices = await Invoice.find({ $and: [{ receipts: { $exists: true, $ne: [] } }, { receipts: { $exists: true, $ne: ["-"] } }] }).exec()

  let i = 0
  let preps: Array<any> = []
  for (const invoice of invoices) {
    let receiptsInInvoice = invoice.receipts
    let receipt = receiptsInInvoice[0]
    preps.push({ invoice: invoice.sequence, receipt })
  }
  let preps2 = _.groupBy(preps, 'receipt')
  for (const elem in preps2) {
    let receipt = await Receipt.findOne({ sequence: elem }).exec()
    if (receipt) {
      receipt.invoices = preps2[elem].map(el => el.invoice)
      let invoiceInside = await Invoice.find({ sequence: { $in: receipt.invoices } }).lean().exec()
      receipt.invoicesYearMonth = invoiceInside.map((el: any) => ({ year: el.year, month: el.month }))
      let save = await receipt.save()
      if (save) console.log(receipt.invoices)
    }
  }

  res.send({ status: "done receipt-invoice!", length: invoices.length, preps2 })
}


export const receiptRemoveDuplicate = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let paymentStart = DateTime.fromObject({ day: 1, month, year: year - 543 }).plus({ month: 2 }).startOf('day').toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 1, month, year: year - 543 }).plus({ month: 2 }).endOf('month').endOf('day').toJSDate()
  //{paymentDate:{$gte: ISODate('2021-12-01T00:00:00.000+07:00'), $lte: ISODate('2021-12-31T23:59:59.999+07:00')}}
  let receipts = await Receipt.find({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
    category
  }).sort({ excelNum: 1 }).exec()
  for (const receipt of receipts) {
    starter = starter ?? "642"
    receipt.sequence = starter + String(start++).padStart(6, "0")
    let result = await receipt.save()
    console.log(result)
  }
  res.send("done!")
}



export const restoreInvoice = async (req: Request, res: Response) => {
  let i = 0
  let invoices = await Invoice.find({
    $or: [
      { year: 2564, month: 10 },
      { year: 2564, month: 11 },
      { year: 2564, month: 12 },
      { year: 2565, month: 1 },
    ],
    isPaid: true,
    category: "2",
    $and: [
      {
        receipts: {
          $ne: ['-']
        }
      },
      {
        receipts: {
          $ne: null
        }
      }
    ]
  }).exec()
  let found: Array<any> = []
  let notfound: Array<any> = []
  for (const invoice of invoices) {
    let receipt = invoice.receipts[0]
    let receiptOnDB = await Receipt.findOne({ sequence: receipt }).exec()
    // invoice.receiptsOld = invoice.receipts
    // invoice.save()
    if (receiptOnDB) found.push(receiptOnDB)
    else notfound.push(invoice)
  }
  for (const invoice of notfound) {
    let { month, year, meter } = invoice
    console.log({ month, year, meter })
    let receiptOnDB = await Receipt.findOne({ month, year, meter }).exec()
    console.log({ meter: receiptOnDB.meter, sequence: receiptOnDB.sequence })

    invoice.receipts = [receiptOnDB.sequence]
    invoice.save()
  }
  // let meters = _.chain(notfound).groupBy('meter')
  console.log("length found", found.length)
  console.log("length notfound", notfound.length)
  // console.log("length meters", meters)

  res.send("done")
}



export const restoreInvoiceFirstRun = async (req: Request, res: Response) => {
  let i = 0
  let invoices = await Invoice.find({
    $or: [
      { year: 2564, month: 10 },
      { year: 2564, month: 11 },
      { year: 2564, month: 12 },
      { year: 2565, month: 1 },
    ],
    isPaid: true,
    $and: [
      {
        receipts: {
          $ne: ['-']
        }
      },
      {
        receipts: {
          $ne: null
        }
      }
    ]
  }).exec()
  let found: Array<any> = []
  let notfound: Array<any> = []
  for (const invoice of invoices) {
    let receipt = invoice.receipts[0]
    let receiptOnDB = await Receipt.findOne({ sequence: receipt }).exec()
    // invoice.receiptsOld = invoice.receipts
    // invoice.save()
    if (receiptOnDB) found.push(receiptOnDB)
    else {
      notfound.push(invoice)
    }
  }
  for (const invoice of notfound) {
    let receipt = invoice.receipts[0]
    // console.log({receipt})
    let receiptOnDB = await Receipt.findOne({ tempSequence: receipt }).exec()
    // if(receipt==="643000807") console.log("643000807 found!")
    if (receiptOnDB) {
      // if(receiptOnDB.tempSequence==="643000807") console.log("643000807 found! " + receiptOnDB._id +"/"+ invoice._id)
      invoice.receipts = [receiptOnDB.sequence]
      // receiptOnDB.receipts = [receiptOnDB.sequence]
      let save = invoice.save()
      if (save) console.log("saved", i++)
    }
  }
  console.log("length found", found.length)
  console.log("length notfound", notfound.length)

  res.send("done")
}




import Excel, { Worksheet } from "exceljs"
export const restoreDebtText = async (req: Request, res: Response) => {
  let i = 0
  console.log("debt text restore")
  let paymentStart = DateTime.fromObject({ day: 1, month: 10, year: 2021 }).plus({ month: 2 }).startOf('day').toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 1, month: 1, year: 2022 }).plus({ month: 2 }).endOf('month').endOf('day').toJSDate()
  let receipts = await Receipt.find({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
  }).exec()
  const workbook = new Excel.Workbook();
  let path = __dirname + "/fix_002.xlsx";
  console.log(path)
  await workbook.xlsx.readFile(path);
  let worksheet = await workbook.getWorksheet("Receipts")
  let found: Array<any> = []
  let notfound: Array<any> = []
  worksheet.eachRow((row, rn) => {
    console.log(rn)
    let finding = receipts.find((receipt: any) => (receipt.sequence === row.getCell("C").text && receipt.meter === row.getCell("A").text))
    if (finding) found.push({ receipt: finding, newdebtText: row.getCell("D").text })
    else notfound.push(row.getCell("C").text)
  })

  console.log("found", found.length)
  console.log("notfound", notfound.length)
  console.log("receipts", receipts.length)
  let count = 0
  for (const elem of found) {
    if (elem.newdebtText === "Invalid Date") elem.newdebtText = "-"
    console.log("old:", elem.receipt.debtText, "new:", elem.newdebtText)
    if (elem.receipt.debtText === elem.newdebtText) count++
    try {
      elem.receipt.debtText = elem.newdebtText
      if (elem.receipt.debtText === "-") {
        elem.receipt.debtAmount = 0
        elem.receipt.debtVat = 0
      }
      console.log("saving...", elem.receipt.debtText)
      await elem.receipt.save()
    } catch (error) {
      console.log(error)
    }
  }
  // console.log("map", receipts.map((r:any)=>r.sequence))
  console.log("done " + count)
  res.send("done " + count)
}

export const cleanTotalAmountForReceipt_OBSOLETE = async (req: Request, res: Response) => {

  let paymentStart = DateTime.fromObject({ day: 1, month: 10, year: 2021 }).plus({ month: 2 }).startOf('day').toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 1, month: 1, year: 2022 }).plus({ month: 2 }).endOf('month').endOf('day').toJSDate()
  let receipts = await Receipt.find({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
  }).exec()
  for (const receipt of receipts) {
    let invoice = await Invoice.findOne({ sequence: receipt.invoiceNumber }).exec()
    invoice = JSON.parse(JSON.stringify(invoice))
    // if(receipt.sequence==="642002838") console.log(invoice)
    receipt.totalAmount = invoice.totalAmount
    receipt.debtAmount = invoice.debtAmount
    receipt.debtVat = rounddown(invoice.debtAmount * 0.07)
    receipt.totalAmount = invoice.totalAmount
    let result = await receipt.save()
    console.log(result)
  }

  res.send("done cleanTotalAmountForReceipt")
}


export const cleanTotalAmountForReceipt = async (req: Request, res: Response) => {

  const workbook = new Excel.Workbook();
  let path = __dirname + "/fix_003.xlsx";
  console.log(path)
  await workbook.xlsx.readFile(path);
  let worksheet = await workbook.getWorksheet("Receipts")
  let prep: Array<any> = []
  let found: Array<any> = []
  let notfound: Array<any> = []
  let count1 = 0
  let count2 = 0
  let count3 = 0
  let count4 = 0
  worksheet.eachRow(async (row, rn) => {
    prep.push({
      sequence: row.getCell("C").text,
      meter: row.getCell("A").text,
      debtAmount: row.getCell("K").value,
      debtVat: row.getCell("L").value,
      totalAmount: row.getCell("M").value,
      vat: row.getCell("N").value
    })
  })

  for (const elem of prep) {
    let receipt = await Receipt.findOne({ sequence: elem.sequence, meter: elem.meter }).exec()
    if (receipt !== undefined) {
      found.push({ sequence: elem.sequence })
      let new_debtAmount = elem.debtAmount
      let new_debtVat = elem.debtVat
      let new_totalAmount = elem.totalAmount
      let new_vat = elem.vat
      let leanReceipt = JSON.parse(JSON.stringify(receipt))
      let fixed = false
      if (leanReceipt !== null) {
        if (leanReceipt.debtAmount !== new_debtAmount) {
          console.log("debtAmount !==", leanReceipt.debtAmount, new_debtAmount)
          receipt.debtAmount = new_debtAmount
          fixed = true
          count1++
        }
        if (leanReceipt.debtVat !== new_debtVat) {
          console.log("debtVat !==", leanReceipt.debtVat, new_debtVat)
          receipt.debtVat = new_debtVat
          fixed = true
          count2++
        }
        if (leanReceipt.totalAmount !== new_totalAmount) {
          console.log("totalAmount !==", leanReceipt.totalAmount, new_totalAmount)
          receipt.totalAmount = new_totalAmount
          fixed = true
          count3++
        }
        if (leanReceipt.vat !== new_vat) {
          console.log("vat !==", leanReceipt.vat, new_vat)
          receipt.vat = new_vat
          fixed = true
          count4++
        }
      }
      if (fixed) {
        let saveResult = await receipt.save()
      }

    } else {
      notfound.push({ sequence: elem.sequence })
    }
  }

  // let receipt = await Receipt.findOne({ sequence: row.getCell("C").text })
  // if (receipt !== undefined) {
  //   found.push({ sequence: row.getCell("C").text })
  // let new_debtAmount = row.getCell("K").value
  // let new_debtVat = row.getCell("L").value
  // let new_totalAmount = row.getCell("M").value
  // let new_vat = row.getCell("N").value

  // if (receipt.debtAmount !== new_debtAmount) {
  //   console.log("debtAmount !==", receipt.debtAmount, new_debtAmount)
  //   count1++
  // }
  // if (receipt.debtVat !== new_debtVat) {
  //   console.log("debtVat !==", receipt.debtVat, new_debtVat)
  //   count2++
  // }
  // if (receipt.totalAmount !== new_totalAmount) {
  //   console.log("totalAmount !==", receipt.totalAmount, new_totalAmount)
  //   count3++
  // }
  // if (receipt.vat !== new_vat) {
  //   console.log("vat !==", receipt.vat, new_vat)
  //   count4++
  // }
  // console.log(receipt)
  // }
  // else {
  //   notfound.push({ sequence: row.getCell("C").text })
  // }
  console.log(found.length, notfound.length)
  console.log(count1, count2, count3, count4)
  // let paymentStart = DateTime.fromObject({ day: 1, month: 10, year: 2021 }).plus({ month: 2 }).startOf('day').toJSDate()
  // let paymentEnd = DateTime.fromObject({ day: 1, month: 1, year: 2022 }).plus({ month: 2 }).endOf('month').endOf('day').toJSDate()
  // let receipts = await Receipt.find({
  //   paymentDate: {
  //     $gte: paymentStart,
  //     $lte: paymentEnd
  //   },
  // }).exec()
  // for(const receipt of receipts){
  //   let invoice = await Invoice.findOne({sequence:receipt.invoiceNumber}).exec()
  //   invoice = JSON.parse(JSON.stringify(invoice))
  //   // if(receipt.sequence==="642002838") console.log(invoice)
  //   receipt.totalAmount = invoice.totalAmount
  //   receipt.debtAmount = invoice.debtAmount
  //   receipt.debtVat = rounddown(invoice.debtAmount * 0.07)
  //   receipt.totalAmount = invoice.totalAmount
  //   let result = await receipt.save()
  //   console.log(result)
  // }

  res.send("done cleanTotalAmountForReceipt")
}


let exception = ['12170463906'] // สำนักงานสรรพสามิตพื้นที่กระบี่

export const revertExcelInvoice = async (req: Request, res: Response) => {

  const workbook = new Excel.Workbook();
  let path = __dirname + "/invoice_fix_001.xlsx";
  console.log(path)
  await workbook.xlsx.readFile(path);
  let worksheet = await workbook.getWorksheet("Sheet1")
  let preps: Array<any> = []
  let notfound: Array<any> = []
  worksheet.eachRow(async (row, rn) => {
    if (rn >= 3) {
      preps.push({
        sequence: row.getCell("B").text,
        meter: row.getCell("C").text,
        name: row.getCell("D").text,
        debtAmount: row.getCell("G").value,
        debtText: row.getCell("F").value,
      })
    }
  })
  console.log(preps.length)
  let i = 0
  for (const elem of preps) {
    let vat = (elem.debtAmount * 0.07)
    if (exception.includes(elem.meter)) {
      vat = roundup(vat)
    } else {
      vat = rounddown(vat)
    }
    let invoice = await Invoice.findOne({ sequence: elem.sequence, meter: elem.meter, name: elem.name }).exec()
    if (invoice) {
      console.log("found", ++i, "of", preps.length, vat)
      invoice.debtText = elem.debtText
      invoice.debtAmount = elem.debtAmount
    } else {
      notfound.push({
        sequence: elem.sequence,
        meter: elem.meter
      })
    }
  }
  console.log("done!")
  console.log({ notfound })
  res.send("done")
}
export const revertExcelReceipt = async (req: Request, res: Response) => {

  const workbook = new Excel.Workbook();
  let path = __dirname + "/receipt_fix_001.xlsx";
  console.log(path)
  await workbook.xlsx.readFile(path);
  let worksheet = await workbook.getWorksheet("Sheet1")
  let preps: Array<any> = []
  let notfound: Array<any> = []
  worksheet.eachRow(async (row, rn) => {
    if (rn >= 3) {
      preps.push({
        sequence: row.getCell("C").text.replace("wma-", ""),
        meter: row.getCell("D").text,
        name: row.getCell("E").text,
        debtAmount: row.getCell("H").value,
        debtVat: row.getCell("I").value,
        debtText: row.getCell("G").value,
        // invoiceAmount: row.getCell("L").value,
        invoiceAmount: row.getCell("P").value,
        paymentAmount: row.getCell("Q").value,
      })
    }
  })
  console.log(preps.length)
  let i = 0
  for (const elem of preps) {
    let receipt = await Receipt.findOne({ sequence: elem.sequence, meter: elem.meter }).exec()
    if (receipt) {
      // console.log("found", ++i, "of", preps.length)
      // console.log(elem.debtText,elem.debtAmount,elem.debtVat)

      let paymentAmount = elem.paymentAmount
      if (elem.paymentAmount == null) {
        paymentAmount = elem.invoiceAmount
      }
      if ((elem.invoiceAmount + 3.55) < elem.paymentAmount) {
        paymentAmount = elem.invoiceAmount
      }
      receipt.debtText = elem.debtText
      receipt.debtAmount = elem.debtAmount
      receipt.debtVat = elem.debtVat
      receipt.invoiceAmount = elem.invoiceAmount
      receipt.paymentAmount = paymentAmount
      let save = await receipt.save()
    } else {
      notfound.push({
        sequence: elem.sequence,
        meter: elem.meter
      })
    }
  }
  console.log("done!")
  console.log({ notfound })
  console.log("notfound length", notfound.length)
  res.send("done")
}



export const excelReceiptImportV2 = async (req: Request, res: Response) => {
  let { monthStart, yearStart, monthEnd, yearEnd, } = req.body
  const wmaMonth = {
    'มค': 1,
    'กพ': 2,
    'มีค': 3,
    'เมย': 4,
    'พค': 5,
    'มิย': 6,
    'กค': 7,
    'สค': 8,
    'กย': 9,
    'ตค': 10,
    'พย': 11,
    'ธค': 12,
  }
  let paymentStart = DateTime.fromObject({ day: 15, month: monthStart, year: yearStart - 543 }).startOf('month').startOf('day').minus({hour:7}).toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 15, month: monthEnd, year: yearEnd - 543 }).endOf('month').endOf('day').minus({hour:7}).toJSDate()
  //{paymentDate:{$gte: ISODate('2021-12-01T00:00:00.000+07:00'), $lte: ISODate('2021-12-31T23:59:59.999+07:00')}}
  // let receipts = await Receipt.find({
  //   paymentDate: {
  //     $gte: paymentStart,
  //     $lte: paymentEnd
  //   },
  // }).sort({ excelNum: 1 }).exec()
  console.log({paymentStart,paymentEnd})
  let deleteReceipts = await Receipt.deleteMany({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
  })
  let deletePayments = await Payment.deleteMany({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
  })
  const workbook = new Excel.Workbook();
  let path = __dirname + "/receipt_fix_002.xlsx";
  await workbook.xlsx.readFile(path);
  console.log(deleteReceipts)
  console.log(deletePayments)

  let worksheet = await workbook.getWorksheet("Sheet1")
  let preps: Array<any> = []
  let notfound: Array<any> = []
  // console.log(worksheet)
  let count = 0
  worksheet.eachRow(async (row, rn) => {
    if (rn > 2) {
      count++
      // console.log(row.getCell("C").text)
      try {
        //@ts-ignore
        let paymentDate = new Date(row.getCell("X").value.result)
        let year = 0
        let month = 0
        let sequence = row.getCell("C").text.replace("wma-", "")
        let category = sequence.substring(2, 3)
        let invoiceAmount = row.getCell("N").value
        let debtAmount = row.getCell("H").value
        let paidType = "-"
        if (invoiceAmount > 0 && debtAmount == 0) {
          paidType = "จ่ายตรงเดือน"
          year = DateTime.fromJSDate(paymentDate).set({ day: 15 }).minus({ month: 2 }).year + 543
          month = DateTime.fromJSDate(paymentDate).set({ day: 15 }).minus({ month: 2 }).month
        } else if (invoiceAmount == 0 && debtAmount > 0) {
          paidType = "จ่ายไม่ตรงเดือน"
          year = DateTime.fromJSDate(paymentDate).set({ day: 15 }).minus({ month: 2 }).year + 543
          month = DateTime.fromJSDate(paymentDate).set({ day: 15 }).minus({ month: 2 }).month
        } else {
          paidType = "จ่ายรวมเดือนปัจจุบัน"
          year = DateTime.fromJSDate(paymentDate).set({ day: 15 }).minus({ month: 2 }).year + 543
          month = DateTime.fromJSDate(paymentDate).set({ day: 15 }).minus({ month: 2 }).month
        }
        let prep = {
          excelNum: row.getCell("A").value,
          sequence: row.getCell("C").text.replace("wma-", ""),
          year,
          month,
          meter: row.getCell("D").value,
          name: row.getCell("E").value,
          address: row.getCell("F").value,
          paymentAmount: row.getCell("Q").value,
          paymentDate: paymentDate,
          // invoiceNumber: row.getCell("M").value,
          debtText: row.getCell("G").value,
          debtAmount: row.getCell("H").value,
          debtVat: row.getCell("I").value,
          qty: row.getCell("K").value,
          totalAmount: row.getCell("L").value,
          vatRate: 0.07,
          vat: row.getCell("M").value,
          invoiceAmount: row.getCell("P").value,
          code: "01-kb",
          category,
          categoryType: "บาท/ลบ.ม.",
          isNextStage: true,
          isPrint: true,
          isRequested: true,
          isApproved: true,
          isSigned: true,
          process: true,
          createdAt: new Date(),
          paidType,
          notes: row.getCell("R").text,
          ref:paidType
        }
        // console.log({prep})
        preps.push(prep)
      } catch (error) {

      }
    }
  })
  let notfounds: Array<any> = []
  let c_t1 = 0
  let c_t2_1 = 0
  let c_t2_2 = 0
  let c_t3 = 0
  let c_t3_1 = 0
  let c_t3_2 = 0
  let c_t3_3 = 0
  let c_t4 = 0

  let c_within = 0
  let c_cross = 0
  let c_done = 0
  let c_called = 0

  let doc_created_payment = 0
  let doc_created_receipt = 0
  let createItem = (item: any) => {
    c_called++
    return new Promise(async (resolve, reject) => {
      try {
        let receipt = new Receipt({ ...item, invoices: item.invoices })
        await receipt.save()
        c_done += 1
        resolve("done")
      } catch (error) {
        console.log(item)
        console.log(error)
        resolve("done")
      }
      try {
        let payment = new Payment({ ...item, invoices: item.invoices_id })
        await payment.save()
        // c_done += 1
        resolve("done")
      } catch (error) {
        console.log(item)
        console.log(error)
        resolve("done")
      }
    })
  }
  for (let prep of preps) {
    let year = prep.year
    let month = prep.month
    let hasDash = prep.debtText.search("-") > 0
    let hasSlash = prep.debtText.search("/") > 0
    if (prep.paidType === "จ่ายตรงเดือน") {
      let invoice = await Invoice.findOne({ meter: prep.meter, year: prep.year, month: prep.month }).exec()
      invoice.isPaid = true
      invoice.receipts = [prep.sequence]
      await invoice.save()
      prep.invoices = [invoice.sequence]
      prep.invoices_id = [invoice._id]
      c_t1++
      await createItem(prep)

    } else if (prep.paidType === "จ่ายไม่ตรงเดือน") {
      if (hasDash || hasSlash) { // หลายเดือน
        c_t2_1++
        let isWithinYear = /([ก-๙]{2}|[ก-๙]{3})-([ก-๙]{2}|[ก-๙]{3})(\d{2})/g.exec(prep.debtText)
        let isCrossYear = /([ก-๙]{2}|[ก-๙]{3})(\d{2})[-/]([ก-๙]{2}|[ก-๙]{3})(\d{2})/g.exec(prep.debtText)
        if (isWithinYear !== null) { // หลายเดือนไม่ข้ามปี
          //@ts-ignore
          let fromMonth = wmaMonth[isWithinYear[1]]; let toMonth = wmaMonth[isWithinYear[2]];
          let fromYear = (2500 + parseInt(isWithinYear[3])) - 543
          let invoices = await Invoice.find({ meter: prep.meter, year: fromYear + 543, month: { $gte: fromMonth, $lte: toMonth } }).exec()
          for (const invoice of invoices) {
            invoice.isPaid = true
            invoice.receipts = [prep.sequence]
            let invoiceSave = await invoice.save()
          }
          prep.invoices = invoices.map((inv: any) => inv.sequence)
          prep.invoices_id = invoices.map((inv: any) => inv._id)
          c_within++
          await createItem(prep)
        } else if (isCrossYear !== null) { // หลายเดือนข้ามปี
          //@ts-ignore
          let fromMonth = wmaMonth[isCrossYear[1]]; let toMonth = wmaMonth[isCrossYear[3]];
          let fromYear = (2500 + parseInt(isCrossYear[2])) - 543; let toYear = (2500 + parseInt(isCrossYear[4])) - 543
          let months: Array<any> = []
          let start = DateTime.fromObject({ year: fromYear, month: fromMonth, day: 1 })
          let end = DateTime.fromObject({ year: toYear, month: toMonth, day: 28 })
          while (start < end) {
            months.push({year:start.year+543,month:start.month})
            start = start.plus({ months: 1 })
          }
          let invoices = await Invoice.find({ meter: prep.meter, $or:months }).exec()
          for (const invoice of invoices) {
            invoice.isPaid = true
            invoice.receipts = [prep.sequence]
            let invoiceSave = await invoice.save()
          }
          c_cross++
          await createItem(prep)
        } else { // ไม่เข้าพวก
          await createItem(prep)
        }

      } else { // เดือนเดียว
        let onlyOneMonth = /(.*?)(\d{2})/g.exec(prep.debtText)
        try {
          //@ts-ignore
          let month = wmaMonth[onlyOneMonth[1]]
          let year = parseInt(onlyOneMonth[2]) + 2500
          let invoice = await Invoice.findOne({ meter: prep.meter, year: year, month: month }).exec()
          invoice.isPaid = true
          invoice.receipts = [prep.sequence]
          let invoiceSave = await invoice.save()
          prep.invoices = [invoice.sequence]
          prep.invoices = [invoice._id]
        } catch (error) {
          // notfounds.push(prep)
        }
        await createItem(prep)
        c_t2_2++

      }

    } else if (prep.paidType === "จ่ายรวมเดือนปัจจุบัน") {
      let isWithinYear = /([ก-๙]{2}|[ก-๙]{3})-([ก-๙]{2}|[ก-๙]{3})(\d{2})/g.exec(prep.debtText)
      let isCrossYear = /([ก-๙]{2}|[ก-๙]{3})(\d{2})[-/]([ก-๙]{2}|[ก-๙]{3})(\d{2})/g.exec(prep.debtText)
      let onlyOneMonth = /(.*?)(\d{2})/g.exec(prep.debtText)
      if (isWithinYear !== null) { // หลายเดือนไม่ข้ามปี
        //@ts-ignore
        let fromMonth = wmaMonth[isWithinYear[1]]; let toMonth = wmaMonth[isWithinYear[2]];
        let fromYear = (2500 + parseInt(isWithinYear[3])) - 543
        let invoices = await Invoice.find({ meter: prep.meter, year: fromYear + 543, month: { $gte: fromMonth, $lte: toMonth } }).exec()
        for (const invoice of invoices) {
          invoice.isPaid = true
          invoice.receipts = [prep.sequence]
          let invoiceSave = await invoice.save()
        }
        prep.invoices = invoices.map((inv: any) => inv.sequence)
        prep.invoices_id = invoices.map((inv: any) => inv._id)
        c_within++
        c_t3_1++
        await createItem(prep)
      } else if (isCrossYear !== null) {
        //@ts-ignore
        let fromMonth = wmaMonth[isCrossYear[1]]; let toMonth = wmaMonth[isCrossYear[3]];
        let fromYear = (2500 + parseInt(isCrossYear[2])) - 543; let toYear = (2500 + parseInt(isCrossYear[4])) - 543
        let months: Array<any> = []
        let start = DateTime.fromObject({ year: fromYear, month: fromMonth, day: 1 })
        let end = DateTime.fromObject({ year: toYear, month: toMonth, day: 28 })
        while (start < end) {
          months.push({year:start.year+543,month:start.month})
          start = start.plus({ months: 1 })
        }
        let invoices = await Invoice.find({ meter: prep.meter, $or:months }).exec()
        for (const invoice of invoices) {
          invoice.isPaid = true
          invoice.receipts = [prep.sequence]
          let invoiceSave = await invoice.save()
        }
        await createItem(prep)
        c_t3_2++
      } else if (onlyOneMonth !== null) {
        let onlyOneMonth = /(.*?)(\d{2})/g.exec(prep.debtText)
        try {
          //@ts-ignore
          let month = wmaMonth[onlyOneMonth[1]]
          let year = parseInt(onlyOneMonth[2]) + 2500
          let invoice = await Invoice.findOne({ meter: prep.meter, year: year, month: month }).exec()
          invoice.isPaid = true
          invoice.receipts = [prep.sequence]
          let invoiceSave = await invoice.save()
          prep.invoices = [invoice.sequence]
          prep.invoices = [invoice._id]
        } catch (error) {
          notfounds.push(prep)
        }
        await createItem(prep)
        c_t3_3++
      } else {
        notfounds.push(prep)
        await createItem(prep)
      }
      c_t3++


    } else {
      c_t4++
      await createItem(prep)

    }
  }
  console.log({
    "จ่ายตรงเดือน": c_t1,
    "จ่ายไม่ตรงเดือน - หลายเดือน": c_t2_1,
    "จ่ายไม่ตรงเดือน - หลายเดือน - ไม่ข้ามปี": c_within,
    "จ่ายไม่ตรงเดือน - หลายเดือน - ข้ามปี": c_cross,
    "จ่ายไม่ตรงเดือน - เดือนเดียว": c_t2_2,
    "จ่ายรวมเดือนปัจจุบัน": c_t3,
    "จ่ายรวมเดือนปัจจุบัน - หลายเดือน - ไม่ข้ามปี": c_t3_1,
    "จ่ายรวมเดือนปัจจุบัน - หลายเดือน - ข้ามปี": c_t3_2,
    "จ่ายรวมเดือนปัจจุบัน - หลายเดือน - ไม่ตรง format": c_t3_3,
    "ไม่เข้าพวก": c_t4
  })
  console.log({
    c_all: c_t1 + c_within + c_cross + c_t2_2 + c_t3_1 + c_t3_2 + c_t3_3 + c_t4,
  })
  console.log({
    c_done,
    c_called
  })
  console.log(count)
  console.log(notfounds.length)
  res.send("done")
}


/*


    
    if (prep.paidType === "จ่ายตรงเดือน") {
      let invoice = await Invoice.findOne({ meter: prep.meter, year: prep.year, month: prep.month }).exec()
      // console.log((invoice??{sequence:"-"}).sequence)
      prep.invoices = [invoice.sequence]
      invoice.isPaid = true
      invoice.receipts = [prep.sequence]
      await invoice.save()
    } else if (prep.paidType === "จ่ายไม่ตรงเดือน") {
      try {
        year = (parseInt(prep.debtText.match(/\d{2}/)[0]) + 2500)
        //@ts-ignore
        if (!hasDash) month = wmaMonth[prep.debtText.match(/(.*?)\d{2}/)[1]]
        // else if()
        else {
          if (prep.debtText.match(/([ก-๙]{2}|[ก-๙]{3})(\d{2})-([ก-๙]{2}|[ก-๙]{3})(\d{2})/g) !== null) {
            console.log("จ่ายข้ามปี")
            let regex = /([ก-๙]{2}|[ก-๙]{3})(\d{2})-([ก-๙]{2}|[ก-๙]{3})(\d{2})/g
            let match = null
            let fromMonth = 0
            let toMonth = 0
            let fromYear = 0
            let toYear = 0
            if (regex.exec(prep.debtText) != null) {
              match = regex.exec(prep.debtText)
              fromYear = (2500 + parseInt(match[2])) - 543
              toYear = (2500 + parseInt(match[4])) - 543
              //@ts-ignore
              fromMonth = wmaMonth[match[1]]
              //@ts-ignore
              toMonth = wmaMonth[match[3]]
              // year = (2500 + parseInt(match[3])) - 543
              console.log({fromYear, toYear, fromMonth, toMonth})
              let invoices = await Invoice.find({ meter: prep.meter, year: year + 543, month: { $gte: fromMonth, $lte: toMonth } }).exec()
              for (const invoice of invoices) {
                invoice.isPaid = true
                invoice.receipts = [prep.sequence]
                await invoice.save()
              }
              prep.invoices = invoices.map((inv: any) => inv.sequence)
              console.log(prep.invoices)
            }
          } else {
            console.log("จ่ายภายในปี")
            let regex = /([ก-๙]{2}|[ก-๙]{3})-([ก-๙]{2}|[ก-๙]{3})(\d{2})/g
            let match = null
            let fromMonth = 0
            let toMonth = 0
            let year = 0
            if (regex.exec(prep.debtText) != null) {
              match = regex.exec(prep.debtText)
              //@ts-ignore
              fromMonth = wmaMonth[match[1]]
              //@ts-ignore
              toMonth = wmaMonth[match[2]]
              year = (2500 + parseInt(match[3])) - 543
              let invoices = await Invoice.find({ meter: prep.meter, year: year + 543, month: { $gte: fromMonth, $lte: toMonth } }).exec()
              for (const invoice of invoices) {
                invoice.isPaid = true
                invoice.receipts = [prep.sequence]
                await invoice.save()
              }
              prep.invoices = invoices.map((inv: any) => inv.sequence)
              console.log(prep.invoices)
            } else {
              notfounds.push({meter:prep.meter, receipt:prep.sequence, debtText:prep.debtText, paidType:prep.paidType})
            }
          }
        }
      } catch (error) {

      }
      // console.log({year,month, debtText:prep.debtText, hasDash})
    } else if (prep.paidType === "จ่ายรวมเดือนปัจจุบัน") {
      // notfounds.push({meter:prep.meter, receipt:prep.sequence, debtText:prep.debtText, paidType:prep.paidType})
    } else {

    }
    // console.log({prep})
    */