import express, { Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";
import AreaCollection from "../../models/areaCollection";
import AreaIncome from "../../models/areaIncome";

export const adjustIncome = (req: Request, res: Response) => {
  AreaIncome.find({}).then((data: Array<any>) => {
    data.forEach((item:any) => {
      let month = item.recordDate == undefined ? 1 : DateTime.fromISO(item.recordDate).toObject().month
      item.month = month
      item.save()
    });
    res.send({ statue: "done" })
  })
};