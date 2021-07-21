const fs = require('fs');
const path = require('path');
// const Excel = require('exceljs');
// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database('db');
import axios from "axios"
import { DateTime } from "luxon"
import { parse } from "node:path";
import Excel from "exceljs"


const moveFrom = "./excel";
(async () => {

  let countType1 = 0
  let countType2 = 0
  let countType3 = 0
  let foundStart2 = 0
  let startNumber = 1
  let headerChecker: Array<any> = []
  let filesArray: Array<any> = []
  let prepArray: Array<any> = []
  let mapper: Array<any> = new Array(20).fill(1)
  try {
    const files = await fs.promises.readdir(moveFrom);
    for (const file of files) {
      // Get the full paths
      const fromPath = path.join(moveFrom, file);
      const stat = await fs.promises.stat(fromPath);

      if (stat.isFile()) {
        if (path.extname(fromPath) == ".xlsx") {

          filesArray.push(fromPath)
          console.log("'%s' is a xlsx file.", fromPath);
          const workbook = new Excel.Workbook();
          await workbook.xlsx.readFile(fromPath);
          // console.log(workbook)
          let startRow = 1
          workbook.eachSheet(function (worksheet, sheetId) {
            let okay = false
            let category = "-1"
            let rate = -1

            let sheet = workbook.getWorksheet(sheetId)
            // console.log(sheet.name)
            let column = worksheet.getColumn('C');
            column.eachCell(function (cell, rowNumber) {
              if (cell.value != null) {
                if (((cell ?? {}).text || "sss").search("wma") != -1) {
                  // console.log("found wma")
                  if (cell.text.slice(6, 7) == '3' && !okay) {
                    countType3++
                    category = "3"
                    startRow = rowNumber
                    rate = 4.0
                    okay = true
                  }
                  else if (cell.text.slice(6, 7) == '2' && !okay) {
                    countType2++
                    category = "2"
                    startRow = rowNumber
                    rate = 3.5
                    okay = true
                  }
                }else{
                  // console.log("not found wma",worksheet.name,(cell ?? {}).text)
                }
              }
            });
            // console.log('startRow',startRow, okay)
            if (okay) {
              let headerRow = worksheet.getRow(startRow - 1)
              let tmp: Array<string> = []
              let c6 = headerRow.getCell(6).text
              let c7 = headerRow.getCell(7).text
              let c8 = headerRow.getCell(8).text
              let c9 = headerRow.getCell(9).text
              let c10 = headerRow.getCell(10).text
              let hasQty = false
              let isDebtIncludeVat = false
              if (c8 == "ลบ.ม." || c9 == "ลบ.ม." || c10 == "ลบ.ม.") {
                hasQty = true
              }
              if (c6 == "รวมภาษี 7% แล้ว" || c7 == "รวมภาษี 7% แล้ว") {
                isDebtIncludeVat = true
              }
              headerRow.eachCell(function (cell, colNumber) {
                tmp.push(cell.text)
                if (cell.value != null) {
                  let t = ((cell ?? {}).text || "").trim()
                  if (t === "เลขที่ใบเสร็จ") mapper[0] = colNumber
                  if (t === "เลขที่ผู้ใช้น้ำ") mapper[1] = colNumber
                  if (t === "ชื่อ-นามสกุล") mapper[2] = colNumber
                  if (hasQty) {
                    if (t === "ลบ.ม.") mapper[3] = colNumber
                  }
                  if (t === "ค่าบริการ") mapper[4] = colNumber
                  if (t === "(เดือน)") mapper[5] = colNumber
                  if (t === "รวมภาษี 7% แล้ว" || t === "ยอดเงินที่ค้าง" || t === "ที่ค้าง" || t === "ชำระยอดเงินที่ค้าง") mapper[6] = colNumber
                  if (t === "รับจริง" && colNumber < 19) mapper[7] = colNumber
                  if (t === "วันที่ชำระเงิน") mapper[8] = colNumber
                  if (t === "ตามใบแจ้งหนี้") mapper[9] = colNumber
                  if (t === "รวมเงิน") mapper[9] = colNumber
                  if (t === "ภาษี") mapper[10] = colNumber
                  
                }
              });
              headerChecker.push(tmp)
              // console.log(worksheet.name, "start at ", startRow, mapper)
              worksheet.eachRow(function (row, rowNumber) {
                let prep: any = {}
                if (rowNumber >= startRow) {
                  if (row.getCell(1).value != null) {
                    var myRegexp = /บเสร็จ (.*?)(\d{2}) \(/g ///1-\d{2}(.*?)\d{2}\)/g ///1-(.*?)\)/g;
                    var match = myRegexp.exec(fromPath);
                    // console.log('match',match)
                    prep.id = fromPath
                    prep.rate = rate
                    prep.year = parseInt("25" + match[2])
                    prep.month = getMonth(match[1])
                    prep.sequence = row.getCell(mapper[0]).text
                    prep.meter = row.getCell(mapper[1]).text
                    prep.name = row.getCell(mapper[2]).text
                    prep.debtText = row.getCell(mapper[5]).text
                    prep.paymentDate = getPaymentDate(row.getCell(mapper[8]).text)
                    let tmpDebtAmount = row.getCell(mapper[6]).value
                    prep.debtAmount = tmpDebtAmount == null ? 0 : tmpDebtAmount
                    if (typeof prep.debtAmount != "number") {
                      console.log("prep.debtAmount", prep.debtAmount, "col ", mapper[6], prep.sequence)
                      prep.debtAmount = -1
                    }

                    prep.paymentAmount = 0
                    try {
                      prep.paymentAmount = parseFloat(row.getCell(mapper[7]).text??"0")
                      if (Number.isNaN(parseFloat(row.getCell(mapper[7]).text))) prep.paymentAmount = prep.debtAmount
                    } catch (error) {
                      console.log('paymentAmount error', file)
                    }

                    
                    try {
                      let tmpAmount = row.getCell(mapper[4])
                      if (tmpAmount.result != undefined) prep.totalAmount = tmpAmount.result
                      else prep.totalAmount = tmpAmount.value == null ? 0 : tmpAmount.text
                    } catch (error) {
                      prep.totalAmount = 9
                      console.log(error)
                    }



                    if (hasQty) {
                      prep.qty = row.getCell(mapper[3]).text
                    } else {
                      prep.qty = prep.totalAmount / prep.rate
                    }
                    prep.category = category
                    prep.categoryType = "น้ำเสีย"
                    prep.calculationType = "บาท/ลบ.ม."
                    prep.vatRate = 0.07

                    if ((prep.qty == 0 && prep.totalAmount > 0) || prep.meter == "12170367739") {
                      prep.categoryType = "น้ำทิ้ง"
                      // prep.flatRate = parseFloat(row.getCell(mapper[8]).text) || 0
                      prep.qty = 0
                      prep.flatRate = 125
                      prep.calculationType = "บาท/เดือน"
                    }
                    if (prep.qty == "") {
                      prep.qty = 0
                    }
                    else {
                      prep.qty = parseInt(prep.qty)
                    }
                    if (prep.debtText == "0") prep.debtText = "-"
                    prep.billAmout = prep.rate * prep.qty

                    if(mapper[9]!=undefined){
                      if(row.getCell(mapper[9]).formula != undefined){
                        prep.invoiceAmount = row.getCell(mapper[9]).result
                      }else{
                        prep.invoiceAmount = parseFloat((prep.rate * prep.qty).toFixed(2))
                      }
                    }else{
                      prep.invoiceAmount = parseFloat((prep.rate * prep.qty).toFixed(2))
                    }

                    prep.vat = 0
                    try {
                      prep.vat = parseFloat(row.getCell(mapper[10]).text??"0")
                      if (Number.isNaN(parseFloat(row.getCell(mapper[10]).text))) prep.vat = parseFloat((prep.billAmout * 0.07).toFixed(2))
                    } catch(error){

                    }
                    

                    prepArray.push(prep)
                  }
                }
              })
            }
          });
        }
      }
      else if (stat.isDirectory())
        console.log("'%s' is a directory.", fromPath);
      // console.log("Looped '%s'->'%s'", fromPath, fromPath);
    }
    // console.log({ countType2, countType3, foundStart2 })
    // console.log(prepArray)
    const workbook = new Excel.Workbook();
    const sheet1 = workbook.addWorksheet('Data');
    const sheet2 = workbook.addWorksheet('Table Header Checker');
    sheet1.columns = [
      { header: 'Id', key: 'id', width: 10 },
      { header: 'Sequence', key: 'sequence', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Month', key: 'month', width: 10 },
      { header: 'Meter', key: 'meter', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Address', key: 'address', width: 50 },
      { header: 'Qty', key: 'qty', width: 10 },
      { header: 'Rate', key: 'rate', width: 10 },
      { header: 'FlatRate', key: 'flatRate', width: 10 },
      { header: 'DebtText', key: 'debtText', width: 10 },
      { header: 'DebtAmount', key: 'debtAmount', width: 10 },
      { header: 'VatRate', key: 'vatRate', width: 10 },
      { header: 'TotalAmount', key: 'totalAmount', width: 10 },
      { header: 'PaymentAmount', key: 'paymentAmount', width: 10 },
      { header: 'PaymentDate', key: 'paymentDate', width: 10 },
      { header: 'Category', key: 'category', width: 10 },
      { header: 'CategoryType', key: 'categoryType', width: 10 },
      { header: 'CalculationType', key: 'calculationType', width: 10 },
      { header: 'InvoiceAmount(ตามใบแจ้งหนี้)', key: 'invoiceAmount', width: 10 },
      { header: 'Vat', key: 'vat', width: 10 },
    ];
    sheet1.autoFilter = {
      from: 'A1',
      to: 'U1',
    }
    headerChecker.forEach((element, i) => {
      sheet2.addRow([filesArray[Math.floor(i / 2)], ...element]);
    });


    prepArray.forEach((element, i) => {
      sheet1.addRow(element);
    });
    console.log(countType2, countType3)
    await workbook.xlsx.writeFile("receipt_new.xlsx");
  }
  catch (e) {
    console.error("We've thrown! Whoops!", e);
  }
})()


// db.serialize(function() {
//   // These two queries will run sequentially.
//   db.run("CREATE TABLE foo (num)");
//   db.run("INSERT INTO foo VALUES (?)", 1, function() {
//     // These queries will run in parallel and the second query will probably
//     // fail because the table might not exist yet.
//     db.run("CREATE TABLE bar (num)");
//     db.run("INSERT INTO bar VALUES (?)", 1);
//   });
// });

let getPaymentDate = (str: string) => {
  let input = str.split(" ").join("").split(".").join("")

  var myRegexp = /(\d+)(.+?)(\d+)/g ///1-(.*?)\)/g;
  var match = myRegexp.exec(input);
  if (match != null) {
    let dt = DateTime.fromObject({ year: parseInt(match[3]) + 2500 - 543, month: getMonth(match[2]), day: parseInt(match[1]) ?? 1 })
    return dt.toJSDate()
  }
  else
    return new Date()
}

let getMonth = (str: string) => {
  switch (str) {
    case "มค":
      return 1
      break;
    case "กพ":
      return 2
      break;
    case "มีค":
      return 3
      break;
    case "เมย":
      return 4
      break;
    case "พค":
      return 5
      break;
    case "มิย":
      return 6
      break;
    case "กค":
      return 7
      break;
    case "สค":
      return 8
      break;
    case "กย":
      return 9
      break;
    case "ตค":
      return 10
      break;
    case "พย":
      return 11
      break;
    case "ธค":
      return 12
      break;
    default:
      return 0
      break;
  }
}