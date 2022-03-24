import express, { Request, Response, NextFunction } from "express";
import Usage from "../../models/usage/index";
import Invoice from "../../models/invoice/index";
import Receipt from "../../models/receipt/index";
import Payment from "../../models/payment/index";
import History from "../../models/history/index";
import mongoose from "mongoose";
import luxon, { DateTime } from "luxon";
import Calculation from "../../models/calculation";
import AreaCollection from "../../models/areaCollection";
import Area from "../../models/area";
import AreaIncome from "../../models/areaIncome";
import AreaCondition from "../../models/areaCondition";

export const getCollectionStatus = (req: Request, res: Response) => {
  Area.find({ reportIncome: true })
    .select("prefix name contractNumber")
    .then((areas: Array<any>) => {
      let areasId = areas.map((el) => el._id);
      AreaIncome.find({
        area: { $in: areasId },
        isDebt: { $exists: true },
      }).then((incomes: Array<any>) => {
        incomes = JSON.parse(JSON.stringify(incomes)) as Array<any>;
        incomes = incomes.map((o) => {
          let year = o.month >= 10 ? o.year - 1 : o.year;
          let isDebt = o.isDebt; //== undefined ? false : o.isDebt
          return { ...o, year, isDebt, calendarYear: o.year };
        });
        AreaCollection.find({}).then((collections: Array<any>) => {
          let totalIncome = incomes
            .map((el: any) => el.amount ?? 0)
            .reduce((a: number, b: number) => a + b, 0);
          let outstandingCollect = collections
            .filter((el) => el.year < new Date().getFullYear() + 543)
            .map((el: any) => el.amount ?? 0)
            .reduce((a: number, b: number) => a + b, 0);
          let totalCollect = collections
            .filter((el) => el.year == new Date().getFullYear() + 543)
            .map((el: any) => el.amount ?? 0)
            .reduce((a: number, b: number) => a + b, 0);
          let income = incomes
            .filter((el) => el.year == new Date().getFullYear() + 543)
            .map((el: any) => el.amount ?? 0)
            .reduce((a: number, b: number) => a + b, 0);
          let outstanding = incomes
            .filter((el) => el.year < new Date().getFullYear() + 543)
            .map((el: any) => el.amount ?? 0)
            .reduce((a: number, b: number) => a + b, 0);
          res.send({
            outstanding: outstanding - outstandingCollect,
            income: income,
            totalIncome: totalIncome + (outstanding - outstandingCollect),
            collected: totalCollect,
          });
        });
      });
    });
};
export const getCollectionStatistic = (req: Request, res: Response) => {
  let promises: Array<Promise<any>> = [];
  let budgetYear = req.body.budgetYear ?? new Date().getFullYear() + 543;
  let budgetYearAD = budgetYear - 543;
  var start = new Date(budgetYearAD - 1, 10, 1);
  var end = new Date(budgetYearAD, 12, 30);
  Area.find({ reportIncome: true })
    .select("_id prefix name contractNumber")
    .then((areas: Array<any>) => {
      promises.push(
        AreaCollection.find({
          recordDate: { $exists: true },
          month: { $exists: true },
          year: { $exists: true },
        })
          .select("area quarter month year recordDate amount createdAt")
          .exec()
      );
      promises.push(
        AreaIncome.find({ isDebt: { $exists: true } })
          .select("area quarter isDebt month year recordDate amount createdAt")
          .exec()
      );

      Promise.all(promises).then((responses) => {
        let prep = JSON.parse(JSON.stringify(areas)) as Array<any>;
        let collections = JSON.parse(
          JSON.stringify(responses[0])
        ) as Array<any>;
        let incomes = JSON.parse(JSON.stringify(responses[1])) as Array<any>;

        collections = collections.map((c) => {
          let month =
            c.recordDate == undefined
              ? 1
              : DateTime.fromISO(c.recordDate).toObject().month;
          return { ...c, month };
        });
        prep = prep.map((el) => {
          return {
            prefix: el.prefix,
            area: el.name,
            _id: el._id,
            contract: el.contractNumber,
            collections: collections.filter((colc) => colc.area == el._id),
            incomes: incomes.filter((colc) => colc.area == el._id),
          };
        });
        res.send(prep);
      });
    });
};
export const getComparePlanResult = (req: Request, res: Response) => {
  Area.find({ reportIncome: true })
    .select("prefix name contractNumber")
    .then((areas: Array<any>) => {
      let areasId = areas.map((el) => el._id);
      AreaIncome.aggregate([
        {
          $match: {
            area: { $in: areasId },
          },
        },
        {
          $group: {
            _id: {
              year: "$year",
              quarter: "$quarter",
              month: { $month: "$createdAt" },
            },
            sum: {
              $sum: "$amount",
            },
          },
        },
      ]).exec((error: Error, calculations: Array<any>) => {
        AreaCollection.aggregate([
          {
            $group: {
              _id: {
                year: "$year",
                month: { $month: "$recordDate" },
                recordYear: { $add: [{ $year: "$recordDate" }, 543] },
              },
              sum: {
                $sum: "$amount",
              },
            },
          },
        ]).exec((error: Error, collections: Array<any>) => {
          res.send({ calculation: calculations, collection: collections });
        });
      });
      // AreaCollection.aggregate([
      //   {
      //     $group: {
      //       _id: "$year",
      //       sum: {
      //         $sum: "$amount"
      //       }
      //     }
      //   }
      // ]).exec((error: Error, collections: Array<any>) => {
      //   res.send(collections)
      // })
    });
};
export const getAreaMonthly = (req: Request, res: Response) => {
  let promises: Array<Promise<any>> = [];
  // promises.push(Area.find({ reportIncome: true }).select("prefix name contractNumber").exec())

  Area.find({ reportIncome: true })
    .select("_id prefix name contractNumber")
    .then((areas: Array<any>) => {
      console.log(areas);
      promises.push(
        Calculation.find({})
          .select("area areaCondition calendarYear quarter contributionAmount")
          .exec()
      );
      promises.push(
        AreaCollection.find({ year: { $gt: 2500 } })
          .select("area quarter month year recordDate amount createdAt")
          .exec()
      );
      promises.push(
        AreaIncome.find({ year: { $gt: 2500 } })
          .select("area quarter month year recordDate amount createdAt")
          .exec()
      );

      Promise.all(promises).then((responses) => {
        let prep = JSON.parse(JSON.stringify(areas)) as Array<any>;
        let calculations = JSON.parse(
          JSON.stringify(responses[0])
        ) as Array<any>;
        let collections = JSON.parse(
          JSON.stringify(responses[1])
        ) as Array<any>;
        let incomes = JSON.parse(JSON.stringify(responses[2])) as Array<any>;

        // collections = collections.map(c => {
        //   let month = c.recordDate == undefined ? 1 : DateTime.fromISO(c.recordDate).toObject().month
        //   let year = c.recordDate == undefined ? 1 : DateTime.fromISO(c.recordDate).toObject().year + 543
        //   return { ...c, month, year, contractYear:c.year }
        // })

        //ใช้เดือนของ วันที่ชำระเป็นตัวลงช่องเขียวเหลือง
        collections = collections.map((c) => {
          let month =
            c.recordDate == undefined
              ? 1
              : DateTime.fromISO(c.recordDate).toObject().month;
          return { ...c, month };
        });

        incomes = incomes.map((o) => {
          let year = o.month >= 10 ? o.year - 1 : o.year;
          return { ...o, year, calendarYear: o.year };
        });

        prep = prep.map((el) => {
          return {
            prefix: el.prefix,
            area: el.name,
            _id: el._id,
            contract: el.contractNumber,
            calculations: calculations.filter((calc) => calc.area == el._id),
            collections: collections.filter((colc) => colc.area == el._id),
            incomes: incomes.filter((colc) => colc.area == el._id),
          };
        });
        res.send(prep);
      });
    });
};

