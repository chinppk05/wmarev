import express, { Request, Response, NextFunction } from 'express'
import Receipt from '../../models/receipt/index'
import Invoice from '../../models/invoice/index'
import Usage from '../../models/usage/index'
import Payment from '../../models/payment/index'
import RequestModel from '../../models/request/index'
import Counter from '../../models/counter/index'
import mongoose, { Mongoose } from "mongoose";
import { DateTime } from "luxon";

var options = { upsert: true, new: true, useFindAndModify: false };

export const createInvoice = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  Usage.find({ _id: { $in: list } }).then((usagesList: Array<any>) => {
    let usages = JSON.parse(JSON.stringify(usagesList))
    let promises: Array<Promise<any>> = []
    let debtPromises: Array<Promise<any>> = []
    let findExisted: Array<Promise<any>> = []
    let actualCommand: Array<Promise<any>> = []
    usages.forEach((usage: any) => {
      promises.push(getCounter("Usage", usage.year, usage.month))
      debtPromises.push(getDebt(usage.meter))
    });
    Promise.all(promises).then((values) => {
      Promise.all(debtPromises).then((debt) => {
        let resolved = values.map((element, i) => {
          let usage = usages[i]
          findExisted.push(getInvoice(usage.year, usage.month, usage.category, usage.categoryType, usage.meter))
          let result = {
            ...usage, ref: "processed", usage: usage._id, _id: undefined, status: "สร้างใหม่", totalAmount: usage.qty * usage.rate, debtText: display0(debt[i]).debtText, debtAmount: display0(debt[i]).debtAmount
          }
          delete result.sequence
          return result
        });
        Promise.all(findExisted).then(invoices => {
          invoices.forEach((element, i) => {
            if (element != undefined) {
              let prep = resolved.map(el => {
                delete el._id
                return el
              })
              actualCommand.push(Invoice.findOneAndUpdate({ _id: mongoose.Types.ObjectId(element._id) }, { $set: { ...resolved[i] } }).exec())
            }
            else {
              let invoice = new Invoice(resolved[i])
              actualCommand.push(invoice.save())
              actualCommand.push(Usage.findOneAndUpdate({ _id: usages[i]._id }, { $set: { isNextStage: true } }).exec())
            }
          });
          Promise.all(actualCommand).then(cmd => {
            console.log("command done! " + cmd.length)
            res.send("command done! " + cmd.length)
          })
        })
      })
    });
  })
}

