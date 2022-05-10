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
export const receiptSequenceTemp = async (req: Request, res: Response) => {
  let { month, year, start, starter, category } = req.body
  let receipts = await Receipt.find({}).sort({ no: 1 }).exec()
  for (const receipt of receipts) {
    starter = starter ?? "642"
    receipt.sequence = starter + String(start++).padStart(7, "0")
    let result = await receipt.save()
    console.log(result)
    
  }
  res.send("done!")
}