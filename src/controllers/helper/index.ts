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
  let paymentStart = DateTime.fromObject({ day: 1, month, year:year-543 }).plus({month:2}).startOf('day').toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 1, month, year:year-543 }).plus({month:2}).endOf('month').endOf('day').toJSDate()
  //{paymentDate:{$gte: ISODate('2021-12-01T00:00:00.000+07:00'), $lte: ISODate('2021-12-31T23:59:59.999+07:00')}}
  let receipts = await Receipt.find({
    paymentDate: {
      $gte: paymentStart,
      $lte: paymentEnd
    },
    category
  }).sort({ excelNum: 1 }).exec()
  let prep:Array<any> = []
  for (const receipt of receipts) {
    starter = starter ?? "642"
    receipt.sequence = starter + String(start++).padStart(6, "0")
    console.log('receipt', receipt.sequence)
    let result = await receipt.save()

    console.log(result)
    prep.push(result)
  }
  res.send(prep)

}
//

export const receiptSequenceTemp = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let deleteResult = await Receipt.deleteMany({sequence:{$exists:false}}).exec()
  console.log({deleteResult})

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
  let invoices = await Invoice.find({$and:[{ receipts: { $exists: true, $ne: [] } },{ receipts: { $exists: true, $ne: ["-"] } }]}).exec()
  
  let i = 0
  let preps:Array<any> = []
  for (const invoice of invoices) {
    let receiptsInInvoice = invoice.receipts
    let receipt = receiptsInInvoice[0]
    preps.push({invoice:invoice.sequence, receipt})
  }
  let preps2 = _.groupBy(preps, 'receipt')
  for(const elem in preps2){
    let receipt = await Receipt.findOne({sequence:elem}).exec()
    if(receipt){
      receipt.invoices = preps2[elem].map(el=>el.invoice)
      let invoiceInside = await Invoice.find({sequence:{$in:receipt.invoices}}).lean().exec()
      receipt.invoicesYearMonth = invoiceInside.map((el:any)=>({year:el.year, month:el.month}))
      let save = await receipt.save()
      if(save) console.log(receipt.invoices)
    }
  }

  res.send({status:"done receipt-invoice!", length:invoices.length, preps2})
}


export const receiptRemoveDuplicate = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let paymentStart = DateTime.fromObject({ day: 1, month, year:year-543 }).plus({month:2}).startOf('day').toJSDate()
  let paymentEnd = DateTime.fromObject({ day: 1, month, year:year-543 }).plus({month:2}).endOf('month').endOf('day').toJSDate()
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