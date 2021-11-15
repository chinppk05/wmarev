const mongoose = require("mongoose");
import express, { Request, Response, NextFunction } from "express";
import Usage from "../src/models/usage";
import Invoice from "../src/models/invoice";
import Payment from "../src/models/payment";
import Receipt from "../src/models/receipt";
import Counter from "../src/models/counter";

mongoose.connect("mongodb://localhost:27017/wma", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

//Usage
export const countUsage = () => {
  console.log("Start Usage")
  Usage.aggregate([
    {
      $project:
      {
        sequence: "$sequence",
        year: {
          $add: [{ $convert: { input: { $substr: ["$sequence", 0, 2] }, to: "int" } }, 2500]
        },
        category: {
          $convert: { input: { $substr: ["$sequence", 2, 1] }, to: "int" }
        },
      }
    },
    {
      $group: {
        _id: {
          year: "$year",
          category: "$category",
        },
        max: {
          $max: "$sequence",
        },
        last: {
          $last: "$sequence",
        },
      },
    },
  ]).exec(function (error: Error, data: Array<any>) {
    // res.send(data);
    console.log(data);
    data.forEach((o) => {
      var options = { upsert: true, new: true, useFindAndModify: false };
      let max = (o.max ?? "") as string;
      let seq = max.substring(3, max.length);
      // let seq = max
      let year = o._id.year
      let category = o._id.category
      // console.log("MAX",max,seq)
      Counter.findOneAndUpdate(
        { name: "Usage", year: year, category: category },
        {
          $set: {
            year: o._id.year,
            category: o._id.category,
            sequence: seq,
          },
        },
        options,
        (err: Error, doc: any) => {
          if (err) console.error(err)
          // console.log(doc)
        });
    });
  });
}; countUsage();

//Invoice
export const countInvoice = () => {
  console.log("Start Invoice")
  Invoice.aggregate([

    {
      $project:
      {
        sequence: "$sequence",
        year: {
          $add: [{ $convert: { input: { $substr: ["$sequence", 0, 2] }, to: "int" } }, 2500]
        },
        category: {
          $convert: { input: { $substr: ["$sequence", 2, 1] }, to: "int" }
        },
      }
    },
    {
      $group: {
        _id: {
          year: "$year",
          category: "$category",
        },
        max: {
          $max: "$sequence",
        },
        last: {
          $last: "$sequence",
        },
      },
    },
  ]).exec(function (error: Error, data: Array<any>) {
    // res.send(data);
    // console.log(data);
    data.forEach((o) => {
      var options = { upsert: true, new: true, useFindAndModify: false };
      let max = (o.max ?? "") as string;
      let seq = max.substring(3, max.length);
      let year = o._id.year
      let category = o._id.category
      Counter.findOneAndUpdate(
        { name: "Invoice", year: year, category: category },
        {
          $set: {
            year: o._id.year,
            category: o._id.category,
            sequence: seq,
          },
        },
        options,
        (err: Error, doc: any) => {
          if (err) console.error(err)
          console.log(doc)
        });
    });
  });
}; countInvoice();

//Payment
// export const countPayment = () => {
//   console.log("Start Payment")
//   Payment.aggregate([

//     {
//       $project:
//       {
//         sequence: "$sequence",
//         year: {
//           $add: [{ $convert: { input: { $substr: ["$sequence", 0, 2] }, to: "int" } }, 2500]
//         },
//         category: {
//           $convert: { input: { $substr: ["$sequence", 2, 1] }, to: "int" }
//         },
//       }
//     },
//     {
//       $group: {
//         _id: {
//           year: "$year",
//           category: "$category",
//         },
//         max: {
//           $max: "$sequence",
//         },
//         last: {
//           $last: "$sequence",
//         },
//       },
//     },
//   ]).exec(function (error: Error, data: Array<any>) {
//     // res.send(data);
//     // console.log(data);
//     data.forEach((o) => {
//       var options = { upsert: true, new: true, useFindAndModify: false };
//       let max = (o.max ?? "") as string;
//       let seq = max.substring(3, max.length);
//       let year = o._id.year
//       let category = o._id.category
//       Counter.findOneAndUpdate(
//         { name: "Payment", year: year, category: category },
//         {
//           $set: {
//             year: o._id.year,
//             category: o._id.category,
//             sequence: seq,
//           },
//         },
//         options,
//         (err: Error, doc: any) => {
//           if (err) console.error(err)
//           console.log(doc)
//         });
//     });
//   });
// }; countPayment();

// Receipt
export const countReceipt = () => {
  console.log("Start Receipt")
  Receipt.aggregate([

    {
      $project:
      {
        sequence: "$sequence",
        year: {
          $add: [{ $convert: { input: { $substr: ["$sequence", 0, 2] }, to: "int" } }, 2500]
        },
        category: {
          $convert: { input: { $substr: ["$sequence", 2, 1] }, to: "int" }
        },
      }
    },
    {
      $group: {
        _id: {
          year: "$year",
          category: "$category",
        },
        max: {
          $max: "$sequence",
        },
        last: {
          $last: "$sequence",
        },
      },
    },
  ]).exec(function (error: Error, data: Array<any>) {
    // res.send(data);
    console.log(data);
    data.forEach((o) => {
      var options = { upsert: true, new: true, useFindAndModify: false };
      let max = (o.max ?? "") as string;
      let seq = max.substring(3, max.length);
      let year = o._id.year
      let category = o._id.category
      Counter.findOneAndUpdate(
        { name: "Receipt", year: year, category: category },
        {
          $set: {
            year: o._id.year,
            category: o._id.category,
            sequence: seq,
          },
        },
        options,
        (err: Error, doc: any) => {
          if (err) console.error(err)
          console.log(doc)
        });
    });
  });
}; countReceipt();

