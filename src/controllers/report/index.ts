import express, { Request, Response, NextFunction } from 'express'
import Usage from '../../models/usage/index'
import Invoice from '../../models/invoice/index'
import Receipt from '../../models/receipt/index'
import Payment from '../../models/payment/index'
import History from '../../models/history/index'
import mongoose from "mongoose";
import luxon, { DateTime } from "luxon";


export const getCustomerHistory = (req: Request, res: Response) => {
  let meter = req.body.meter
  Invoice.find({ meter }).sort("-year -month").lean().then((invoices: any) => {
    Payment.find({ meter }).sort("-year -month").lean().then((payments: any) => {
      Receipt.find({ meter }).sort("-year -month").lean().then((receipts: any) => {
        res.send({
          invoices,
          payments,
          receipts
        })
      })
    })
  })
}

export const getDebtByMeter = (req: Request, res: Response) => {
  let meter = req.body.meter
  let list = req.body.list
  Invoice.find({ _id: { $in: list } })
  res.send({})
}
export const getDebtByInvoice = (req: Request, res: Response) => {
  let list = req.body.list
  let sort = req.body.sort
  let print = req.body.isPrint != undefined ? req.body.isPrint : null
  Invoice.find({ _id: { $in: list } }).sort(sort).then((originals: any) => {
    let docs = JSON.parse(JSON.stringify(originals))
    Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) } }).sort("-year -month").lean().then((founds: any) => {
      docs.forEach((item: any, i: number) => {
        if (print != null) {
          originals[i].isPrint = print
          originals[i].save()
        }
        let debtArray = founds.filter((el: any) => el.meter == item.meter)
        debtArray = debtArray.map((el: any) => {
          return {
            ...el,
            dt: mo(el.year, el.month),
            year: el.year,
            month: el.month
          }
        })
        let { debtText, debtAmount } = display1(debtArray)
        docs[i].debtText = debtText
        docs[i].d0 = display0(debtArray)
        docs[i].debtAmount = debtAmount
        docs[i].debtArray = display2(debtArray)
      });
      res.send(docs)
    })
  })
}

export const getDebtByPayment = (req: Request, res: Response) => {
  let invoice = req.body.invoice
  let print = req.body.isPrint != undefined ? req.body.isPrint : null
  Invoice.findOne({ numberInit: invoice }).then((originals: any) => {
    let doc = JSON.parse(JSON.stringify(originals))
    Invoice.find({ meter: doc.meter }).sort("-year -month").lean().then((founds: any) => {
      let debtArray = founds.filter((el: any) => el.meter == doc.meter)
      debtArray = debtArray.map((el: any) => {
        return {
          ...el,
          dt: mo(el.year, el.month),
          year: el.year,
          month: el.month
        }
      })
      let { debtText, debtAmount } = display1(debtArray)
      doc.debtText = debtText
      doc.d0 = display0(debtArray)
      doc.debtAmount = debtAmount
      doc.debtArray = display2(debtArray)
      res.send(doc)
    })
  })
}


export const getDebtByPaymentList = (req: Request, res: Response) => {
  let list = req.body.list
  let print = req.body.isPrint != undefined ? req.body.isPrint : null
  console.log("getDebtByPaymentList")
  Payment.find({ _id: { $in: list } }).then((originals: any) => {
    let docs = JSON.parse(JSON.stringify(originals))
    Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) } }).sort("-year -month").lean().then((founds: any) => {
      docs.forEach((item: any, i: number) => {
        if (print != null) {
          originals[i].isPrint = print
          originals[i].save()
        }
        let debtArray = founds.filter((el: any) => el.meter == item.meter)
        debtArray = debtArray.map((el: any) => {
          return {
            ...el,
            dt: mo(el.year, el.month),
            year: el.year,
            month: el.month
          }
        })
        let { debtText, debtAmount } = display1(debtArray)
        docs[i].debtText = debtText
        docs[i].d0 = display0(debtArray)
        docs[i].debtAmount = debtAmount
        docs[i].debtArray = display2(debtArray)
      });
      res.send(docs)
    })
  })
}

export const getCustomerLatest = (req: Request, res: Response) => {
  let search = req.body.search
  let sort = req.body.sort
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


//JTM อย่าเพิ่งแตะ++
export const getDebtByReceipt = (req: Request, res: Response) => {
  let list = req.body.list
  let print = req.body.isPrint != undefined ? req.body.isPrint : null
  Receipt.find({ _id: { $in: list } }).then((originals: any) => {
    let docs = JSON.parse(JSON.stringify(originals))
    Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) }, isPaid: false, year: { $gt: 0 }, month: { $gt: 0 } }).sort("-year -month").lean().then((founds: any) => {
      docs.forEach((item: any, i: number) => {
        if (print != null) {
          originals[i].isPrint = print
          originals[i].save()
        }
        let debtArray = founds.filter((el: any) => el.meter == item.meter)
        debtArray = debtArray.map((el: any) => {
          return {
            ...el,
            dt: mo(el.year, el.month),
            year: el.year,
            month: el.month
          }
        })
        let { debtText, debtAmount } = display1(debtArray)
        docs[i].debtText = debtText
        docs[i].d0 = display0(debtArray)
        docs[i].debtAmount = debtAmount
        docs[i].debtArray = display2(debtArray)
      });
      res.send(docs)
    })
  })
}

let mo = (year: number, month: number) => {
  return DateTime.fromObject({
    year: year ?? 5555 - 543,
    month: month ?? 1
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
let display2 = (debt: Array<any>) => {
  let debtArray: Array<any> = []
  var isMiddle = false
  let arr = debt.slice().reverse() as Array<any>
  for (let i = 0; i < arr.length; i++) {
    let amt = (arr[i].rate * arr[i].qty) * 100
    let res = Math.round(amt + (0.07 * amt))
    debtArray.push({
      dt: arr[i].dt,
      year: arr[i].year,
      month: arr[i].month,
      text: DateTime.fromISO(arr[i].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy"),
      amount: (res / 100)
    })
  }
  return debtArray
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
      debtText += DateTime.fromISO(arr[i + 1].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
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