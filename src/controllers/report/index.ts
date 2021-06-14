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

export const getCollectionStatus = (req: Request, res: Response) => {
  Calculation.find({}).then((calculations: Array<any>) => {
    AreaCollection.find({}).then((collections: Array<any>) => {
      let totalIncome = calculations
        .map((el: any) => el.contributionAmount ?? 0)
        .reduce((a: number, b: number) => a + b, 0);

      let outstandingCollect = collections
        .filter((el) => el.year < new Date().getFullYear() + 543)
        .map((el: any) => el.amount ?? 0)
        .reduce((a: number, b: number) => a + b, 0);
      let totalCollect = collections
        .filter((el) => el.year == new Date().getFullYear() + 543)
        .map((el: any) => el.amount ?? 0)
        .reduce((a: number, b: number) => a + b, 0);
      let income = calculations
        .filter((el) => el.calendarYear == new Date().getFullYear() + 543)
        .map((el: any) => el.contributionAmount ?? 0)
        .reduce((a: number, b: number) => a + b, 0);
      let outstanding = calculations
        .filter((el) => el.calendarYear < new Date().getFullYear() + 543)
        .map((el: any) => el.contributionAmount ?? 0)
        .reduce((a: number, b: number) => a + b, 0);
      res.send({
        outstanding: outstanding - outstandingCollect,
        income: income,
        totalIncome: (totalIncome) + (outstanding - outstandingCollect),
        collected: totalCollect,
      });
    });
  });
};
export const getCollectionStatistic = (req: Request, res: Response) => {
  AreaCollection.aggregate([
    {
      $group: {
        _id: "$year",
        sum: {
          $sum: "$amount",
        },
      },
    },
  ]).exec((error: Error, collections: Array<any>) => {
    res.send(collections);
  });
};

export const getComparePlanResult = (req: Request, res: Response) => {
  Calculation.aggregate([
    {
      $group: {
        _id: {
          year: "$calendarYear",
          quarter: "$quarter",
          month: { $month: "$createdAt" },
        },
        sum: {
          $sum: "$contributionAmount",
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
};

export const getAreaMonthly = (req: Request, res: Response) => {
  let promises: Array<Promise<any>> = [];
  promises.push(Area.find({}).select("name contractNumber").exec())
  promises.push(Calculation.find({}).select("area areaCondition calendarYear quarter contributionAmount").exec())
  promises.push(AreaCollection.find({}).select("area quarter year recordDate amount createdAt").exec())

  Promise.all(promises).then((responses) => {
    let prep = JSON.parse(JSON.stringify(responses[0])) as Array<any>
    let calculations = JSON.parse(JSON.stringify(responses[1])) as Array<any>
    let collections = JSON.parse(JSON.stringify(responses[2])) as Array<any>
    prep = prep.map(el=>{
      return {
        area:el.name,
        contract:el.contractNumber,
        calculations:calculations.filter(calc=>calc.area==el._id),
        collections:collections.filter(colc=>colc.area==el._id),
      }
    })
    res.send(prep)
  })
};

export const getBillingDashboard = (req: Request, res: Response) => {
  let limit = req.body.limit??12
  let skip = req.body.skip??0
  console.log("l,s",limit,skip)
  let promises: Array<Promise<any>> = [];
  promises.push(
    Usage.aggregate([
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
            $sum: 1
          },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );
  promises.push(
    Invoice.aggregate([
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
          "_id.year": -1,
          "_id.month": -1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );
  promises.push(
    Payment.aggregate([
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
          "_id.year": -1,
          "_id.month": -1,
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]).exec()
  );

  Promise.all(promises).then((responses) => {
    res.send({
      usages12mo: responses[0].slice().reverse().map((el: any) => {
        return {
          // name:`${el._id.year}/${el._id.month}`,
          name: DateTime.fromObject({
            year: (el._id.year??2600) - 543,
            month: el._id.month ?? 0,
          })
            .reconfigure({ outputCalendar: "buddhist" })
            .setLocale("th")
            .toFormat("LLLyy"),
          value: parseFloat(el.sum),
        };
      }),
      invoices12mo: responses[1].slice().reverse().map((el: any) => {
        return {
          // name:`${el._id.year}/${el._id.month}`,
          name: DateTime.fromObject({
            year: (el._id.year??2600) - 543,
            month: el._id.month ?? 0,
          })
            .reconfigure({ outputCalendar: "buddhist" })
            .setLocale("th")
            .toFormat("LLLyy"),
          value: parseFloat(el.sum),
        };
      }),
      types12mo: responses[2].slice().reverse().map((el: any) => {
        return {
          name: DateTime.fromObject({
            year: (el._id.year??2600) - 543,
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
      amounts12mo: responses[3].slice().reverse().map((el: any) => {
        return {
          name: DateTime.fromObject({
            year: (el._id.year??2600) - 543,
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
      paid12mo: responses[4].slice().reverse().map((el: any) => {
        return {
          name: DateTime.fromObject({
            year: (el._id.year??2600) - 543,
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
      Invoice.find({ meter: doc.meter, isPaid: false })
        .then((debtArray: any) => {
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
        });
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
