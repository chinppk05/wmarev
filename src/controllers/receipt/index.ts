import express, { Request, Response, NextFunction } from 'express'
import DBModel from '../../models/receipt/index'
import Payment from '../../models/payment/index'
import Counter from '../../models/counter/index'
import mongoose from "mongoose";
import * as _ from "lodash"

export const create = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const newObj: any = new DBModel(req.body);
  var options = { upsert: true, new: true, useFindAndModify: false };
  let type = req.body.category
  Counter.findOneAndUpdate(
    { name: "Receipt", year: new Date().getFullYear() },
    { $inc: { sequence: 1 } },
    options,
    (err: Error, doc: any) => {
      let year = (new Date().getFullYear() + 543).toString()
      let yearString = year.substring(2, 4);
      let seq = (doc.sequence).toString()
      let result = yearString + type + seq.padStart(7, "0")
      newObj.numberInit = result
      newObj.number = doc.sequence
      newObj.createdAt = new Date();
      newObj.modifiedAt = new Date();
      newObj.createdIP = ip;
      newObj.save().then((document: any) => {
        res.send(document)
      })
    }
  );
}

export const upsert = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const newObj: any = new DBModel(req.body);
  // newObj.createdAt = new Date();
  newObj.modifiedAt = new Date();
  newObj.createdIP = ip;
  let search = req.body.search
  let doc = { ...req.body.doc, modifiedAt: new Date(), createdIP: ip }
  DBModel.findOneAndUpdate({ meter: doc.meter, month: doc.month, year: doc.year }, doc, { upsert: true }).then((document: any) => {
    res.send(document)
  })
}

export const createMany = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let newList = req.body.list
  var options = { upsert: true, new: true, useFindAndModify: false };
  let count = 0
  newList.forEach((el: any) => {
    Counter.findOneAndUpdate(
      { name: "Receipt", year: new Date().getFullYear() },
      { $inc: { sequence: 1 } },
      options,
      (err: Error, doc: any) => {
        const newObj: any = new DBModel(el);
        let year = (new Date().getFullYear() + 543).toString()
        let yearString = year.substring(2, 4);
        let seq = (doc.sequence).toString()
        let result = yearString + el.category + seq.padStart(7, "0")
        newObj.numberInit = result
        newObj.number = doc.sequence
        newObj.createdAt = new Date();
        newObj.modifiedAt = new Date();
        newObj.createdIP = ip;
        newObj.save().then((document: any) => {
          // res.send(document)
        })
      }
    );
    count++
    if (count == newList.length) {
      res.send({ status: "success" })
    }
  })
}

export const list = (req: Request, res: Response) => {
  DBModel.find({})
    .then(function (data: Array<any>) {
      res.send(data)
    })
}

export const get = (req: Request, res: Response) => {
  let sid = req.params.id.length != 24 ? '000000000000000000000000' : req.params.id
  let id = mongoose.Types.ObjectId(sid)
  DBModel.findById({ _id: id }).then(function (data: any) {
    res.send(data)
  })
}

export const getByField = (req: Request, res: Response) => {
  let field = req.params.field
  let value = req.params.value
  let search: any = {}
  search[field] = value
  DBModel.findOne(search).then(function (data: any) {
    res.send(data)
  })
}

export const postOne = (req: Request, res: Response) => {
  let search = req.body.search
  DBModel.findOne(search).then(function (data: any) {
    res.send(data)
  })
}

export const update = (req: Request, res: Response) => {
  let sid = req.params.id.length != 24 ? '000000000000000000000000' : req.params.id
  let id = mongoose.Types.ObjectId(sid)
  DBModel.updateOne({ _id: id }, { ...req.body, modifiedAt: new Date(), $inc: { _v: 1 } }).then((data: any) => {
    res.send(data)
  })
}

export const remove = (req: Request, res: Response) => {
  let sid = req.params.id.length != 24 ? '000000000000000000000000' : req.params.id
  let id = mongoose.Types.ObjectId(sid)
  DBModel.deleteOne({ _id: id }, req.body).then((data: any) => {
    res.send(data)
  })
}

export const removeMany = (req: Request, res: Response) => {
  let list: Array<string> = req.body.list
  let ids = list.map(el => mongoose.Types.ObjectId(el))
  DBModel.find({ _id: { $in: ids } }).then((data1: any) => {
    let payments = _.flatten(data1.map((d:any)=>d.invoices))
    Payment.updateMany({_id:  { $in: payments }},{$set:{isNextStage:false}}).then((data2: any) => {
      DBModel.deleteMany({ _id: { $in: ids } }).then((data: any) => {
        res.send(data);
      });
    })
  })
};

export const information = (req: Request, res: Response) => {
  DBModel.aggregate([{
    $group: {
      _id: {
        year: "$year",
        month: "$month"
      },
      sum: {
        "$sum": 1
      }
    }
  }, {
    $project: {
      year: "$_id.year",
      month: "$_id.month",
      sum: "$sum",
    }
  }, {
    $sort: {
      year: -1,
      month: -1,
    }
  }]).then((data: Array<any>) => {
    res.send(data)
  })
}


