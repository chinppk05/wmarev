import express, { Request, Response, NextFunction } from 'express'
import DBModel from '../../models/invoice/index'
import Counter from '../../models/counter/index'
import mongoose from "mongoose";

export const create = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const newObj: any = new DBModel(req.body);
  var options = { upsert: true, new: true, useFindAndModify: false };
  let type = req.body.category
  Counter.findOneAndUpdate(
    { name: "Invoice", year: new Date().getFullYear() },
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

export const createMany = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let newList = req.body.list
  var options = { upsert: true, new: true, useFindAndModify: false };
  let count = 0
  newList.forEach((el: any) => {
    Counter.findOneAndUpdate(
      { name: "Invoice", year: new Date().getFullYear() },
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


export const postPaginate = (req: Request, res: Response) => {
  let searchObj = req.body.search
  let sort: any = req.body.sort;
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  const options = {
    sort: { ...sort }, offset: skip, limit: limit, populate: populate, lean: true,
    pagination: req.body.paginate != undefined && req.body.paginate === false,
  };
  DBModel.paginate(
    searchObj,
    options
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