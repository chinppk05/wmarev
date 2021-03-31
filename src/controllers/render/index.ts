import express, { Request, Response, NextFunction } from 'express'
import Area from '../../models/area/index'
import AreaCondition from '../../models/areaCondition/index'
import Invoice from '../../models/invoice/index'
import mongoose from "mongoose";
import luxon, { DateTime } from "luxon";

export const getCalculationList = (req: Request, res: Response) => {
  let list = req.body.list
  Area.find().select("name _id").lean().then((data: any) => {
    AreaCondition.find().then((areaConditions: any) => {
      let prep: Array<any> = []
      data.forEach((element: any, i: number) => {
        let foundCondition = areaConditions.find((el: any) => {
          return el.area.toString() === element._id.toString()
        })
        let x = areaConditions.findIndex((el: any) => {
          return el.area.toString() === element._id.toString()
        })
        if (foundCondition != undefined) {
          foundCondition.conditions.forEach((item: any, j: number) => {
            if(item.period == "รายไตรมาศ"){
              areaConditions[x].conditions[j].period = "รายไตรมาส"
              areaConditions[x].save().then((data:any)=>console.log("updated"))
            }
            let common = {
              j,
              area: element._id,
              name: element.name,
              contractYear: foundCondition.contractYear,
              operationYear: foundCondition.operationYear,
              operationDate: foundCondition.operationDate,
              period:item.period,
              year:DateTime.fromJSDate(foundCondition.operationDate).plus({year:j}).toObject().year+543,
              newConditionDate:DateTime.fromISO(item.operationDate),
              test:foundCondition.operationYear < j
            }
            if (foundCondition.operationYear <= j) {
              if (item.period == "รายไตรมาส" || item.period == "รายไตรมาศ") {
                prep.push({
                  ...common,
                  quarter: 1
                })
                prep.push({
                  ...common,
                  quarter: 2
                })
                prep.push({
                  ...common,
                  quarter: 3
                })
                prep.push({
                  ...common,
                  quarter: 4
                })
              }
              else {
                prep.push({
                  ...common,
                  quarter: 0
                })
              }
            }
          });
        }
      });

      res.send(prep)
    })
  })
}

export const postCalculationList = (req: Request, res: Response) => {
  let list = req.body.list
  let year = req.body.search.year
  let quarter = req.body.search.quarter
  let month = req.body.search.month
  let area = req.body.search.area
  Area.find({
    _id:area==undefined?undefined:area
  }).select("name _id").lean().then((data: any) => {
    AreaCondition.find().then((areaConditions: any) => {
      let prep: Array<any> = []
      data.forEach((element: any, i: number) => {
        let foundCondition = areaConditions.find((el: any) => {
          return el.area.toString() === element._id.toString()
        })
        let x = areaConditions.findIndex((el: any) => {
          return el.area.toString() === element._id.toString()
        })
        if (foundCondition != undefined) {
          foundCondition.conditions.forEach((item: any, j: number) => {
            if(item.period == "รายไตรมาศ"){
              areaConditions[x].conditions[j].period = "รายไตรมาส"
              areaConditions[x].save().then((data:any)=>console.log("updated"))
            }
            let common = {
              j,
              area: element._id,
              name: element.name,
              contractYear: foundCondition.contractYear,
              operationYear: foundCondition.operationYear,
              operationDate: foundCondition.operationDate,
              period:item.period,
              year:DateTime.fromJSDate(foundCondition.operationDate).plus({year:j}).toObject().year+543,
              newConditionDate:DateTime.fromISO(item.operationDate),
              test:foundCondition.operationYear < j
            }
            if (foundCondition.operationYear <= j) {
              if (item.period == "รายไตรมาส" || item.period == "รายไตรมาศ") {
                prep.push({
                  ...common,
                  quarter: 1
                })
                prep.push({
                  ...common,
                  quarter: 2
                })
                prep.push({
                  ...common,
                  quarter: 3
                })
                prep.push({
                  ...common,
                  quarter: 4
                })
              }
              else {
                prep.push({
                  ...common,
                  quarter: 0
                })
              }
            }
          });
        }
      });
      if(year!=undefined) prep = prep.filter(el=>el.year==year)
      if(month!=undefined) prep = prep.filter(el=>el.month==month)
      if(quarter!=undefined) prep = prep.filter(el=>el.quarter==quarter)
      res.send(prep)
    })
  })
}