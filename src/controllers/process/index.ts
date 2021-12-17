import express, { Request, Response, NextFunction } from 'express'
import Receipt from '../../models/receipt/index'
import Invoice from '../../models/invoice/index'
import Usage from '../../models/usage/index'
import Payment from '../../models/payment/index'
import RequestModel from '../../models/request/index'
import Counter from '../../models/counter/index'
import mongoose, { Mongoose } from "mongoose";
import { DateTime } from "luxon";
import * as _ from "lodash"

var options = { upsert: true, new: true, useFindAndModify: false };
function floorDecimals(value:number, decimals:number) { 
  //@ts-ignore
  return Number(Math.floor(value+'e'+decimals)+'e-'+decimals); 
}
export const createInvoice = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  let invoiceDate = req.body.invoiceDate ?? new Date()
  let finalArray:Array<any> = []
  console.log("Processing Invoice... " + (list ?? []).length + " item(s)")
  Usage.find({ _id: { $in: list } }).sort('no').then((usagesList: Array<any>) => {
    let usages = JSON.parse(JSON.stringify(usagesList))
    let promises: Array<Promise<any>> = []
    let debtPromises: Array<Promise<any>> = []
    let findExisted: Array<Promise<any>> = []
    let actualCommand: Array<Promise<any>> = []
    usages.forEach((usage: any) => {
      promises.push(getCounter("Usage", usage.year, usage.month))
      debtPromises.push(getDebt(usage.meter))
    });
    Promise.all(promises)
      .then((values) => {
        Promise.all(debtPromises)
          .then((debt) => {
            let resolved = values.map((element, i) => {
              let usage = usages[i]
              findExisted.push(getInvoice(usage.year, usage.month, usage.category, usage.categoryType, usage.meter))
              let amount = usage.qty * usage.rate
              let vat = (0.07 * amount)
              let exception = 
                ['12170463906','12170438311','12170464125','1549766',
                '12170532850','1067008','1067330','12170366051',
                '12170366060','12170366079','12170366088','12170367739',
                '12170367748','12170407360','12170449304','12170449313']                              //['1067008','1067330','12170449313','12170366079','12170407360','12170366051','12170367739','12170449304','12170366088','12170367748','12170366060']
              let qty = usage.qty
              if (exception.includes(usage.meter)) {
                vat = Math.ceil(vat * 100) / 100
                console.log('round up to ',vat)
              } else {
                // vat = floorDecimals(vat,2)//Math.floor(vat * 100) / 100
                try {
                  let var1 = vat.toString().split(".")
                  let final = var1[0] + "." + var1[1].slice(0, 2)
                  let finalFloat = parseFloat(final)
                  vat = finalFloat
                  console.log('round down to ',vat)
                } catch (error) {
                  vat = vat
                }
              }

              let result = {
                ...usage,
                qty,
                ref: "processed",
                usage: usage._id,
                _id: undefined,
                status: "สร้างใหม่",
                totalAmount: amount,
                vatRate: 0.07,
                debtText: display0(debt[i]).debtText,
                debtAmount: display0(debt[i]).debtAmount,
                invoiceDate: invoiceDate,
                vat,
              }
              result.invoiceAmount = result.debtAmount + (result.totalAmount * (1 + (result.vatRate ?? 0)))
              result.billAmount = (result.totalAmount * (1 + (result.vatRate ?? 0)))
              delete result.sequence
              // console.log(result)
              return result
            });
            Promise.all(findExisted)
              .then(async invoices => {
                invoices.forEach((element, i) => {
                  if (element != undefined) {
                    let prep = resolved.map(el => {
                      delete el._id
                      el.createdAt = new Date()
                      return el
                    })
                    finalArray.push({...resolved[i],finalType:"update"})
                  }
                  else {
                    finalArray.push({...resolved[i],finalType:"insert"})
                  }
                });
                finalArray.forEach(async (element, i) => {
                  await setTimeout(async ()=>{
                    console.log("meter", element.meter)
                    if(element.finalType=="update"){
                      await Invoice.findOneAndUpdate({ _id: mongoose.Types.ObjectId(element._id) }, { $set: { ...element } }).exec()
                      await Usage.findOneAndUpdate({ _id: usages[i]._id }, { $set: { isNextStage: true } }).exec()
                    } else {
                      let invoice = new Invoice(element)
                      invoice = new Invoice(element)
                      await invoice.save()
                    }
                  },i*10)
                })
              })
              .catch(function (err) {
                console.log("Processing Invoice...2 command ERROR! " + err.message); // some coding error in handling happened
                // res.send("Processing Invoice...2 command ERROR! " + err.length)
              });
          })
      })
      .catch(function (err) {
        console.log("Processing Invoice...3 command ERROR! " + err.message); // some coding error in handling happened
        // res.send("Processing Invoice...3 command ERROR! " + err.length)
      });
  })
  res.send("done")
}