export const getGreenYellow = (req: Request, res: Response) => {
  let promises: Array<Promise<any>> = [];
  let budgetYear = req.body.budgetYear ?? new Date().getFullYear();
  var start = DateTime.fromObject({ year: budgetYear - 1, month: 10, day: 1 })
    .startOf("day")
    .toJSDate();
  var end = DateTime.fromObject({ year: budgetYear, month: 9, day: 30 })
    .plus({ month: 3 })
    .endOf("day")
    .toJSDate();
  Area.find({ reportIncome: true })
    .select("_id prefix name contractNumber category order")
    .sort('order')
    .then((areas: Array<any>) => {
      promises.push(
        AreaCollection.find({
          recordDate: { $gte: start, $lt: end },
          month: { $exists: true },
          year: { $exists: true },
        })
          .select("area quarter month year recordDate amount createdAt")
          .exec()
      );
      promises.push(
        AreaIncome.find({ isDebt: { $exists: true } })
          .select("area quarter isDebt month year recordDate amount createdAt")
          .exec()
      );

      Promise.all(promises).then((responses) => {
        let prep = JSON.parse(JSON.stringify(areas)) as Array<any>;

        console.log("prep", prep)
        let collections = JSON.parse(
          JSON.stringify(responses[0])
        ) as Array<any>;
        let incomes = JSON.parse(JSON.stringify(responses[1])) as Array<any>;
        //ใช้เดือนของ วันที่ชำระเป็นตัวลงช่องเขียวเหลือง
        collections = collections.map((c) => {
          let month =
            c.recordDate == undefined
              ? 1
              : DateTime.fromISO(c.recordDate).toObject().month;
          let year =
            c.recordDate == undefined
              ? 1
              : DateTime.fromISO(c.recordDate).toObject().year + 543;
          // if(month>=10) year = year - 1
          let bYear = year + (c.month >= 10 ? 1 : 0);
          let isDebt = bYear > c.year;
          return {
            ...c,
            month,
            year,
            remarkMonth: c.month,
            remarkYear: c.year,
            isDebt,
          };
        });
        // อุบล 60640c7ac426854f543f15ba
        // มาบตาพุด 60640cfec426854f543f15bc
        console.log("incomes")
        console.log(incomes.filter(inc => inc.area == '60640cfec426854f543f15bc'))
        console.log("collection")
        console.log(collections.filter(col => col.area == '60640cfec426854f543f15bc'))

        incomes = incomes.map((o) => {
          let year = o.month >= 10 ? o.year - 1 : o.year;
          let isDebt = o.isDebt; //== undefined ? false : o.isDebt
          return { ...o, year, isDebt, calendarYear: o.year };
        });

        prep = prep.map((el) => {
          return {
            prefix: el.prefix,
            area: el.name,
            _id: el._id,
            category: el.category,
            order: el.order,
            contract: el.contractNumber,
            collections: collections.filter((colc) => colc.area == el._id),
            incomes: incomes.filter((colc) => colc.area == el._id),
          };
        });
        res.send(prep);
      });
    });
};

