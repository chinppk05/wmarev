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
function floorDecimals(value: number, decimals: number) {
  //@ts-ignore
  return Number(Math.floor(value + 'e' + decimals) + 'e-' + decimals);
}

export const batchChangeMeter = (req: Request, res: Response) => {
  let { newMeter, oldMeter } = req.body
  Usage.findOne({ meter: oldMeter }).then(async (usage: any) => {
    usage = JSON.parse(JSON.stringify(usage))
    let prep = {
      $set: {
        meter: newMeter,
        oldMeter: usage.meter,
        oldMeter2: usage.oldMeter,
        oldMeter3: usage.oldMeter2,
      }
    }
    await Usage.updateMany({ meter: oldMeter }, prep).exec()
    await Invoice.updateMany({ meter: oldMeter }, prep).exec()
    await Payment.updateMany({ meter: oldMeter }, prep).exec()
    await Receipt.updateMany({ meter: oldMeter }, prep).exec()
    res.send({ status: "done" })
  })
}

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

export const createInvoice = async (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  let invoiceDate = req.body.invoiceDate ?? new Date()
  let finalArray: Array<any> = []
  var usages: Array<any> = await Usage.find({ _id: { $in: list } }).sort({ no: 1 }).lean().exec()
  var count_i = 0
  var total = usages.length
  var current = 0 // for progress bar
  res.send("done")
  let task = new Task({
    name: "สร้างใบแจ้งหนี้จากทะเบียนคุมผู้ใช้บริการ",
    status: "started",
    year: usages[0].year,
    month: usages[0].month,
    percent: 1,
    createdAt: new Date(),
    createdIP: ip
  })
  for (const usage of usages) {
    let { year, month, category, meter, calculationType } = usage
    let invoice = await Invoice.findOne({ year, month, category, meter, calculationType }).lean().exec()
    if (invoice) {
      usage.foundInvoice = true
      usage.invoice = JSON.parse(JSON.stringify(invoice))
    } else {
      usage.foundInvoice = false
    }
    let exception = ['12170463906'] // สำนักงานสรรพสามิตพื้นที่กระบี่
    let qty = usage.qty / 100
    let rate = usage.rate / 100
    let amount = 0
    if (usage.calculationType == "บาท/เดือน") {
      amount = rate
    } else {
      amount = qty * rate
    }
    var vat = (0.07 * amount)
    var totalAmount = 0
    if (exception.includes(usage.meter)) {
      vat = roundup(vat)
    } else {
      vat = rounddown(vat)
    }
    totalAmount = amount + vat
    let debtAmount = 0
    let debtText = "-"
    let debtDetail: any
    let leanUsage = JSON.parse(JSON.stringify(usage))
    let debt = await Invoice.find({
      meter: meter,
      isPaid: false,
      totalAmount: { $gt: 0 },
      year: { $gt: 0 },
      month: { $gt: 0 }
    }).sort("-year -month").exec()
    console.log(leanUsage.debtAmount["$numberDecimal"], leanUsage.debtAmount["$numberDecimal"] === '0')
    // console.log({debt})
    // console.log({debtText:display0(debt).debtText})
    // console.log({debtAmount:rounddown(display0(debt).debtAmount)})
    if (leanUsage.debtAmount["$numberDecimal"] !== '0') {
      console.log("import")
      debtText = leanUsage.debtText
      debtAmount = parseInt(leanUsage.debtAmount["$numberDecimal"]) / 100
      debtDetail = "import"
      console.log({ type: 'true', debtAmount, debtText })
    } else {
      console.log("process")
      let current_dt = DateTime.fromObject({year:usage.year-543,month:usage.month,day:10})
      debt = JSON.parse(JSON.stringify(debt))
      debt = debt.map((d:any)=>{
        return {
          ...d,
          dt: DateTime.fromObject({
            year: d.year-543,
            month: d.month,
            day:10
          })
        }
      })
      debt = debt.filter((d: any) =>{
        return current_dt > d.dt
      })
      debtText = display0(debt).debtText
      debtAmount = rounddown(display0(debt).debtAmount)
      debtDetail = { display0, debt }
      console.log({ type: 'false', debtAmount, debtText })
    }

    debtText = display0(debt).debtText
    debtAmount = rounddown(display0(debt).debtAmount)
    let result = {
      ...usage,
      qty,
      rate,
      ref: "processed",
      usage: usage._id,
      _id: undefined,
      status: "สร้างใหม่",
      totalAmount,
      vatRate: 0.07,
      debtText,
      debtAmount,
      invoiceDate: invoiceDate,
      vat,
      debtDetail
    }
    delete result.sequence
    // console.log(usage.name, (usage.invoice ?? {}).name)
    result.invoiceAmount = (result.debtAmount + result.totalAmount)
    result.billAmount = rounddown((result.totalAmount * (1 + (result.vatRate ?? 0))))
    let invoiceResult
    if (usage.foundInvoice) {
      let prep = JSON.parse(JSON.stringify(result))
      delete prep._id
      let updateResult1 = await Invoice.findOneAndUpdate({ _id: usage.invoice._id }, { $set: prep }).exec()
      let updateResult2 = await Usage.findOneAndUpdate({ _id: usage._id }, { $set: { isNextStage: true } }).exec()
      console.log("update done", count_i++)
    } else {
      let invoice = new Invoice(result)
      invoiceResult = await invoice.save()
      console.log("insert done", count_i++)
    }
    await Usage.findOneAndUpdate({ _id: usage._id }, { $set: { isNextStage: true } }).exec()
    task.percent = ((current++) / total) * 100
    if (invoiceResult) task.success = (task.success ?? 0) + 1
    else task.failed = (task.failed ?? 0) + 1
    // task.history.push(["insert done", invoice.sequence, "month", invoice.month, result.year, count_i++].join("|"))
    // task.historyText += ["insert done", invoice.sequence, "month", invoice.month, result.year, count_i++].join("|")+"\r\n"
    await task.save()
  }
  task.status = "done"
  await task.save()
}
export const createInvoiceOld = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  let invoiceDate = req.body.invoiceDate ?? new Date()
  let finalArray: Array<any> = []
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
              findExisted.push(getInvoice(usage.year, usage.month, usage.category, usage.categoryType, usage.meter, usage.calculationType))
              let amount = 0
              if (usage.calculationType == "บาท/เดือน") {
                amount = usage.rate
              } else {
                amount = usage.qty * usage.rate
              }
              var vat = (0.07 * amount)
              let exception =
                ['12170463906', '12170438311', '1549766',
                  '12170532850', '1067008', '1067330', '12170366051',
                  '12170366060', '12170366079', '12170366088', '12170367739',
                  '12170367748', '12170407360', '12170449304', '12170449313']
              // '12170464125' นางสุวรรณา ครองสิริวัฒน์ เอาออกเมื่อวันที่ 17 ธันวาคม 2564               //['1067008','1067330','12170449313','12170366079','12170407360','12170366051','12170367739','12170449304','12170366088','12170367748','12170366060']
              let qty = usage.qty
              var round = "-"
              if (exception.includes(usage.meter)) {
                vat = Math.ceil(vat * 100) / 100
                round = 'round up to ' + vat
                // console.log('round up to ',vat)
              } else {
                try {
                  vat = Math.floor(vat * 100) / 100;
                  round = 'round down to ' + vat
                  // let var1 = vat.toString().split(".")
                  // let final = var1[0] + "." + var1[1].slice(0, 2)
                  // let finalFloat = parseFloat(final)
                  // vat = finalFloat
                  // console.log('round down to ',vat)
                } catch (error) {
                  vat = floorDecimals(vat, 2)//Math.floor(vat * 100) / 100
                }
              }

              let rounddown = (num: number) => {
                let result = Math.floor(num * 100) / 100;
                return result
              }

              let result = {
                ...usage,
                qty,
                ref: "processed",
                usage: usage._id,
                _id: undefined,
                status: "สร้างใหม่",
                totalAmount: rounddown(amount * 1.07),
                vatRate: 0.07,
                debtText: display0(debt[i]).debtText,
                debtAmount: display0(debt[i]).debtAmount,
                invoiceDate: invoiceDate,
                vat,
                round,
              }
              result.invoiceAmount = (result.debtAmount + result.totalAmount)
              console.log("result", result.debtAmount, result.totalAmount, result.debtAmount + result.totalAmount)
              result.billAmount = rounddown((result.totalAmount * (1 + (result.vatRate ?? 0))))
              delete result.sequence
              // console.log(result)
              return result
            });
            Promise.all(findExisted)
              .then(async invoices => {
                invoices.forEach((element, i) => {
                  let match = resolved.find((el) => el.meter == element.meter)
                  if (element != undefined) {
                    let prep = resolved.map(el => {
                      // delete el._id
                      el.invoiceId = element._id
                      el.element = element
                      el.match = match
                      el.createdAt = new Date()
                      return el
                    })
                    finalArray.push({ ...prep, finalType: "update" })
                  }
                  else {
                    finalArray.push({ ...resolved[i], finalType: "insert" })
                  }
                });
                console.log("กำลังนำใบแจ้งหนี้ไปบันทึก...", finalArray.length, "ใบ")
                let count_i = 0
                for (const [ii, final] of finalArray.entries()) {
                  let element = final as any
                  console.log("กำลังประมวลผลใบที่ ", count_i++)
                  if (element.finalType == "update") {
                    // console.log("meter update", element)
                    let prepElement = JSON.parse(JSON.stringify(element[ii]))
                    let updateResult1 = await Invoice.findOneAndUpdate({ _id: element[ii].invoiceId }, { $set: prepElement }).exec()
                    let updateResult2 = await Usage.findOneAndUpdate({ _id: usages[ii]._id }, { $set: { isNextStage: true } }).exec()
                    if (count_i == 1) {
                      console.log('updateResult1', element[ii].invoiceId, updateResult1 != undefined ? "update done" : "update fail")
                      console.dir(prepElement)
                    }
                  } else {
                    // console.log("meter insert", element)
                    let invoice = new Invoice(element)
                    await invoice.save()
                  }
                }
              })
              .catch(function (err) {
                console.log("Processing Invoice...2 command ERROR! "); // some coding error in handling happened
                // res.send("Processing Invoice...2 command ERROR! " + err.length)
              }).finally(() => {
                console.log("Processing Invoice 2 Done")
              })
          })
      })
      .catch(function (err) {
        console.log("Processing Invoice...3 command ERROR! "); // some coding error in handling happened
        // res.send("Processing Invoice...3 command ERROR! " + err.length)
      }).finally(() => {
        console.log("Processing Invoice 3 Done")
      })
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
          typeWithMeter: `${el.type}${payment.meter}`
        }
      })
      mapped = [
        ..._.uniqBy(mapped.filter(m => m.type == 'combine'), 'typeWithMeter'),
        ...mapped.filter(m => m.type == 'separate')
      ]

      console.log("mapped.length", mapped.length)
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
      console.log("finalPrep", finalPrep)

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

let getInvoice = (year: number, month: number, category: string, categoryType: string, meter: string, calculationType: string) => {
  return Invoice.findOne({ year, month, category, meter, calculationType }).exec()
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