export const postPaginate = (req: Request, res: Response) => {
  let searchObj = req.body.search
  let sort: any = req.body.sort;
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  const options = {
    sort: { ...sort }, offset: skip, limit: limit, populate: populate, lean: false,
    pagination: req.body.paginate != undefined && req.body.paginate === false,
  };
  DBModel.paginate(
    searchObj,
    options
  ).then(function (data: any) {

    let docs = JSON.parse(JSON.stringify(data.docs))
    DBModel.find(searchObj).then((data2: any) => {
      data2.forEach((el: any) => {
        // if(el.sequence.search("wma-") == -1){
        //   el.sequence = "wma-"+el.sequence
        //   el.save()
        // }
      });
      let data3 = JSON.parse(JSON.stringify(data2))
      res.send({
        docs: docs,
        total: data.total,
        totalCount: data3.length,
        ids: data3.map((el: any) => el._id ?? ""),
        totalQty: data3.map((el: any) => el.qty ?? 0).reduce((a: number, b: number) => a + b, 0),
        totalAmount: data3.map((el: any) => el.invoiceAmount ?? 0).reduce((a: number, b: number) => a + b, 0),
        totalPayment: data3.map((el: any) => el.paymentAmount ?? 0).reduce((a: number, b: number) => a + b, 0),
        totalDebt: data3.map((el: any) => el.debtAmount ?? 0).reduce((a: number, b: number) => a + b, 0),

        totalVat: data3.map((el: any) => el.vat ?? 0).reduce((a: number, b: number) => a + b, 0),
        totalTax: data3.map((el: any) => el.vat ?? 0).reduce((a: number, b: number) => a + b, 0),
        // totalTax: data3.map((el: any) => {

        //   let amount = (el.qty * el.rate * 0.07)
        //   let debtAmount = el.debtAmount * 0.07

        //   let calc1 = Math.floor(amount * 100) / 100
        //   let calc2 = parseFloat(calc1.toFixed(2))

        //   let calc3 = Math.floor(debtAmount * 100) / 100
        //   let calc4 = parseFloat(calc3.toFixed(2))

        //   return calc2 + calc4
        // }).reduce((a: number, b: number) => a + b, 0),
        debtTax: data3.map((el: any) => {

          let amount = (el.qty * el.rate * 0.07)
          let debtAmount = el.debtAmount * 0.07

          let calc1 = Math.floor(amount * 100) / 100
          let calc2 = parseFloat(calc1.toFixed(2))

          let calc3 = Math.floor(debtAmount * 100) / 100
          let calc4 = parseFloat(calc3.toFixed(2))

          return calc4
        }).reduce((a: number, b: number) => a + b, 0),
        invoiceTax: data3.map((el: any) => {

          let amount = (el.qty * el.rate * 0.07)
          let debtAmount = el.debtAmount * 0.07

          let calc1 = Math.floor(amount * 100) / 100
          let calc2 = parseFloat(calc1.toFixed(2))

          let calc3 = Math.floor(debtAmount * 100) / 100
          let calc4 = parseFloat(calc3.toFixed(2))

          return calc2
        }).reduce((a: number, b: number) => a + b, 0),
      })
    })
  });
};

export const postGroup = (req: Request, res: Response) => {
  let group = req.body.group
  let sum = req.body.sum
  DBModel.aggregate(
    [
      {
        $group: {
          _id: group,
          count: {
            $sum: 1
          },
          sum: {
            $sum: sum
          },
          children: {
            $addToSet: "$$ROOT"
          }
        }
      }
    ]
  ).exec(function (error: Error, data: Array<any>) {
    res.send(data);
  });
};



export const excelDownload = (req: Request, res: Response) => {
  const Excel = require('exceljs')
  let searchObj = req.body.search
  var workbook = new Excel.Workbook();
  let sheet = workbook.addWorksheet("Sheet1");
  DBModel.find(searchObj).lean().then(async function (data: Array<any>) {
    let header: Array<string> = []
    data.forEach((el: any, idx: number) => {
      for (const [key, value] of Object.entries(el)) {
        if (header.find(hel => hel === key) == undefined) header.push(key)
      }
    })
    sheet.addRow(header);
    data.forEach((el: any, idx: number) => {
      let body: Array<string> = []
      header.forEach(hel => {
        let prep = el[hel] ?? "-"
        try {
          if (JSON.stringify(prep).search('numberDecimal') != -1) {
            prep = JSON.parse(JSON.stringify(prep))
            prep = parseFloat((parseInt(prep.$numberDecimal) / 100).toFixed(2))
          }
        } catch (error) {
          console.log(error)
        }
        body.push(prep)
      })
      sheet.addRow(body);
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  })
}