import express, { Request, Response, NextFunction } from 'express'
import DBModel from '../../models/calculation/index'
import History from '../../models/history/index'
import mongoose from "mongoose";
import Excel from 'exceljs'

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

export const upsert = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const newObj: any = new DBModel(req.body);
  // newObj.createdAt = new Date();
  newObj.modifiedAt = new Date();
  newObj.createdIP = ip;
  let search = req.body.search
  let doc = {...req.body.doc, modifiedAt:new Date()}
  console.log('upsert calculation', doc)
  DBModel.findOneAndUpdate(search, doc, { upsert: true }).then((document: any) => {
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

export const quarterSum = (req: Request, res: Response) => {
  let { area, year, quarter } = req.params
  let yearInt = parseInt(year)
  let quarterInt = parseInt(quarter)
  let id = mongoose.Types.ObjectId(area)
  DBModel.aggregate(
    // { $match:{ area:id, calendarYear:yearInt, quarter:{$lt:quarterInt} } },
    [{$match: {
      area: id,
      calendarYear: yearInt,
      quarter: {
       $lt: quarterInt,
       $gt: 0
      }
     }}, {$group: {
      _id: {
       calendarYear: '$calendarYear',
       quarter: '$quarter'
      },
      max: {
       $max: '$createdAt'
      },
      doc: {
       $first: '$$ROOT'
      }
     }}, {$replaceRoot: {
      newRoot: '$doc'
     }}]
    ).exec(function (error: Error, data: Array<any>) {
    let lean = JSON.parse(JSON.stringify(data))
    let sumExpense = lean.reduce((acc:number, cur:any) => acc+cur.wmaExpenses??0,0)
    let sumeExpense = lean.reduce((acc:number, cur:any) => acc+cur.eWmaExpenses??0,0)
    let sumFinal = lean.reduce((acc:number, cur:any) => acc+(cur.eWmaExpenses??cur.wmaExpenses??0),0)
    res.send({sumExpense, sumeExpense, sumFinal, lean})
  })
}

export const getByField = (req: Request, res: Response) => {
  let field = req.params.field
  let value = req.params.value
  let search: any = {}
  search[field] = value
  DBModel.findOne(search).then(function (data: any) {
    res.send(JSON.parse(JSON.stringify(data)))
  })
}

export const postOne = (req: Request, res: Response) => {
  let search = req.body.search
  let sort = req.body.sort
  DBModel.findOne(search).sort(sort).lean().then(function (data: any) {
    res.send(data)
  })
}

export const update = (req: Request, res: Response) => {
  let sid = req.params.id.length != 24 ? '000000000000000000000000' : req.params.id
  let id = mongoose.Types.ObjectId(sid)
  DBModel.updateOne({ _id: id }, { ...req.body, modifiedAt:new Date(), $inc: { _v: 1 } }).then((data:any) => {
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


export const postPaginate = (req: Request, res: Response) => {
  let searchObj = req.body.search
  let sort: any = req.body.sort;
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  DBModel.paginate(
    searchObj,
    { sort: { ...sort }, offset: skip, limit: limit, populate: '', lean: false }
  ).then(function (data: Array<any>) {
    res.send(data);
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
  let searchObj = req.body.search
  var workbook = new Excel.Workbook();
  let sheet = workbook.addWorksheet("Sheet1");
  DBModel.find(searchObj).lean().then(async function (data: Array<any>) {
    let header:Array<string> = []
    data.forEach((el:any,idx:number)=>{
      for (const [key, value] of Object.entries(el)) {
        
        if(header.find(hel=>hel===key)==undefined) header.push(key)
      }
    })
    sheet.addRow(header);
    data.forEach((el:any,idx:number)=>{
      let body:Array<string> = []
      header.forEach(hel=>{
        body.push(el[hel]??"-")
      })
      sheet.addRow(body);
    });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
  })
}