export const printInvoice = async (req: Request, res: Response) => {
  let list = req.body.list
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await Invoice.updateMany({ _id: { $in: list } }, { $set: { isPrint: true, isNextStage: true, printDate: new Date() } }).exec()

  let searchObj = { _id: { $in: list } };
  let sort: any = req.body.sort;
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  const options = {
    sort: sort,
    offset: skip,
    limit: limit,
    populate: populate,
    lean: false,
  };
  Invoice.paginate(searchObj, options).then(function (data: any) {
    let docs = JSON.parse(JSON.stringify(data.docs))
    Invoice.find(searchObj).then((data2: any) => {
      let data3 = JSON.parse(JSON.stringify(data2))
      let usages = docs.map((el: any) => el.usage)
      console.log(usages)
      Usage.updateMany({ _id: { $in: usages } }, { $set: { isPrint: true, isNextStage: true, printDate: new Date() } }).then(() => {
        res.send({
          docs: docs,
          total: data.total,
          totalCount: data3.length,
          ids: data3.map((el: any) => el._id ?? ""),
          totalQty: data3.map((el: any) => el.qty ?? 0).reduce((a: number, b: number) => a + b, 0),
          totalAmount: data3.map((el: any) => el.totalAmount ?? 0).reduce((a: number, b: number) => a + b, 0),
          totalDebt: data3.map((el: any) => (el.totalAmount ?? 0) + (el.debtAmount ?? 0)).reduce((a: number, b: number) => a + b, 0)
        })
      })
    })
  });
}


export const createReceipt = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  Payment.find({ _id: { $in: list } }).then((paymentsList: Array<any>) => {

    let findExisted: Array<Promise<any>> = []
    let actualCommand: Array<Promise<any>> = []

    let payments = JSON.parse(JSON.stringify(paymentsList))
    payments = payments.map((payment: any) => {
      findExisted.push(Receipt.findOne({ year: payment.year, month: payment.month, meter: payment.meter }).exec())
      let result = {
        ...payment,
        ref: "processed",
        invoices: [payment._id],
        usage: payment.usage,
        payment: payment._id,
        _id: undefined,
        status: "สร้างใหม่",
        notes: "test"
      }
      result.totalAmount = parseFloat((result.qty * result.rate).toFixed(2))
      result.vat = parseFloat((result.qty * result.rate * 0.07).toFixed(2))
      delete result.sequence
      delete result._id
      return result
    })
    Promise.all(findExisted).then(receipts => {
      receipts.forEach((element, i) => {
        if (element != undefined) {
          actualCommand.push(Receipt.findOneAndUpdate({ _id: mongoose.Types.ObjectId(element._id) }, { $set: { ...payments[i] } }).exec())
        }
        else {
          let receipt = new Receipt(payments[i])
          actualCommand.push(receipt.save())
          actualCommand.push(Payment.findOneAndUpdate({ _id: payments[i]._id }, { $set: { isNextStage: true } }).exec())
        }
      });
      Promise.all(actualCommand).then(cmd => {
        console.log("command done! " + cmd.length)
        res.send("command done! " + cmd.length)
      })
      // Receipt.insertMany(payments).then((docs: Array<any>) => {
      //   res.send(docs)
      // })
    })
  })
}

