import express, { Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";
import AreaCollection from "../../models/areaCollection";
import AreaIncome from "../../models/areaIncome";

export const adjustCollection = (req: Request, res: Response) => {
  AreaCollection.find({}).then((data: Array<any>) => {
    let i = 0
    data.forEach((item:any) => {
      let month = item.recordDate == undefined ? 1 : DateTime.fromJSDate(item.recordDate).toObject().month
      item.month = month
      item.save()
      i++
    });
    res.send({ statue: `done ${i} item(s)` })
  })
};