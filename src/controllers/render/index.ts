import express, { Request, Response, NextFunction } from 'express'
import Area from '../../models/area/index'
import AreaCondition from '../../models/areaCondition/index'
import Invoice from '../../models/invoice/index'
import mongoose from "mongoose";
import luxon, { DateTime } from "luxon";
import Usage from '../../models/usage';
import Calculation from '../../models/calculation';
import e from 'express';
import { filter } from 'gulp-typescript';

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
            if (item.period == "รายไตรมาส") {
              areaConditions[x].conditions[j].period = "รายไตรมาส"
              areaConditions[x].save().then((data: any) => console.log("updated"))
            }
            let common = {
              j,
              area: element._id,
              name: element.name,
              contractYear: foundCondition.contractYear,
              operationYear: foundCondition.operationYear,
              operationDate: foundCondition.operationDate,
              period: item.period,
              year: DateTime.fromJSDate(foundCondition.operationDate).plus({ year: j }).toObject().year + 543,
              newConditionDate: DateTime.fromISO(item.operationDate),
              test: foundCondition.operationYear < j
            }
            if (foundCondition.operationYear <= j) {
              if (item.period == "รายไตรมาส" || item.period == "รายไตรมาส") {
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
      
      res.send(data)
    })
  })
}

export const postCalculationList = (req: Request, res: Response) => {
  let list = req.body.list
  let year = req.body.search.year
  let quarter = req.body.search.quarter
  let month = req.body.search.month
  let area = req.body.search.area
  let limit = req.body.limit
  let skip = req.body.skip
  let searchArea = area != undefined ? { _id: area } : undefined
  Area.find(searchArea).select("name _id").lean().then((data: any) => {
    AreaCondition.find().then(async (areaConditions: any) => {
      let prep: Array<any> = []
      data.forEach((element: any, i: number) => {
        let foundCondition = areaConditions.find((el: any) => {
          return el.area.toString() === element._id.toString()
        })
        let x = areaConditions.findIndex((el: any) => {
          return el.area.toString() === element._id.toString()
        })
        if (foundCondition != undefined) {
          for (let j = 1; j < foundCondition.conditions.length+1; j++) {
            const item = foundCondition.conditions[j-1];
            console.log("j",j)
            // if (item.period == "รายไตรมาส") {
            //   areaConditions[x].conditions[j-1].period = "รายไตรมาส"
            //   areaConditions[x].save().then((data: any) => console.log("updated"))
            // }
            let common = {
              j,
              area: element._id,
              name: element.name,
              contractYear: foundCondition.contractYear,
              operationYear: foundCondition.operationYear,
              operationDate: foundCondition.operationDate,
              period: item.period,
              year: DateTime.fromJSDate(foundCondition.operationDate).plus({ year: j }).toObject().year + 543,
              newConditionDate: DateTime.fromISO(item.operationDate),
              test: foundCondition.operationYear < j,
            }
            if (foundCondition.operationYear <= j) { //TODO: เปลี่ยนจาก foreach ไปเป็น for เพื่อแก้ไข offset ของ contratYear <> j
              if (item.period == "รายไตรมาส" || item.period == "รายไตรมาส") {
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
          }
        }
      });
      if (year != undefined) prep = prep.filter(el => el.year == year)
      if (month != undefined) prep = prep.filter(el => el.month == month)
      if (quarter != undefined) prep = prep.filter(el => el.quarter == quarter)
      let filtered = prep.filter((el,i)=>{
        if(i>=skip){
          if(i<skip+limit){
            return true
          }
        }
        return false
      })
      let calculationQuery = {
        $or:filtered.map(el=>{
          return {
            area:el.area,
            calendarYear:el.year,
            quarter:el.quarter
          }
        })
      }
      console.log(calculationQuery)
      let calculations = await Calculation.find(calculationQuery).exec()
      filtered = filtered.map(el=>{
        return {
          calculations:calculations.filter((c:any)=>{
            return c.area == el.area &&c.year == el.year &&c.quarter == el.quarter
          }),
          ...el
        }
      })
      res.send({
        docs:filtered,
        total:prep.length
      })
    })
  })
}


export const getCustomerList = (req: Request, res: Response) => {

  let searchObj = req.body.search
  let sort: any = req.body.sort;
  let limit: number = parseInt(req.body.limit);
  let skip: number = parseInt(req.body.skip);
  console.log(searchObj)
  Usage.aggregate(
    [
      {
        $match: searchObj
      },
      {
        $sort: {
          year: 1,
          month: 1
        }
      }, {
        $group: {
          _id: "$meter",
          qty: {
            $sum: { $toDouble: { $divide: ["$qty", 100] } }
          },
          amount: {
            $sum: {
              $toDouble:
              {
                $divide: [
                  { $multiply: ["$qty", "$rate"] },
                  100 * 100
                ]
              }
            }
          },
          history: {
            $addToSet:
            {
              name: "ค่าบริการ",
              year: "$year",
              month: "$month",
              value: {
                $toDouble:
                {
                  $divide: [
                    { $multiply: ["$qty", "$rate"] },
                    100 * 100
                  ]
                }
              }
            }
          },
          name: {
            $first: "$name"
          },
          meter: {
            $first: "$meter"
          },
          address: {
            $first: "$address"
          },
        }
      }, {
        $sort: {
          name: 1
        }
      }, { $skip: skip }, { $limit: limit }
    ]
  ).exec(function (error: Error, data: Array<any>) {
    Usage.aggregate(
      [
        {
          $match: searchObj
        }, {
          $group: {
            _id: "$meter",
          }
        }
      ]
    ).exec(function (error2: Error, data2: Array<any>) {
      res.send({docs:data,total:data2.length});
    });
  });
}