export const createReceiptV2 = (req: Request, res: Response) => {
  try {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    let list: Array<{ id: string, type: string }> = req.body.list
    let finalPrep: Array<any> = []
    Payment.find({ _id: { $in: list.map(o => o.id) } }).then((payments: Array<any>) => {
      payments = JSON.parse(JSON.stringify(payments))
      let startMeter = ""
      // console.log("start list")
      // console.log(payments)
      let mapped = payments.map((payment: any) => {
        let el = list.find(o => o.id == payment._id)
        return {
          ...payment,
          type: el.type,
          typeWithMeter:`${el.type}${payment.meter}`
        }
      })
      mapped = [
        ..._.uniqBy(mapped.filter(m=>m.type=='combine'), 'typeWithMeter'),
        ...mapped.filter(m=>m.type=='separate')
      ]

      console.log("mapped.length",mapped.length)
      mapped.forEach((payment: any, i) => {
        let prep: any = {}
        let el = list.find(o => o.id == payment._id)
        // console.log(el.type)
        if (el.type == "separate") {
          prep = {
            ...payment,
            ref: "processed/separate",
            invoices: [payment._id],
            usage: payment.usage,
            payment: payment._id,
            _id: undefined,
            status: "สร้างใหม่",
            notes: "test",
            processing: true,
          }
          prep.totalAmount = parseFloat((prep.qty * prep.rate).toFixed(2))
          prep.vat = parseFloat((prep.qty * prep.rate * 0.07).toFixed(2))
          delete prep.sequence
          delete prep._id
          finalPrep.push(prep)
        } else if (el.type == "combine") {
          let sort = _.sortBy(payments, 'year')
          sort = _.sortBy(sort, 'month')
          let group = _.groupBy(sort, 'meter')
          // console.log(group)
          let something = group[payment.meter]
          prep = {
            ...something[something.length - 1],
            paymentAmount: something.map(el => el.paymentAmount ?? 0).reduce((a: number, b: number) => a + b, 0),
            invoiceAmount: something.map(el => el.invoiceAmount ?? 0).reduce((a: number, b: number) => a + b, 0),
            invoices: something,
            ref: "processed/combine",
            usage: payment.usage,
            payment: payment._id,
            _id: undefined,
            status: "สร้างใหม่",
            notes: "test",
            processing: true,
            payments: something.map(el => {
              return {
                _id: el._id ?? "",
                month: el.month ?? 0,
                year: el.year ?? 0
              }
            }),
          }
          
          prep.totalAmount = parseFloat((prep.qty * prep.rate).toFixed(2))
          prep.vat = parseFloat((prep.qty * prep.rate * 0.07).toFixed(2))
          delete prep.sequence
          delete prep._id
          finalPrep.push(prep)
        }
      })
      finalPrep = _.sortBy(finalPrep, 'excelNum')
      // Insanity Debugging
      console.log("finalPrep",finalPrep)

      let chain: Promise<any> = Promise.resolve();
      for (let item of finalPrep) {
        try {
          chain = chain.then(() => upsertReceipt(item));
        } catch (error) {
          console.log(item.url + "error!", error)
        }
      }
      chain.then(() => res.send("command done!"))
    })
  } catch (error) {
    res.send("error")
  }
}

const upsertReceipt = (doc: any) => {
  let prep = JSON.parse(JSON.stringify(doc))
  delete prep._id
  var options = { upsert: true, new: true, useFindAndModify: false };
  console.log(doc.excelNum, doc.year, doc.month, doc.meter)
  Counter.findOneAndUpdate(
    { name: "Receipt", year: doc.year, category: doc.category },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, counterDoc: any) => {
      let sequence = counterDoc.year.toString().slice(-2) + (counterDoc.category ?? "9") + counterDoc.sequence.toString().padStart(7, "0");
      prep.sequence = sequence
      console.log(prep)
      return new Promise((resolve, reject) => {
        Receipt.findOneAndUpdate({ meter: doc.meter, year: doc.year, month: doc.month }, prep, options).then((docs: Array<any>) => {
          resolve(doc)
        }).catch((err: any) => {
          reject(err)
        })
      })
    })
}

