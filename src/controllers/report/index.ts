import express, { Request, Response, NextFunction } from 'express'
import Usage from '../../models/usage/index'
import Invoice from '../../models/invoice/index'
import Receipt from '../../models/receipt/index'
import History from '../../models/history/index'
import mongoose from "mongoose";

export const getDebtByMeter = (req: Request, res: Response) => {
  let meter = req.body.meter
  let list = req.body.list
  Invoice.find({ _id: { $in: list }})
  res.send({})
}
export const getDebtByInvoice = (req: Request, res: Response) => {
  let list = req.body.list
  Invoice.find({ _id: { $in: list }}).lean().then((docs:any)=>{
    Invoice.find({meter:{$in:docs.map((el:any)=>el.meter)}}).lean().then((founds:any)=>{
      docs.forEach((item:any,i:number) => {
        docs[i].debtArray = founds.filter((el:any)=>el.meter==item.meter)
        docs[i].debtText = "ทดสอบหนี้"
        docs[i].debtAmount = 299.50
      });
      res.send(docs)
    })
  })
}
export const getDebtByReceipt = (req: Request, res: Response) => {
  let list = req.body.list
  Receipt.find({ _id: { $in: list }}).lean().then((docs:any)=>{
    docs.forEach((element:any,i:number) => {
      docs[i].debtText = "ทดสอบหนี้"
      docs[i].debtAmount = 399.75
    });
    res.send(docs)
  })
}

let debt1 = new Promise((resolve,reject)=>{
  
  resolve("")
})