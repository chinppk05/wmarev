// const fs = require("fs")
// const Excel = require("exceljs")
import fs from "fs"
import Excel, { Worksheet } from "exceljs"
import * as _ from "lodash"

const folderInvoice = __dirname + "/excel_original_invoice";
const folderReceipt = __dirname + "/excel_original_receipt";
var uniqueColumns: Array<string> = []

const main = async () => {
  console.log("main started!" + __dirname)
  console.log("main started!" + __filename)
  let folderName = "excel_original_invoice"
  fs.readdir(folderInvoice, async (err, files) => {
    files.forEach(async (file, i) => {
      let isXlsx = file.search(".xlsx") != -1
      let ws
      if (isXlsx) {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(folderInvoice + "/" + file);
        await workbook.eachSheet((worksheet, sheetId) => {
          
          // console.log(worksheet.name)
          let category = "-1"
          switch (worksheet.name) {
            case "type2":
            case "ทะเบียนคุมใบแจ้งหนี้ ประเภท 2":
            case "ทะเบียนคุมใบแจ้งหนี้ประเภท 2":
              category = "2"
              break;
            case "type3":
            case "ทะเบียนคุมใบแจ้งหนี้ ประเภท 3":
            case "ทะเบียนคุมใบแจ้งหนี้ประเภท 3":
              category = "3"
              break;

            default:
              break;
          }
          let mapper: any = {}
          worksheet.getRow(3).eachCell((cell, rowNumber) => {
            switch (cell.text) {
              case "เลขผู้ใช้น้ำ":
              case "เลขที่ผู้ใช้น้ำ(ใหม่)":
              case "เลขที่ผู้ใช้น้ำ":
                mapper.meter = rowNumber
                break;

              default:
                break;
            }
            uniqueColumns.push(cell.text)
            // console.log(cell.text)
          });
          if (i == files.length - 1) complete(worksheet, mapper)
        })

      }
    });
  })
}

const complete = (worksheet:Worksheet, mapper:any) => {
  let unique = _.uniq(uniqueColumns)
  console.log(unique)

  worksheet.eachRow((row, rowNumber) => {
    if(rowNumber>4 && row.getCell("A")!=null){
      console.log(row.getCell(mapper.meter).text)
    }
  })
}

main()