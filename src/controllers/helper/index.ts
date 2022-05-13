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
      if(fixed){
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