export const approvalRequestReceipt = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  let request = new RequestModel({
    requestType: "พิมพ์ใบเสร็จ",
    list: list,
    status: "ขออนุมัติ",
    requester: req.body.requester,
    approver: req.body.approver,
    requestDate: new Date(),
    createdAt: new Date()
  })
  request.save().then(() => {
    Receipt.updateMany({ _id: { $in: list } }, { $set: { isRequested: true, status: "ขออนุมัติ" } }).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const approvalApprovedReceipt = (req: Request, res: Response) => {
  let sid = req.body.id.length != 24 ? '000000000000000000000000' : req.body.id
  let id = mongoose.Types.ObjectId(sid)
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  RequestModel.updateOne({ _id: id }, { $set: { status: "อนุมัติแล้วรอลงนาม" } }).then((data: any) => {
    Receipt.updateMany({ _id: { $in: req.body.list.map((el: string) => mongoose.Types.ObjectId(el)) } }, { $set: { isApproved: true, status: "อนุมัติแล้วรอลงนาม" } }).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const signReceipt = (req: Request, res: Response) => {
  let sid = req.body.id.length != 24 ? '000000000000000000000000' : req.body.id
  let id = mongoose.Types.ObjectId(sid)
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let signature = req.body.signature
  RequestModel.updateOne({ _id: id }, { $set: { status: "อนุมัติแล้วลงนามแล้ว" } }).then((data: any) => {
    Receipt.updateMany({ _id: { $in: req.body.list.map((el: string) => mongoose.Types.ObjectId(el)) } }, { $set: { isSigned: true, status: "อนุมัติแล้วลงนามแล้ว", signature } }).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const printReceipt = async (req: Request, res: Response) => {
  let list = req.body.list
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await Receipt.updateMany({ _id: { $in: req.body.list.map((el: string) => mongoose.Types.ObjectId(el)) } }, { $set: { isPrint: true, isNextStage: true, printDate: new Date() } }).exec()

  let searchObj = { _id: { $in: req.body.list.map((el: string) => mongoose.Types.ObjectId(el)) } };
  let sort: any = req.body.sort;
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  const options = {
    sort: sort,
    offset: skip,
    limit: limit,
    populate: populate,
    lean: false,
  };
  Receipt.paginate(searchObj, options).then(function (data: any) {
    let docs = JSON.parse(JSON.stringify(data.docs))
    Receipt.find(searchObj).then((data2: any) => {
      let data3 = JSON.parse(JSON.stringify(data2))
      let payments = docs.map((el: any) => el.payment)
      Payment.updateMany({ _id: { $in: payments } }, { $set: { isPrint: true, isNextStage: true } }).then(() => {
        res.send({
          docs: docs,
          total: data.total,
          totalCount: data3.length,
          ids: data3.map((el: any) => el._id ?? ""),
          totalQty: data3.map((el: any) => el.qty ?? 0).reduce((a: number, b: number) => a + b, 0),
          totalAmount: data3.map((el: any) => el.totalAmount ?? 0).reduce((a: number, b: number) => a + b, 0),
          totalDebt: data3.map((el: any) => (el.totalAmount ?? 0) + (el.debtAmount ?? 0)).reduce((a: number, b: number) => a + b, 0)
        })
      })
    })
  });
}

/*
export const createTestUsage = async (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let usagesData = usages.map(el => {
    return { ...el, notes: "test", year: new Date().getFullYear() + 543, month: new Date().getMonth() + 1 }
  })
  await Invoice.deleteMany({ notes: "test" }).exec()
  await Usage.deleteMany({ notes: "test" }).exec()

  Usage.insertMany(usagesData).then((docs: Array<any>) => {
    res.send(docs)
  })
}

export const createTestPayment = async (req: Request, res: Response) => {
  console.time("time")
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let invoicePromises: Array<Promise<any>> = []

  let paymentsData = usages.map(el => {
    invoicePromises.push(Invoice.findOne({ year: new Date().getFullYear() + 543, month: new Date().getMonth() + 1, meter: el.meter }).exec())
    return { ...el, notes: "test", year: new Date().getFullYear() + 543, month: new Date().getMonth() + 1 }
  })
  await Payment.deleteMany({ notes: "test" }).exec()
  await Receipt.deleteMany({ notes: "test" }).exec()

  Promise.all(invoicePromises).then(invoices => {
    console.timeEnd("time")
    console.time("time")
    let payments = invoices.map((invoice, i) => {

      let invdata = JSON.parse(JSON.stringify(invoice))
      console.log(invdata)
      return {
        // ...paymentsData[i],
        ...invdata,
        usage: invdata.usage,
        invoice: invdata._id,
        vatRate: 0.07,
        invoiceAmount: (invdata.totalAmount ?? 0) + (invdata.debtAmount ?? 0),
        billAmount: (invdata.totalAmount ?? 0),
        paymentAmount: Math.ceil((invdata.totalAmount * 1.01 * 1.07) ?? 0),
        paymentDate: new Date(),
        notes: "test",
        isNextStage: false,
        isPrint: false,
        _id: undefined
      }
    })
    Payment.insertMany(payments).then((docs: Array<any>) => {
      console.timeEnd("time")
      res.send(docs)
    })
  })
}
*/

let getCounter = (name: string, year: number, month: number) => {
  var options = { upsert: true, new: true, useFindAndModify: false };
  let budgetYear = year + (month >= 10 ? 1 : 0)
  return Counter.findOneAndUpdate({ name: "Invoice", year: budgetYear }, { $inc: { sequence: 1 } }, options).exec()
}

let getDebt = (meter: string) => {
  return Invoice.find({ meter: meter, isPaid: false, totalAmount: { $gt: 0 }, year: { $gt: 0 }, month: { $gt: 0 } }).sort("-year -month").exec()
}

let getSequence = (year: number, category: string, sequence: number) => {
  return year.toString().slice(-2) + (category ?? "*") + sequence.toString().padStart(7, "0");
}

let getInvoice = (year: number, month: number, category: string, categoryType: string, meter: string) => {
  return Invoice.findOne({ year, month, category, meter }).exec()
}

let display0 = (debt: Array<any>) => {
  let debtText = ""
  var debtAmount = 0
  var isMiddle = false
  let arr = debt.slice().reverse() as Array<any>
  for (let i = 0; i < arr.length; i++) {
    let current = DateTime.fromObject({
      year: arr[i].year - 543,
      month: arr[i].month,
      day: 5
    })
    if (i == 0) {
      debtText += current.reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
      let next = DateTime.fromObject({
        year: ((arr[i + 1] ?? {}).year ?? 2600) - 543,
        month: ((arr[i + 1] ?? {}).month ?? 13),
        day: 5
      })
      const diffNext = current.diff(next, "months").toObject().months
      if (diffNext == -1) debtText += "-"
      else debtText += "/"
    }
    else if (i == arr.length - 1) {
      debtText += current.reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
    }
    else {
      let last = DateTime.fromObject({
        year: arr[i - 1].year - 543,
        month: arr[i - 1].month,
        day: 5
      })
      let next = DateTime.fromObject({
        year: ((arr[i + 1] ?? {}).year ?? 2600) - 543,
        month: ((arr[i + 1] ?? {}).month ?? 13),
        day: 5
      })
      const diffLast = current.diff(last, "months").toObject().months
      const diffNext = current.diff(next, "months").toObject().months
      if (diffLast == 1) isMiddle = true
      else if (diffNext == -1) isMiddle = true
      else isMiddle = false
      if (isMiddle) {
        if (debtText.slice(-1) != "-") debtText += "-"
      }
      else {
        debtText += current.reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
        debtText += "/"
        debtText += next.reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")

      }
    }

    let amt = (arr[i].rate * arr[i].qty) * 100
    let res = parseFloat((amt * (1 + arr[i].vatRate)).toFixed(2))
    debtAmount += res / 100
  }
  return {
    debtText,
    debtAmount
  }
}