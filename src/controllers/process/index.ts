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
          return {
            ...usage, ref: "processed", invoice: usage._id, _id: undefined, status: "สร้างใหม่", totalAmount: usage.qty * usage.rate, debtText: display0(debt[i]).debtText, debtAmount: display0(debt[i]).debtAmount
          }
        });
        Promise.all(findExisted).then(invoices => {
          invoices.forEach((element, i) => {
            if (element != undefined) {
              console.log('existed')
              console.log("el", element)
              let prep = resolved.map(el=>{
                delete el._id
                return el
              })
              actualCommand.push(Invoice.findOneAndUpdate({ _id: mongoose.Types.ObjectId(element._id) }, { $set: { ...resolved[i] } }).exec())
            }
            else {
              console.log('created')
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

export const createReceipt = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let list = req.body.list
  Payment.find({ _id: { $in: list } }).then((paymentsList: Array<any>) => {
    let payments = JSON.parse(JSON.stringify(paymentsList))
    payments = payments.map((payment: any) => {
      return { ...payment, notes: "processed", invoice: payment._id, _id: undefined, status: "สร้างใหม่" }
    })
    Receipt.insertMany(payments).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const printInvoice = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  Invoice.updateMany({}, { $set: { isPrint: true, isNextStage: true } }).then((docs: Array<any>) => {
    res.send(docs)
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
    Receipt.updateMany({}, { $set: { isRequested: true, status: "ขออนุมัติ" } }).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const approvalApprovedReceipt = (req: Request, res: Response) => {
  let sid = req.params.id.length != 24 ? '000000000000000000000000' : req.params.requestId
  let id = mongoose.Types.ObjectId(sid)
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  RequestModel.updateOne({ _id: id }, { $set: { status: "อนุมัติแล้วรอเซ็น" } }).save().then((data: any) => {
    Receipt.updateMany({ _id: { $in: data.list } }, { $set: { isApproved: true, status: "อนุมัติแล้วรอเซ็น" } }).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const signReceipt = (req: Request, res: Response) => {
  let sid = req.params.id.length != 24 ? '000000000000000000000000' : req.params.requestId
  let id = mongoose.Types.ObjectId(sid)
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let signature = req.params.signature
  RequestModel.updateOne({ _id: id }, { $set: { status: "อนุมัติแล้วเซ็นแล้ว" } }).save().then((data: any) => {
    Receipt.updateMany({ _id: { $in: data.list } }, { $set: { isSigned: true, status: "อนุมัติแล้วเซ็นแล้ว", signature } }).then((docs: Array<any>) => {
      res.send(docs)
    })
  })
}

export const printReceipt = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  Receipt.updateMany({}, { $set: { isPrint: true, isNextStage: true, status: "อนุมัติแล้วเซ็นแล้วพิมพ์แล้ว" } }).then((docs: Array<any>) => {
    res.send(docs)
  })
}


export const createTestUsage = async (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let usages: Array<any> = [
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
  usages = usages.map(el => {
    return { ...el, notes: "test", year: new Date().getFullYear() + 543, month: new Date().getMonth() + 1 }
  })
  await Invoice.deleteMany({ notes: "test" }).exec()
  await Usage.deleteMany({ notes: "test" }).exec()

  Usage.insertMany(usages).then((docs: Array<any>) => {
    res.send(docs)
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
      }
    }

    let amt = (arr[i].rate * arr[i].qty) * 100
    let res = parseFloat((amt * (1 + arr[i].vatRate)).toFixed(2))
    debtAmount += res / 100
  }
  console.log(debtText)
  return {
    debtText,
    debtAmount
  }
}