export const getBillingDashboard = (req: Request, res: Response) => {
  let code = req.body.code;
  let year = req.body.year;
  let month = req.body.month;
  let limit = req.body.limit ?? 12;
  let skip = req.body.skip ?? 0;
  console.log("l,s", limit, skip);
  let promises: Array<Promise<any>> = [];
  promises.push(
    Usage.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          sum: {
            $sum: { $divide: ["$qty", 100] },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );
  promises.push(
    Invoice.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          sum: {
            $sum: {
              $multiply: [
                { $divide: ["$qty", 100] },
                { $divide: ["$rate", 100] },
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );
  promises.push(
    Invoice.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          category1: {
            $sum: {
              $cond: [{ $eq: ["$category", "1"] }, 1, 0],
            },
          },
          category2: {
            $sum: {
              $cond: [{ $eq: ["$category", "2"] }, 1, 0],
            },
          },
          category3: {
            $sum: {
              $cond: [{ $eq: ["$category", "3"] }, 1, 0],
            },
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );
  promises.push(
    Invoice.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          category1: {
            $sum: {
              $cond: [
                { $eq: ["$category", "1"] },
                { $multiply: ["$qty", "$rate", 0.01, 0.01] },
                0,
              ],
            },
          },
          category2: {
            $sum: {
              $cond: [
                { $eq: ["$category", "2"] },
                { $multiply: ["$qty", "$rate", 0.01, 0.01] },
                0,
              ],
            },
          },
          category3: {
            $sum: {
              $cond: [
                { $eq: ["$category", "3"] },
                { $multiply: ["$qty", "$rate", 0.01, 0.01] },
                0,
              ],
            },
          },
          total: {
            $sum: { $multiply: ["$qty", "$rate", 0.01, 0.01] },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );
  promises.push(
    Payment.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          category1: {
            $sum: {
              $cond: [
                { $eq: ["$category", "1"] },
                { $multiply: ["$qty", "$rate", 0.01, 0.01] },
                0,
              ],
            },
          },
          category2: {
            $sum: {
              $cond: [
                { $eq: ["$category", "2"] },
                { $multiply: ["$qty", "$rate", 0.01, 0.01] },
                0,
              ],
            },
          },
          category3: {
            $sum: {
              $cond: [
                { $eq: ["$category", "3"] },
                { $multiply: ["$qty", "$rate", 0.01, 0.01] },
                0,
              ],
            },
          },
          total: {
            $sum: { $multiply: ["$qty", "$rate", 0.01, 0.01] },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );

  Promise.all(promises).then((responses) => {
    res.send({
      usages12mo: responses[0]
        .slice()
        .reverse()
        .map((el: any) => {
          return {
            // name:`${el._id.year}/${el._id.month}`,
            name: DateTime.fromObject({
              year: (el._id.year ?? 2600) - 543,
              month: el._id.month ?? 0,
            })
              .reconfigure({ outputCalendar: "buddhist" })
              .setLocale("th")
              .toFormat("LLLyy"),
            value: parseFloat(el.sum),
          };
        }),
      invoices12mo: responses[1]
        .slice()
        .reverse()
        .map((el: any) => {
          return {
            // name:`${el._id.year}/${el._id.month}`,
            name: DateTime.fromObject({
              year: (el._id.year ?? 2600) - 543,
              month: el._id.month ?? 0,
            })
              .reconfigure({ outputCalendar: "buddhist" })
              .setLocale("th")
              .toFormat("LLLyy"),
            value: parseFloat(el.sum),
          };
        }),
      types12mo: responses[2]
        .slice()
        .reverse()
        .map((el: any) => {
          return {
            name: DateTime.fromObject({
              year: (el._id.year ?? 2600) - 543,
              month: el._id.month ?? 0,
            })
              .reconfigure({ outputCalendar: "buddhist" })
              .setLocale("th")
              .toFormat("LLLyy"),
            category1: el.category1,
            category2: el.category2,
            category3: el.category3,
            total: parseFloat(el.total),
          };
        }),
      amounts12mo: responses[3]
        .slice()
        .reverse()
        .map((el: any) => {
          return {
            name: DateTime.fromObject({
              year: (el._id.year ?? 2600) - 543,
              month: el._id.month ?? 0,
            })
              .reconfigure({ outputCalendar: "buddhist" })
              .setLocale("th")
              .toFormat("LLLyy"),
            category1: parseFloat(el.category1),
            category2: parseFloat(el.category2),
            category3: parseFloat(el.category3),
            total: parseFloat(el.total),
          };
        }),
      paid12mo: responses[4]
        .slice()
        .reverse()
        .map((el: any) => {
          return {
            name: DateTime.fromObject({
              year: (el._id.year ?? 2600) - 543,
              month: el._id.month ?? 0,
            })
              .reconfigure({ outputCalendar: "buddhist" })
              .setLocale("th")
              .toFormat("LLLyy"),
            category1: parseFloat(el.category1),
            category2: parseFloat(el.category2),
            category3: parseFloat(el.category3),
            total: parseFloat(el.total),
          };
        }),
      customer12mo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
  });
};

export const getBillingReceiptReport = (req: Request, res: Response) => {
  let code = req.body.code;
  let year = req.body.year;

  let promises: Array<Promise<any>> = [];
  promises.push(
    Invoice.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: "$code",
          totalAmount: { $sum: { $divide: ["$totalAmount", 100] } },
          debtAmount: {
            $sum: {
              $cond: {
                if: {
                  $or: [{ $eq: ["$isPaid", true] }, { $ne: ["$isPaid", null] }],
                },
                then: 0,
                else: { $divide: ["$totalAmount", 100] },
              },
            },
          },
          //   { $divide: ["$debtAmount", 100] }
          // },
          billAmount: { $sum: { $divide: ["$billAmount", 100] } },
        },
      },
    ]).exec()
  );
  promises.push(
    Receipt.aggregate([
      {
        $addFields: {
          ms: {
            $toString: "$month",
          },
          ad: {
            $toString: "$year",
          },
        },
      },
      {
        $addFields: {
          monthyear: {
            $concat: ["$ms", ":", "$ad"],
          },
        },
      },
      {
        $match: {
          monthyear: {
            $in: req.body.monthyear//["11:2559", "12:2559"],
          },
          code: { $in: code },
        },
      },
      {
        $group: {
          _id: "$code",
          paymentAmount: { $sum: { $divide: ["$paymentAmount", 100] } },
        },
      },
    ]).exec()
  );

  Promise.all(promises).then((data) => {
    res.send({
      p1: data[0],
      p2: data[1],
      totalAmount: data[0][0].totalAmount,
      debtAmount: data[0][0].debtAmount,
      billAmount: data[0][0].billAmount,
      paymentAmount: data[1][0].paymentAmount,
    });
  });
  // Receipt.aggregate([{$match: {
  //   code:{ $in:code },
  //   year:{ $in:year }
  // }}, {$group: {
  //   _id: "$code",
  //   invoiceAmount: { $sum: { $divide:["$invoiceAmount",100] } },
  //   debtAmount: { $sum: { $divide:["$debtAmount",100] } },
  //   paymentAmount: { $sum: { $divide:["$paymentAmount",100] } },
  // }}]).exec(function (error: Error, data: Array<any>) {
  //   res.send(data);
  // });
};

export const getCustomerHistory = (req: Request, res: Response) => {
  let meter = req.body.meter;
  Invoice.find({ meter })
    .sort("-year -month")
    .lean()
    .then((invoices: any) => {
      Payment.find({ meter })
        .sort("-year -month")
        .lean()
        .then((payments: any) => {
          Receipt.find({ meter })
            .sort("-year -month")
            .lean()
            .then((receipts: any) => {
              res.send({
                invoices,
                payments,
                receipts,
              });
            });
        });
    });
};

export const getDebtByMeter = (req: Request, res: Response) => {
  let meter = req.body.meter;
  let list = req.body.list;
  Invoice.find({ _id: { $in: list } });
  res.send({});
};

export const getDebtByInvoice = (req: Request, res: Response) => {
  let list = req.body.list;
  let sort = req.body.sort;
  let print = req.body.isPrint != undefined ? req.body.isPrint : null;
  Invoice.find({ _id: { $in: list } })
    .sort(sort)
    .then((originals: any) => {
      let docs = JSON.parse(JSON.stringify(originals));
      Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) } })
        .sort("-year -month")
        .lean()
        .then((founds: any) => {
          docs.forEach((item: any, i: number) => {
            if (print != null) {
              originals[i].isPrint = print;
              originals[i].save();
            }
            let debtArray = founds.filter((el: any) => el.meter == item.meter);
            debtArray = debtArray.map((el: any) => {
              return {
                ...el,
                dt: mo(el.year - 543, el.month),
                year: el.year,
                month: el.month,
              };
            });
            let { debtText, debtAmount } = display1(debtArray);
            if (docs[i].debtAmount == undefined) {
              docs[i].debtText = debtText;
              docs[i].debtAmount = debtAmount;
            }
            docs[i].d0 = display0(debtArray);
            docs[i].debtArray = display2(debtArray);
          });
          res.send(docs);
        });
    });
};

export const getDebtByPayment = (req: Request, res: Response) => {
  let invoice = req.body.invoice;
  let print = req.body.isPrint != undefined ? req.body.isPrint : null;
  Invoice.findOne({ numberInit: invoice }).then((originals: any) => {
    let doc = JSON.parse(JSON.stringify(originals));
    Invoice.find({ meter: doc.meter })
      .sort("-year -month")
      .lean()
      .then((founds: any) => {
        let debtArray = founds.filter((el: any) => el.meter == doc.meter);
        debtArray = debtArray.map((el: any) => {
          return {
            ...el,
            dt: mo(el.year - 543, el.month),
            year: el.year,
            month: el.month,
          };
        });
        let { debtText, debtAmount } = display1(debtArray);
        doc.debtText = debtText;
        doc.d0 = display0(debtArray);
        doc.debtAmount = debtAmount;
        doc.debtArray = display2(debtArray);
        res.send(doc);
      });
  });
};

export const getDebtByPaymentList = (req: Request, res: Response) => {
  let list = req.body.list;
  let print = req.body.isPrint != undefined ? req.body.isPrint : null;
  console.log("getDebtByPaymentList");
  Payment.find({ _id: { $in: list } }).then((originals: any) => {
    let docs = JSON.parse(JSON.stringify(originals));
    Invoice.find({ meter: { $in: docs.map((el: any) => el.meter) } })
      .sort("-year -month")
      .lean()
      .then((founds: any) => {
        docs.forEach((item: any, i: number) => {
          if (print != null) {
            originals[i].isPrint = print;
            originals[i].save();
          }
          let debtArray = founds.filter((el: any) => el.meter == item.meter);
          debtArray = debtArray.map((el: any) => {
            return {
              ...el,
              dt: mo(el.year - 543, el.month),
              year: el.year,
              month: el.month,
            };
          });
          let { debtText, debtAmount } = display1(debtArray);
          docs[i].debtText = debtText;
          docs[i].d0 = display0(debtArray);
          docs[i].debtAmount = debtAmount;
          docs[i].debtArray = display2(debtArray);
        });
        res.send(docs);
      });
  });
};

export const getCustomerLatest = (req: Request, res: Response) => {
  let search = req.body.search;
  let sort = req.body.sort;
  Invoice.findOne(search)
    .sort(sort)
    .then((doc: any) => {
      Invoice.find({ meter: doc.meter, isPaid: false }).then(
        (debtArray: any) => {
          debtArray = debtArray.map((el: any) => {
            return {
              ...el,
              dt: mo(el.year - 543, el.month),
            };
          });
          let { debtText, debtAmount } = display1(debtArray);
          doc.debtText = debtText;
          doc.debtAmount = debtAmount;
          res.send(doc);
        }
      );
    });
};

//JTM อย่าเพิ่งแตะ++
export const getDebtByReceipt = (req: Request, res: Response) => {
  let list = req.body.list;
  let print = req.body.isPrint != undefined ? req.body.isPrint : null;
  Receipt.find({ _id: { $in: list } }).then((originals: any) => {
    let docs = JSON.parse(JSON.stringify(originals));
    Invoice.find({
      meter: { $in: docs.map((el: any) => el.meter) },
      isPaid: false,
      year: { $gt: 0 },
      month: { $gt: 0 },
    })
      .sort("-year -month")
      .lean()
      .then((founds: any) => {
        docs.forEach((item: any, i: number) => {
          if (print != null) {
            originals[i].isPrint = print;
            originals[i].save();
          }
          let debtArray = founds.filter((el: any) => el.meter == item.meter);
          debtArray = debtArray.map((el: any) => {
            return {
              ...el,
              dt: mo(el.year - 543, el.month),
              year: el.year,
              month: el.month,
            };
          });
          let { debtText, debtAmount } = display1(debtArray);
          docs[i].debtText = debtText;
          docs[i].d0 = display0(debtArray);
          docs[i].debtAmount = debtAmount;
          docs[i].debtArray = display2(debtArray);
        });
        res.send(docs);
      });
  });
};

let mo = (year: number, month: number) => {
  return DateTime.fromObject({
    year: year ?? 5555 - 543,
    month: month ?? 1,
  });
};

let display0 = (debt: Array<any>) => {
  let debtText = "";
  var debtAmount = 0;
  var isMiddle = false;
  let arr = debt.slice().reverse() as Array<any>;
  for (let i = 0; i < arr.length; i++) {
    debtText += DateTime.fromISO(arr[i].dt)
      .reconfigure({ outputCalendar: "buddhist" })
      .setLocale("th")
      .toFormat("LLLyy");
    debtText += "/";
    let amt = arr[i].rate * arr[i].qty * 100;
    let res = Math.round(amt + 0.07 * amt);
    debtAmount += res / 100;
  }
  return {
    debtText,
    debtAmount,
  };
};
let display2 = (debt: Array<any>) => {
  let debtArray: Array<any> = [];
  var isMiddle = false;
  let arr = debt.slice().reverse() as Array<any>;
  for (let i = 0; i < arr.length; i++) {
    let amt = arr[i].rate * arr[i].qty * 100;
    let res = Math.round(amt + 0.07 * amt);
    debtArray.push({
      dt: arr[i].dt,
      year: arr[i].year,
      month: arr[i].month,
      text: DateTime.fromISO(arr[i].dt)
        .reconfigure({ outputCalendar: "buddhist" })
        .setLocale("th")
        .toFormat("LLLyy"),
      amount: res / 100,
    });
  }
  return debtArray;
};

let display1 = (debt: Array<any>) => {
  let debtText = "";
  var debtAmount = 0;
  var isMiddle = false;
  let arr = debt.slice().reverse() as Array<any>;
  for (let i = 0; i < arr.length; i++) {
    var diff: number = 1;
    if (i != arr.length - 1) {
      let end = DateTime.fromISO(arr[i + 1].dt);
      let start = DateTime.fromISO(arr[i].dt);
      diff = start.diff(end, "months").toObject().months;
    }

    if (i == 0) {
      debtText += DateTime.fromISO(arr[i].dt)
        .reconfigure({ outputCalendar: "buddhist" })
        .setLocale("th")
        .toFormat("LLLyy");
    }

    if (diff == -1) {
      if (debtText.slice(-1) != "-") debtText += "-";
    } else if (diff < -1) {
      debtText += DateTime.fromISO(arr[i].dt)
        .reconfigure({ outputCalendar: "buddhist" })
        .setLocale("th")
        .toFormat("LLLyy");
      debtText += "/";
      debtText += DateTime.fromISO(arr[i + 1].dt)
        .reconfigure({ outputCalendar: "buddhist" })
        .setLocale("th")
        .toFormat("LLLyy");
    } else {
      debtText += DateTime.fromISO(arr[i].dt)
        .reconfigure({ outputCalendar: "buddhist" })
        .setLocale("th")
        .toFormat("LLLyy");
      if (i != 0 && i != arr.length - 1) debtText += "/";
      isMiddle = false;
    }
    let amt = arr[i].rate * arr[i].qty * 100;
    let res = Math.round(amt + 0.07 * amt);
    debtAmount += res / 100;
    // console.log(arr[i].dt,DateTime.fromISO(arr[i].dt).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy"))
  }
  return {
    debtText,
    debtAmount,
  };
};


export const getIncomeFixedCollection = async (request: Request, response: Response) => {
  let area = await Area.findById(request.params.id).lean();
  let areaCondition = await AreaCondition.findOne({ area: mongoose.Types.ObjectId(request.params.id) }).lean();
  let result:Array<any> = []
  let conditions:Array<any> = areaCondition.conditions;
  let contractStart = DateTime.fromJSDate(area.contractStart).reconfigure({ outputCalendar: "buddhist" })
  let operationStart = DateTime.fromJSDate(areaCondition.operationDate).reconfigure({ outputCalendar: "buddhist" })
  let budgetYearStart = 0
  let budgetMonthStart = DateTime.fromJSDate(area.contractStart).reconfigure({ outputCalendar: "buddhist" }).month
  try {
    budgetYearStart = parseInt(contractStart.toFormat("yyyy"))
    if(budgetMonthStart<=10) budgetYearStart += 1
  } catch (error) {
    
  }
  let contractEnd = contractStart
  contractEnd = contractEnd.plus({ years: conditions.length + 1 })
  
  let compare1 = operationStart
  let compare2 = DateTime.fromJSDate(area.contractEnd)

  if(compare1.plus({years:15})<compare2) conditions.push({...conditions[conditions.length-1],isLast:true})
  conditions.forEach((con,i) => {
    let detail1 = ""
    let detail2 = ""
    let detail3 = ""
    let quarter:Array<any> = []
    let newContractStart = contractStart
    newContractStart.plus({year:i})
    let newOperationStart = operationStart
    newOperationStart = newOperationStart.plus({year:i - 1})
    let quarterDay = 0
    let annualSum = con.contributionLimit??0
    for (let j = 1; j <= 4; j++) {

      let quarterStart:DateTime
      let quarterSum = annualSum/4
      let lastQuarterSum = 0
      try {
        lastQuarterSum = (conditions[i-1].contributionLimit??0)/4
      } catch (error) {
        
      }
      if(j==1) quarterStart = newOperationStart.set({month:10}).minus({year:1}).startOf("month").plus({days:1})
      else if(j==2) quarterStart = newOperationStart.set({month:1}).startOf("month").plus({days:1})
      else if(j==3) quarterStart = newOperationStart.set({month:4}).startOf("month").plus({days:1})
      else if(j==4) quarterStart = newOperationStart.set({month:7}).startOf("month").plus({days:1})
      let quarterEnd = quarterStart.plus({month:3})
      quarterDay = Math.round(quarterEnd.diff(quarterStart,'days').days)
      let dat1 = quarterEnd>newOperationStart
      let dat2 = quarterStart<=newOperationStart
      let change = quarterEnd>newOperationStart && quarterStart<=newOperationStart
      let split = [0,quarterDay]
      let calculation = [0,0]
      let rate = [0,0]
      if(change) {
        rate = [lastQuarterSum, quarterSum]
        split = [Math.round(newOperationStart.diff(quarterStart,'days').days)+1,Math.round(quarterEnd.diff(newOperationStart,'days').days)-1]
        // calculation[0] = lastQuarterSum/quarterDay * split[0]
      } else { 
        if(newOperationStart>quarterEnd) rate = [lastQuarterSum, lastQuarterSum]
        else rate = [quarterSum, quarterSum]
        // calculation[0] = quarterSum/quarterDay * split[0]
      }
      calculation[0] = rate[0]/quarterDay * split[0]
      calculation[1] = rate[1]/quarterDay * split[1]
      if(operationStart>quarterStart){ calculation[0] = 0 }
      if(operationStart>quarterEnd){ calculation = [0,0] }
      if(con.isLast) {
        if(dat1 && dat2){
          split = [Math.round(contractEnd.diff(quarterStart,'days').days)+1,Math.round(quarterEnd.diff(contractEnd,'days').days)-1]
          // calculation[0] = rate[0]/quarterDay * split[0]
          calculation[1] = 0
        }
        else if(!dat2){
          calculation[1] = 0
        }
      }
      if(change) {
        detail1 = `(1) ตั้งแต่วันที่ ${quarterStart.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จนถึงวันที่ ${newOperationStart.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จำนวน ${split[0]} วัน <br/>คำนวณ ${rate[0].formatFull()} / ${quarterDay} x ${split[0]} = ${calculation[0].formatFull()}`
        detail2 = `(2) ตั้งแต่วันที่ ${quarterStart.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จนถึงวันที่ ${newOperationStart.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จำนวน ${split[1]} วัน <br/>คำนวณ ${rate[1].formatFull()} / ${quarterDay} x ${split[1]} = ${calculation[1].formatFull()}`
        detail3 = `(3) ${calculation[0].formatFull()} + ${calculation[1].formatFull()} = ${quarterSum.formatFull()}`
      }
      if(con.isLast) {
        if(dat1 && dat2){
          detail1 = `(1) ตั้งแต่วันที่ ${quarterStart.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จนถึงวันที่ ${contractEnd.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จำนวน ${split[0]} วัน <br/>คำนวณ ${rate[0].formatFull()} / ${quarterDay} x ${split[0]} = ${calculation[0].formatFull()}`
          detail2 = `(2) ตั้งแต่วันที่ ${quarterStart.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จนถึงวันที่ ${contractEnd.reconfigure({ outputCalendar: "buddhist" }).toFormat("d/M/yyyy")} จำนวน ${split[1]} วัน <br/>คำนวณ ${rate[1].formatFull()} / ${quarterDay} x ${split[1]} = ${calculation[1].formatFull()}`
          detail3 = `(3) ${calculation[0].formatFull()} + ${calculation[1].formatFull()} = ${quarterSum.formatFull()}`
        }
      }
      // let sumI_0 = 0
      // let sumI_1 = 0
      // let sumQuarter = 0
      // try { sumI_1 += (conditions[i-1].contributionLimit??0) / 4 } catch(error) { }
      // try { sumI_0 += (conditions[i].contributionLimit??0) / 4 } catch(error) { }
      // try { sumQuarter += sumI_0/quarterDay*sumI_0 } catch(error) { }
      // try { sumQuarter += sumI_1/quarterDay*sumI_1 } catch(error) { }
      quarter.push({
        dat1,
        dat2,
        quarterStart: quarterStart.toJSDate(),
        quarterEnd: quarterEnd.toJSDate(),
        operationStart,
        change,
        newOperationStart,
        split,
        rate,
        calculation,
        sum:calculation.reduce((a,b)=>a+b,0),
        quarterDay,
        number:j,
        // sumQuarter,
        // sumI_0,
        // sumI_1
      })
    }
    result.push({
      year: i+1,
      annualSum,
      annualCalc:quarter.map(el=>el.sum).reduce((a,b)=>a+b,0),
      calendarYear: budgetYearStart + i,
      startCount: newContractStart.diff(operationStart,'days').days,
      quarter,
      detail1,
      detail2,
      detail3
    })
  });
  response.send({
    name: `${area.prefix}${area.name}`,
    information: {
      contractStart,
      operationStart,
      contractEnd
    },
    result,
    sum:[
      result.map(el=>el.annualCalc??0).reduce((a,b)=>a+b,0),
      result.map(el=>el.quarter[0].sum??0).reduce((a,b)=>a+b,0),
      result.map(el=>el.quarter[1].sum??0).reduce((a,b)=>a+b,0),
      result.map(el=>el.quarter[2].sum??0).reduce((a,b)=>a+b,0),
      result.map(el=>el.quarter[3].sum??0).reduce((a,b)=>a+b,0),
    ],
    area,
    conditions,
    areaCondition
  })
}
// export {};

declare global {
  interface String {
    capitalize(): String;
    formatComma(): String;
    formatCizitenId(): String;
    formatThai():String;
  }
  interface Number {
    formatDash(): string;
    formatComma(): string;
    formatFull(): string;
    formatMB(): string;
  }
}

String.prototype.formatThai = function(){
  var array = { "1": "๑", "2": "๒", "3": "๓", "4": "๔", "5": "๕", "6": "๖", "7": "๗", "8": "๘", "9": "๙", "0": "๐" };
  var str = this
  for (var val in array) {
    //@ts-ignore
    str = str.split(val).join(array[val]);
  }
  return str;
}
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
String.prototype.formatComma = function() {
  return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
String.prototype.formatCizitenId = function() {
  try {
    return this.replace(
      /(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/g,
      "$1-$2-$3-$4-$5"
    );
  } catch (err) {
    return "";
  }
};

Number.prototype.formatComma = function() {
  return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
Number.prototype.formatDash = function() {
  // if(this == -1) return "-"
  return this.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
Number.prototype.formatFull = function() {
  return this.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
Number.prototype.formatMB = function() {
  let num = this as number
  return (num/1000000).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
