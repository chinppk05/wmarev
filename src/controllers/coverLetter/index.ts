import express, { Request, Response, NextFunction } from 'express'
import DBModel from '../../models/coverLetter/index'
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

export const upsert = (req: Request, res: Response) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const newObj: any = new DBModel(req.body);
  newObj.createdAt = new Date();
  newObj.modifiedAt = new Date();
  newObj.createdIP = ip;
  let search = req.body.search
  let doc = req.body.doc
  console.log(req.body)
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


export const postPaginate = (req: Request, res: Response) => {
  let searchObj = req.body.search
  let sort: any = req.body.sort;
  let populate: any = req.body.populate;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  DBModel.paginate(
    searchObj,
    { sort: { ...sort }, offset: skip, limit: limit, populate: '', lean: true }
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