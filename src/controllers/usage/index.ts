import express, { Request, Response, NextFunction } from 'express'
import DBModel from '../../models/usage/index'
import Invoice from '../../models/invoice/index'
import History from '../../models/history/index'
import mongoose from "mongoose";

export const create = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const newObj: any = new DBModel(req.body);
  newObj.createdAt = new Date();
  newObj.modifiedAt = new Date();
  newObj.createdIP = ip;
  newObj.save().then((document: any) => {
    res.send(document)
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
  DBModel.findByIdAndUpdate(id, { ...req.body, modifiedAt: new Date(), $inc: { _v: 1 } }).then((data: any) => {
    res.send(data)
    History.findOne({
      name: "usages",
      documentId: id,
    }).sort("-version").then((latest: any) => {
      let version = 1
      // console.log(typeof latest,latest)
      if (latest != null) version = latest.version + 1
      History.create({
        name: "usages",
        documentId: id,
        username: req.body.username,
        version: version,
        from: data,
        to: req.body,
        createdAt: new Date()
      })
    })
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
  DBModel.deleteMany({ _id: { $in: ids } }).then((data: any) => {
    res.send(data);
  });
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
  let sort: any = { ...req.body.sort, no: 1 };
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  console.time("paginateInit")
  DBModel.paginate(
    searchObj,
    { sort: { ...sort }, offset: skip, limit: limit, populate: '', lean: false }
  ).then(function (data: any) {
    let docs = JSON.parse(JSON.stringify(data.docs))
    Invoice.find({ year: searchObj.year, month: searchObj.month, meter: { $in: docs.map((d: any) => d.meter) } })
      .then(function (invoices: Array<any>) {
        console.timeEnd("paginateInit")
        console.time("paginateCalcualtion")
        // docs.forEach((us:any,i:number)=>{
        //   let found = invoices.find(inv=>{
        //     return (inv.year===us.year&&inv.month===us.month&&inv.meter===us.meter)
        //   })
        //   if(found!=undefined){
        //     if(found.isPrint==undefined){
        //       docs[i].isPrint = false
        //     }
        //     else{
        //       docs[i].isPrint = found.isPrint
        //     }
        //   }
        //   else{
        //     docs[i].isPrint = false
        //   }
        // })
        console.timeEnd("paginateCalcualtion")
        console.time("paginateFinal")
        DBModel.find(searchObj).then((data2: any) => {
          console.timeEnd("paginateFinal")
          res.send({
            docs: docs,
            total: data.total,
            totalCount: data2.length,
            ids: data2.map((el: any) => el._id ?? ""),
            totalQty: data2.map((el: any) => el.qty ?? 0).reduce((a: number, b: number) => a + b, 0)
          })
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
          if (JSON.stringify(prep).search('numberDecimal')!=-1) {
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