export const printInvoice = async (req: Request, res: Response) => {
  let list = req.body.list
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await Invoice.updateMany({ _id: { $in: list } }, { $set: { isPrint: true, isNextStage: true } }).exec()

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
      Usage.updateMany({ _id: { $in: usages } }, { $set: { isPrint: true, isNextStage: true } }).then(() => {
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
      let result = { ...payment, ref: "processed", invoice: payment.invoice, usage: payment.usage, payment: payment._id, _id: undefined, status: "สร้างใหม่", notes: "test" }
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
          let invoice = new Receipt(payments[i])
          actualCommand.push(invoice.save())
          actualCommand.push(Usage.findOneAndUpdate({ _id: usages[i]._id }, { $set: { isNextStage: true } }).exec())
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

var usages: Array<any> = [
  {
    "qty": 5,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170456052",
    "name": "นางขนิษฐา ศักรภพน์กุล",
    "address": "- ก.ส.ถ.มหาราช ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 115,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170464125",
    "name": "นางสุวรรณา ครองสิริวัฒน์",
    "address": "ก.ส. ถ.มหาราช ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 264,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170421654",
    "name": "บริษัท แอล เอส กร๊ป ฟู้ดแลนด์ จำกัด (เลขที่ผู้เสียษีอากร 0865561001119)",
    "address": "76/1 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 12,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170459495",
    "name": "นายมานะ ทิพย์ยอและ",
    "address": "ก.ส.ถ.มหาราช ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 10,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170480802",
    "name": "นางประนม กาญจนโสภณ",
    "address": "ชั่วคราว ถ.มหาราช ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 158,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170567128",
    "name": "นายวีระ พยุงพันธุ์(098-0153268)",
    "address": "- ชั่วคราว ถ.มหาราชซอย3 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 0,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170317387",
    "name": "นางนวลศรี ภูเก้าล้วน(ระฆังทอง)",
    "address": "1 ถ.มหาราช ซ.3 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 103,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170316159",
    "name": "นายสาคร ประจวบแก่น",
    "address": "30 ถ.มหาราช ซ.3 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 175,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170305308",
    "name": "บริษัท เอสดับบลิว เรสเทอรองต์ จำกัด เลขที่ผู้เสียษีอากร  0815561001887",
    "address": "5 ถ.มหาราช ซ.5  ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 34,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170346392",
    "name": "น.ส.ผ่องศรี ภูเก้าล้วน",
    "address": "4 ถ.มหาราช ซ.5 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 118,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170435071",
    "name": "นายวินัย ศรีสัญญา",
    "address": "11 ถ.มหาราช ซ.5 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 56,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170305335",
    "name": "บ.ศรีผ่องพานิชย์",
    "address": "13 ถ.มหาราช ซ.5  ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 46,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170305362",
    "name": "น.ส.ผ่องศรี ภูเก้าล้วน",
    "address": "23 ถ.มหาราช ซ.5 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 7,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170305371",
    "name": "บริษัทกรีนเฮ้าส์ โฮเต็ล จำกัด เลขที่ผู้เสียภาษีอากร  0815543000211",
    "address": "29 ถ.มหาราช ซ.5 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 6,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170309492",
    "name": "น.ส.ผ่องศรี ภูเก้าล้วน (แฮปปี้โฮม)",
    "address": "42 ถ.มหาราช ซ.5 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 27,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170305401",
    "name": "บ.ศรีผ่องพานิชย์(Dtac)",
    "address": "1 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 18,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170382112",
    "name": "บริษัท เส้งโห ภูเก็ต จำกัด สาขากระบี่ เลขประจำตัวผู้เสียภาษี 0835533001436",
    "address": "6,8,10,12 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 18,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170396940",
    "name": "นางยุวดี เดชสิทธิ์ปวีรา(กระบี่ชานมไข่มุก)",
    "address": "7 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 9,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170349249",
    "name": "นางอรัญญา ลิ่มวงศกร(พลังธรรมชาติ)",
    "address": "13 ถ.มหาราช ซ.7  ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 63,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170383386",
    "name": "นางจำเนียร ศรีเพชร",
    "address": "14 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 1,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170383023",
    "name": "นายกฤษณ์ ขันติ(คลินิกหมอลิลฎา)",
    "address": "18 ถ.มหาราช ซ.7  ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 45,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170354849",
    "name": "นางน้องสาว ล้วนฤทธิ์(ล่องเรือชาบู-ซูชิ)",
    "address": "23 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 11,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170378786",
    "name": "นายนพดล ผลึกเพ็ชร์",
    "address": "27 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 6,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170354559",
    "name": "น.ส.วราภรณ์ เต็นเกิดผล(ห้างทองพันธ์ศิริ)",
    "address": "33 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 6,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170380363",
    "name": "นายจำนง กาญจนโสภณ (คลินิคหมอปรัชญา)",
    "address": "35 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 64,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170356652",
    "name": "นายไข่ สองสมุทร(เจ๊แดง)",
    "address": "47 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 41,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170358830",
    "name": "น.ส.เบญจวรรณ ธัญญาทร",
    "address": "49 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 53,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170368873",
    "name": "น.ส.ลดาวัลย์ ช่วยชาติ(เครื่องแกงบังหมาน)",
    "address": "51 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 100,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170363814",
    "name": "นางสุพิศ พิทักษ์ศาน์ต(ซิวหม่ายหยก)",
    "address": "59 ถ.มหาราช ซ.7 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  },
  {
    "qty": 58,
    "rate": 3.5,
    "year": 2563,
    "month": 2,
    "meter": "12170380813",
    "name": "นางกัญญา ไกรเลิศ",
    "address": "1 ถ.มหาราช ซ.9 ต.ปากน้ำ อ.เมืองกระบี่ จ.กระบี่",
    "category": "2",
    "categoryType": "น้ำเสีย",
    "recordDate": new Date(),
    "isNextStage": false,
    "isPrint": false,
    "code": "01-kb",
  }
]
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

let getCounter = (name: string, year: number, month: number) => {
  var options = { upsert: true, new: true, useFindAndModify: false };
  let budgetYear = year + (month >= 10 ? 1 : 0)
  return Counter.findOneAndUpdate({ name: "Invoice", year: budgetYear }, { $inc: { sequence: 1 } }, options).exec()
}

let getDebt = (meter: string) => {
  return Invoice.find({ meter: meter, isPaid: false, year: { $gt: 0 }, month: { $gt: 0 } }).sort("-year -month").exec()
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
        year: arr[i + 1].year - 543,
        month: arr[i + 1].month,
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
        year: arr[i + 1].year - 543,
        month: arr[i + 1].month,
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