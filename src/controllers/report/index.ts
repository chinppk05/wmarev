import express, { Request, Response, NextFunction } from 'express'
import Usage from '../../models/usage/index'
import Invoice from '../../models/invoice/index'
import Receipt from '../../models/receipt/index'
import History from '../../models/history/index'
import mongoose from "mongoose";
import luxon, { DateTime } from "luxon";

export const getDebtByMeter = (req: Request, res: Response) => {
  let meter = req.body.meter
  let list = req.body.list
  Invoice.find({ _id: { $in: list } })
  res.send({})
}
export const getDebtByInvoice = (req: Request, res: Response) => {
  let list = req.body.list
  Invoice.find({ _id: { $in: list } }).lean().then((docs: any) => {
    Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) } }).sort("-year -month").lean().then((founds: any) => {
      docs.forEach((item: any, i: number) => {
        let debtArray = founds.filter((el: any) => el.meter == item.meter)
        debtArray = debtArray.map((el: any) => {
          return {
            ...el,
            dt: mo(el.year, el.month)
          }
        })
        let { debtText, debtAmount } = display1(debtArray)
        docs[i].debtText = debtText
        docs[i].d0 = display0(debtArray)
        docs[i].debtAmount = debtAmount
      });
      res.send(docs)
    })
  })
}

export const getCustomerLatest = (req: Request, res: Response) => {
  let search = req.params.search
  let sort = req.params.sort
  Invoice.findOne(search).sort(sort).lean().then((doc: any) => {
    Invoice.find({ meter: doc.meter, isPaid: false }).lean().then((debtArray: any) => {
      debtArray = debtArray.map((el: any) => {
        return {
          ...el,
          dt: mo(el.year, el.month)
        }
      })
      let { debtText, debtAmount } = display1(debtArray)
      doc.debtText = debtText
      doc.debtAmount = debtAmount
      res.send(doc)
    })
  })
}





export const getDebtByReceipt = (req: Request, res: Response) => {
  let list = req.body.list
  Receipt.find({ _id: { $in: list } }).lean().then((docs: any) => {
    Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) }, isPaid: false }).sort("-year -month").lean().then((founds: any) => {
      docs.forEach((item: any, i: number) => {
        docs[i].isPrint = true
        docs[i].save()
        let debtArray = founds.filter((el: any) => el.meter == item.meter)
        debtArray = debtArray.map((el: any) => {
          return {
            ...el,
            dt: mo(el.year, el.month)
          }
        })
        let { debtText, debtAmount } = display1(debtArray)
        docs[i].debtText = debtText
        docs[i].d0 = display0(debtArray)
        docs[i].debtAmount = debtAmount
      });
      res.send(docs)
    })
  })
}

let mo = (year: number, month: number) => {
  return DateTime.fromObject({
    year: year - 543,
    month
  })
}

let display0 = (debt: Array<any>) => {
  let debtText = ""
  var debtAmount = 0
  var isMiddle = false
  let arr = debt.slice().reverse() as Array<any>
  for (let i = 0; i < arr.length; i++) {
    debtText += DateTime.fromISO(arr[i].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
    debtText += "/"
    let amt = (arr[i].rate * arr[i].qty) * 100
    let res = Math.round(amt + (0.07 * amt))
    debtAmount += res / 100
  }
  return {
    debtText,
    debtAmount
  }
}

let display1 = (debt: Array<any>) => {
  let debtText = ""
  var debtAmount = 0
  var isMiddle = false
  let arr = debt.slice().reverse() as Array<any>
  for (let i = 0; i < arr.length; i++) {
    var diff: number = 1
    if (i != arr.length - 1) {
      let end = DateTime.fromISO(arr[i + 1].dt)
      let start = DateTime.fromISO(arr[i].dt)
      diff = start.diff(end, "months").toObject().months;
    }

    if (i == 0) {
      debtText += DateTime.fromISO(arr[i].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
    }

    if (diff == -1) {
      if (debtText.slice(-1) != "-") debtText += "-"
    }
    else if (diff < -1) {
      debtText += DateTime.fromISO(arr[i].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
      debtText += "/"
      debtText += DateTime.fromISO(arr[i+1].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
    }
    else {
      debtText += DateTime.fromISO(arr[i].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
      if (i != 0 && i != (arr.length - 1)) debtText += "/"
      isMiddle = false
    }
    let amt = (arr[i].rate * arr[i].qty) * 100
    let res = Math.round(amt + (0.07 * amt))
    debtAmount += res / 100
  }
  return {
    debtText,
    debtAmount
  }
}