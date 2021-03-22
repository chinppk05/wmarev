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
    docs.forEach((element:any,i:number) => {
      docs[i].debt = "ทดสอบหนี้"
    });
    res.send(docs)
  })
}
export const getDebtByReceipt = (req: Request, res: Response) => {
  let list = req.body.list
  Receipt.find({ _id: { $in: list }}).lean().then((docs:any)=>{
    docs.forEach((element:any,i:number) => {
      docs[i].debt = "ทดสอบหนี้"
    });
    res.send(docs)
  })
}