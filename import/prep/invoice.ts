const fs = require('fs');
const path = require('path');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db');
import axios from "axios"
import { DateTime } from "luxon"
import Excel from "exceljs"

const moveFrom = "./excel";
(async () => {

  let countType1 = 0
  let countType2 = 0
  let countType3 = 0
  let foundStart2 = 0
  let headerChecker: Array<any> = []
  let filesArray: Array<any> = []
  let prepArray: Array<any> = []
  let mapper: Array<any> = []
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
            if (worksheet.name == "type1") countType1++
            else if (worksheet.name == "type2" || worksheet.name == "ทะเบียนคุมใบแจ้งหนี้ประเภท 2" || worksheet.name == "ทะเบียนคุมใบแจ้งหนี้ ประเภท 2") {
              countType2++
              category = "2"
              okay = true
            }
            else if (worksheet.name == "type3" || worksheet.name == "ทะเบียนคุมใบแจ้งหนี้ประเภท 3" || worksheet.name == "ทะเบียนคุมใบแจ้งหนี้ ประเภท 3") {
              countType3++
              category = "3"
              okay = true
            }
            else {
              // console.log(worksheet.name)
            }

            if (okay) {
              let sheet = workbook.getWorksheet(sheetId)
              let column = worksheet.getColumn('A');
              column.eachCell(function (cell, rowNumber) {
                if (cell.value === 1) {
                  foundStart2++
                  let headerRow = worksheet.getRow(rowNumber - 1)
                  startRow = rowNumber
                  let tmp: Array<string> = []
                  headerRow.eachCell(function (cell, colNumber) {

                    if (cell.value != null) {
                      tmp.push(cell.text)
                      // console.log('Cell ' + colNumber + ' = ' + cell.text);
                      if ((cell.text ?? "").trim() === "เลขที่ใบแจ้งหนี้")
                        mapper[0] = colNumber
                      if ((cell.text ?? "").trim() === "เลขที่ผู้ใช้น้ำ")
                        mapper[1] = colNumber
                      if ((cell.text ?? "").trim() === "ชื่อ - นามสกุล")
                        mapper[2] = colNumber
                      if ((cell.text ?? "").trim() === "ที่อยู่")
                        mapper[3] = colNumber
                      if ((cell.text ?? "").trim() === "(ลบ.ม.)")
                        mapper[4] = colNumber
                      if ((cell.text ?? "").trim() === "ประเภท 2" || (cell.text ?? "").trim() === "ประเภท 3")
                        mapper[5] = colNumber
                      if ((cell.text ?? "").trim() === "(เดือน)")
                        mapper[6] = colNumber
                      if ((cell.text ?? "").trim() === "ยอดค้างชำระ" || (cell.text ?? "").trim() === "เงินคงค้าง" || (cell.text ?? "").trim() === "รวม 7 %")
                        mapper[7] = colNumber
                      if ((cell.text ?? "").trim() === "รวมเงิน")
                        mapper[8] = colNumber
                    }
                  });
                  headerChecker.push(tmp)
                }
              });
              worksheet.eachRow(function (row, rowNumber) {
                let prep: any = {}
                if (rowNumber >= startRow) {
                  if (row.getCell(1).value != null) {
                    let debtText = row.getCell(mapper[6]).value as any
                    if (debtText != null) {
                      if (typeof debtText.getMonth === 'function') {
                        let dt = DateTime.fromJSDate(debtText)
                        let dtOffset = dt.set({ year: dt.year + 600 - 543 }).reconfigure({ outputCalendar: "buddhist" }).setLocale("th")
                        debtText = dtOffset.toFormat("LLLyy").split(".").join("")
                        // console.log(debtText)
                      }
                    }

                    var myRegexp = /1-\d{2}(.*?)\d{2}\)/g ///1-(.*?)\)/g;
                    var match = myRegexp.exec(fromPath);
                    // prep.year = parseInt("25" + (fromPath as string).slice(6, 8))
                    prep.year = parseInt("25" + (fromPath as string).slice(-8, -6))
                    prep.month = getMonth(match[1])
                    prep.sequence = row.getCell(mapper[0]).text
                    prep.meter = row.getCell(mapper[1]).text
                    prep.name = row.getCell(mapper[2]).text
                    prep.address = mapper[3] != undefined ? row.getCell(mapper[3]).text : ""
                    prep.qty = parseInt(row.getCell(mapper[4]).text) || 0
                    prep.rate = parseFloat(row.getCell(mapper[5]).text) || 0
                    prep.debtText = debtText
                    prep.debtAmount = parseFloat(row.getCell(mapper[7]).text) || 0
                    prep.totalAmount = parseFloat(row.getCell(mapper[8]).text) || 0
                    prep.category = category
                    prep.categoryType = "น้ำเสีย"
                    prep.calculationType = "บาท/ลบ.ม."

                    if (prep.qty == 0 && prep.totalAmount > 0) {
                      prep.categoryType = "น้ำทิ้ง"
                      prep.flatRate = parseFloat(row.getCell(mapper[8]).text) || 0
                      prep.calculationType = "บาท/เดือน"
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
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Qty', key: 'qty', width: 10 },
      { header: 'Rate', key: 'rate', width: 10 },
      { header: 'FlatRate', key: 'flatRate', width: 10 },
      { header: 'DebtText', key: 'debtText', width: 10 },
      { header: 'DebtAmount', key: 'debtAmount', width: 10 },
      { header: 'TotalAmount', key: 'totalAmount', width: 10 },
      { header: 'Category', key: 'category', width: 10 },
      { header: 'CategoryType', key: 'categoryType', width: 10 },
      { header: 'CalculationType', key: 'calculationType', width: 10 },
    ];
    sheet1.autoFilter = {
      from: 'A1',
      to: 'P1',
    }
    headerChecker.forEach((element, i) => {
      sheet2.addRow([filesArray[i], ...element]);
    });


    prepArray.forEach((element, i) => {
      sheet1.addRow(element);
    });


    await workbook.xlsx.writeFile("result.xlsx");
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