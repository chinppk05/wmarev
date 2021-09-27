import fs from "fs"
import path from "path"
import { DateTime } from "luxon"
import Excel from "exceljs"
import * as _ from "lodash"
import { v4 as uuidv4 } from 'uuid';
import { isNumber } from "lodash"
import * as helper from "./helpers"


const folderInvoice = __dirname + "/excel_original_invoice";
const folderReceipt = __dirname + "/excel_original_receipt";
const finalFileCombined = __dirname + "/excel_processed/combined_R01.xlsx";
let summary = {
  invoice: {
    category1: 0,
    category2: 0,
    category3: 0,
    undefined: 0,
  },
  receipt: {
    category1: 0,
    category2: 0,
    category3: 0,
    undefined: 0,
  },
  columnFound: 0
}
let invoiceColumns: Array<string> = []
let receiptColumns: Array<string> = []
let prepInvoice: Array<any> = []
let prepReceipt: Array<any> = []
let addressMap: Array<any> = []
let addressOneToManyMeter: Array<any> = []
let uniqueInvoiceColumn: Array<any> = []
let uniqueReceiptColumn: Array<any> = []
const newWorkbook = new Excel.Workbook();

let invoice = async () => {
  const files = await fs.promises.readdir(folderInvoice);
  for (const file of files) {
    const filePath = path.join(folderInvoice, file);
    const stat = await fs.promises.stat(filePath);
    if (stat.isFile() && path.extname(filePath) == ".xlsx") {
      console.log("'%s' is a xlsx file.", filePath);
      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(filePath);
      workbook.eachSheet((worksheet, sheetId) => {
        switch (worksheet.name) {
          case 'type2':
          case 'ทะเบียนคุมใบแจ้งหนี้ประเภท 2':
          case 'ทะเบียนคุมใบแจ้งหนี้ ประเภท 2':
            summary.invoice.category2++
            getInvoiceFromSheet(file, worksheet, '2')
            break;
          case 'type3':
          case 'ทะเบียนคุมใบแจ้งหนี้ประเภท 3':
          case 'ทะเบียนคุมใบแจ้งหนี้ ประเภท 3':
            summary.invoice.category3++
            getInvoiceFromSheet(file, worksheet, '3')
            break;

          default:
            summary.invoice.undefined++
            break;
        }
        addInvoiceColumn(worksheet)
      })
    }
  }
  //Fixing Address
  prepInvoice = prepInvoice.map((o: any) => {
    return {
      ...o,
      address: fixAddress(o.meter, o.address)
    }
  })

  addressOneToManyMeter = cleanInvoiceMeter() // First Clean for Meter
  //Fixing Meter
  prepInvoice = prepInvoice.map((o: any) => {
    return {
      ...o,
      meter: fixMeter(o.name, o.address, o.meter)
    }
  })
  addressOneToManyMeter = cleanInvoiceMeter() // Seconad Clean for Meter to get remaining
}

let receipt = async () => {

  const files = await fs.promises.readdir(folderReceipt);
  for (const file of files) {
    const filePath = path.join(folderReceipt, file);
    const stat = await fs.promises.stat(filePath);
    if (stat.isFile() && path.extname(filePath) == ".xlsx") {
      console.log("'%s' is a xlsx file.", filePath);
      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(filePath);
      workbook.eachSheet((worksheet, sheetId) => {
        switch (worksheet.name) {
          case 'ทะเบียนคุมใบเสร็จ ประเภท 2':
          case 'ทะเบียนคุมใบเสร็จประเภท 2':
          case 'ทะเบียนคุมใบเสร็จ2':
            summary.receipt.category2++
            getReceiptFromSheet(file, worksheet, '2')
            break;
          case 'ทะเบียนคุมใบเสร็จ ประเภท 3':
          case 'ทะเบียนคุมใบเสร็จประเภท 3':
          case 'ทะเบียนคุมใบเสร็จ3':
            summary.receipt.category3++
            getReceiptFromSheet(file, worksheet, '3')
            break;

          default:
            summary.receipt.undefined++
            break;
        }
        addReceiptColumn(worksheet)
      })
    }
  }
  uniqueInvoiceColumn = _.uniq(invoiceColumns)
  uniqueReceiptColumn = _.uniq(receiptColumns)
  createInvoice(prepInvoice)
  createReceipt(prepReceipt)
}

let getInvoiceFromSheet = (filename: string, worksheet: Excel.Worksheet, category: string) => {
  let mapper: any = {
    debtIsVatIncluded: false
  }
  worksheet.eachRow((row, rowNumber) => {
    let noCell = row.getCell(1)
    worksheet.getRow(4).eachCell((cell, colNumber) => {
      try {
        if (cell.text == "รวม 7 %") mapper.debtIsVatIncluded = true
      } catch (error) {
        // console.log(error)
      }
    });
    worksheet.getRow(3).eachCell((cell, colNumber) => {
      switch (cell.text) {
        case 'เลขที่ใบแจ้งหนี้ ':
          mapper.sequence = colNumber
          break;
        case 'เลขที่ผู้ใช้น้ำ':
        case 'เลขที่ผู้ใช้น้ำ(ใหม่)':
        case 'เลขผู้ใช้น้ำ':
          mapper.meter = colNumber
          break;
        case 'ที่อยู่':
          mapper.address = colNumber
          break;
        case 'ชื่อ':
        case 'ชื่อ - นามสกุล':
          mapper.name = colNumber
          break;
        case 'ปริมาณการใช้น้ำ':
          mapper.qty = colNumber
          break;
        case 'ค่าบำบัดน้ำเสีย':
          mapper.rate = colNumber
          break;
        case 'เดือนที่ค้างชำระ':
          mapper.debtText = colNumber
          break;
        case 'ยอดค้างชำระ':
        case 'ยอดค้างชำระ ':
          mapper.debtAmount = colNumber
          break;
        case 'เงินคงค้าง':
          mapper.debtIsVatIncluded = true
          mapper.debtAmount = colNumber
          break;
        case 'รวมเงิน':
        case 'ค่าบริการบำบัดน้ำเสีย':
          mapper.billAmount = colNumber
          break;
        case 'รวมเงินชำระทั้งสิ้น':
          mapper.totalAmount = colNumber
          break;
        case 'ภาษี':
          mapper.vat = colNumber
          break;
        default:
          // console.log()
          break;
      }
    });
    if (rowNumber > 4 && isNumber(noCell.value)) {
      var myRegexp = /แจ้งหนี้ (.*?)(\d{2}) \(/g ///1-\d{2}(.*?)\d{2}\)/g ///1-(.*?)\)/g;
      var match = myRegexp.exec(filename);
      var debtAmount = helper.resolveAmount(row.getCell(mapper.debtAmount))
      let billAmount = helper.resolveAmount(row.getCell(mapper.billAmount))
      let totalAmount = helper.resolveAmount(row.getCell(mapper.totalAmount))
      let vat = helper.resolveAmount(row.getCell(mapper.vat))
      let obj: any = {
        ref: `${filename} ${worksheet.name} row: ${rowNumber}`,
        id: uuidv4(),
        no: parseInt(noCell.text),
        sequence: row.getCell(mapper.sequence).text,
        meter: row.getCell(mapper.meter).text,
        oldMeter: row.getCell(mapper.meter).text.length == 7 ? row.getCell(mapper.meter).text : "-",
        name: helper.resolveName(row.getCell(mapper.name).text, row.getCell(mapper.meter).text),
        address: helper.resolveAddress(mapper.address, row),
        qty: parseFloat(row.getCell(mapper.qty).text.replace(",", "")),
        rate: parseFloat(row.getCell(mapper.rate).text.replace(",", "")),
        vat,
        debtText: helper.resolveDebtText(row.getCell(mapper.debtText)),
        debtAmount,
        billAmount,
        totalAmount,

        year: parseInt("25" + match[2]),
        month: helper.getMonth(match[1]),
        monthReverse: helper.reverseMonth(helper.getMonth(match[1])),
        vatRate: 0.07,
        category,
      }
      if (obj.qty == 0 && obj.billAmount != 0) {
        obj.categoryType = "น้ำทิ้ง"
        obj.calculationType = "บาท/เดือน"
        obj.flatRate = 125
      }
      else {
        obj.categoryType = "น้ำเสีย"
        obj.calculationType = "บาท/ลบ.ม."
        obj.flatRate = 0
      }
      prepInvoice.push(obj)
    }
  })
}

let getReceiptFromSheet = (filename: string, worksheet: Excel.Worksheet, category: string) => {
  let mapper: any = {
  }
  worksheet.eachRow((row, rowNumber) => {
    let noCell = row.getCell(1)
    worksheet.getRow(3).eachCell((cell, colNumber) => {
      if (cell.value == null) return
      switch (cell.text) {
        case 'ลำดับ':
        case 'ลำดับ ':
          mapper.no = colNumber
          break;
        case 'เลขที่ผู้ใช้น้ำ':
        case 'เลขที่ผู้ใช้น้ำ(ใหม่)':
        case 'เลขผู้ใช้น้ำ':
          mapper.meter = colNumber
          break;
        case 'ที่อยู่':
          mapper.address = colNumber
          break;
        case 'ชื่อ':
        case 'ชื่อ - นามสกุล':
        case 'ชื่อ-นามสกุล':
          mapper.name = colNumber
          break;
        case 'รับจริง':
          if (worksheet.getRow(3).getCell(colNumber + 1).text == "หมายเหตุ")
            mapper.paymentAmount = colNumber
          break;
        case 'วันที่ชำระเงิน':
        case 'วันที่ชำระเงิน':
        case 'วันที่ชำระเงิน':
          mapper.paymentDate = colNumber
          break;
        case 'เลขที่ใบเสร็จ':
          mapper.sequence = colNumber
          break;
        case 'เดือนที่ค้าง':
        case 'จำนวนเดือนที่ค้าง ':
        case 'เดือนที่ค้างชำระ':
        case 'เดือนที่ค้าง ':
        case 'เดือนที่ชำระ':
          mapper.receiptDebtText = colNumber
          break;
        case 'ยอดเงินที่ค้าง ':
        case 'ชำระยอดเงินที่ค้าง ':
        case 'ยอดค้างชำระ ':
        case 'ชำระยอดเงิน':
          mapper.receiptDebtAmount = colNumber
          break;

        case 'ภาษียอดค้าง':
          mapper.debtVat = colNumber
          break;
        case 'ลบ.ม.':
          mapper.qty = colNumber
          break;
        case 'ค่าบริการ':
          mapper.billAmount = colNumber
          break;
        case 'ภาษี':
          mapper.vat = colNumber
          break;
        case 'K+L':
          mapper.totalAmount = colNumber
          break;
        case 'รวมภาษีขาย':
          mapper.totalVatAmount = colNumber
          break;
        case 'รวมเงิน':
          if (worksheet.getRow(4).getCell(colNumber).text == "ตามใบแจ้งหนี้")
            mapper.grandTotal = colNumber
          break;


        case 'หมายเหตุ':
          mapper.remark = colNumber
          break;
        default:
          // console.log()
          break;
      }
    });
    if (rowNumber > 4 && isNumber(noCell.value)) {
      var myRegexp = /ใบเสร็จ (.*?)(\d{2}) \(/g ///1-\d{2}(.*?)\d{2}\)/g ///1-(.*?)\)/g;
      var match = myRegexp.exec(filename);
      let paymentAmount = helper.resolveAmount(row.getCell(mapper.paymentAmount))
      let paidFor = DateTime.fromObject({
        year: parseInt("25" + match[2]) - 543,
        month: helper.getMonth(match[1]),
        day: 15
      }).reconfigure({ outputCalendar: "buddhist" })

      let paidAt = DateTime.fromObject({
        year: parseInt("25" + match[2]) - 543,
        month: helper.getMonth(match[1]),
        day: 15
      }).reconfigure({ outputCalendar: "buddhist" })
      paidAt = paidAt.plus({ month: 2 })
      /*
      เดือนที่ค้าง 	ชำระยอดเงินที่ค้าง 	 ภาษียอดค้าง 	 ลบ.ม. 	 ค่าบริการ 	 ภาษี 	 K+L 	 รวมภาษีขาย 	 รวมเงิน 
      (เดือน)								 ตามใบแจ้งหนี้ 
      */
      let obj: any = {
        ref: `${filename} ${worksheet.name} row: ${rowNumber}`,
        id: uuidv4(),
        no: parseInt(row.getCell(mapper.no).text),
        sequence: row.getCell(mapper.sequence).text.replace("wma-", ""),
        meter: row.getCell(mapper.meter).text,
        oldMeter: row.getCell(mapper.meter).text.length == 7 ? row.getCell(mapper.meter).text : "-",
        name: helper.resolveName(row.getCell(mapper.name).text, row.getCell(mapper.meter).text),
        address: helper.resolveAddress(mapper.address, row),
        paymentAmount,
        paymentDate: helper.resolveDateThai(row.getCell(mapper.paymentDate)),
        receiptDebtText: row.getCell(mapper.receiptDebtText).text,
        receiptDebtAmount: helper.resolveAmount(row.getCell(mapper.receiptDebtAmount)),

        debtVat: mapper.debtVat == undefined ? 0 : helper.resolveAmount(row.getCell(mapper.debtVat)),
        qty: helper.resolveAmount(row.getCell(mapper.qty)),
        billAmount: helper.resolveAmount(row.getCell(mapper.billAmount)),
        vat: helper.resolveAmount(row.getCell(mapper.vat)),
        totalAmount: mapper.debtVat == undefined ? helper.resolveAmount(row.getCell(mapper.grandTotal)) : helper.resolveAmount(row.getCell(mapper.totalAmount)),
        totalVatAmount: mapper.debtVat == undefined ? helper.resolveAmount(row.getCell(mapper.vat)) : helper.resolveAmount(row.getCell(mapper.totalVatAmount)),
        grandTotal: helper.resolveAmount2(row, row.getCell(mapper.grandTotal), mapper.grandTotal),

        remark: mapper.remark != undefined ? row.getCell(mapper.remark).text : "-",

        year: paidAt.year + 543,
        month: paidAt.month,
        monthReverse: helper.reverseMonth(paidAt.month),
        vatRate: 0.07,
        prefix: "wma-",
        category,
      }
      let invoiceIndex = prepInvoice.findIndex(o =>
        (o.year == paidFor.year + 543 && o.month == paidFor.month && o.meter == obj.meter) ||
        (o.year == paidFor.year + 543 && o.month == paidFor.month && o.oldMeter == obj.meter && "-" != o.oldMeter)
      )
      if (prepInvoice[invoiceIndex] != undefined) {
        obj.meter = prepInvoice[invoiceIndex].meter
        obj.address = prepInvoice[invoiceIndex].address
        obj.invoiceNumber = prepInvoice[invoiceIndex].sequence
        obj.debtText = prepInvoice[invoiceIndex].debtText
        obj.debtAmount = prepInvoice[invoiceIndex].debtAmount
        obj.invoiceBillAmount = prepInvoice[invoiceIndex].invoiceBillAmount

        prepInvoice[invoiceIndex].isPaid = true
        prepInvoice[invoiceIndex].paidReceipt = obj.sequence
      }
      if (obj.qty == 0 && obj.billAmount != 0){
        obj.categoryType = "น้ำทิ้ง"
        obj.calculationType = "บาท/เดือน"
        obj.flatRate = 125
      } else {
        obj.categoryType = "น้ำเสีย"
        obj.calculationType = "บาท/ลบ.ม."
        obj.flatRate = 0
      }
      if(obj.month==1&&obj.year==2561){
        // console.log(mapper.receiptDebtAmount)
      }
      prepReceipt.push(obj)
    }
  })
}

let cleanInvoiceMeter = (): Array<any> => {
  let filtered = prepInvoice.filter(o => (o.meter.length == 7 || true)).map(o => {
    return {
      ...o,
      nameAddress: `${o.name}-${o.address}`
    }
  })
  let uniqueAddress = _.groupBy(filtered, 'nameAddress')
  addressMap = _.map(uniqueAddress, (o: any) => {
    return {
      name: o[0].name,
      address: o[0].address,
      nameAddress: o[0].name + "-" + o[0].address,
      children: o,
      uniqueMeter: _.uniqBy(o, 'meter').length,
      unique: _.chain(o).uniqBy('meter').map().value().map(o => o.meter)
    }
  })
  return addressMap.filter(o => o.uniqueMeter > 1)
}

let fixAddress = (meter: string, address: string): string => {
  if (address == '-') {
    if (meter.length == 7) {
      let found = prepInvoice.find(o => (o.meter == meter && o.address != "-"))
      if (found != undefined) return found.address
      return "*"
    } else {
      return address
    }
  }
  return address
}
let fixMeter = (name: string, address: string, meter: string): string => {
  let fixer: Array<any> = [
    //บจก.ดุสิตเบฟเวอเรจ
    {
      from: "0219170",
      to: "12170304974"
    }, {
      from: "1159642",
      to: "12170373352"
    },
    //โรงเรียนอำมาตย์พานิชนุกูล (เลขที่ผู้เสียภาษีอากร 0994000570821)
    {
      from: "0271138",
      to: "12170308693"
    }, {
      from: "1129814",
      to: "12170370889"
    },
    //ศาลากลางจังหวัดกระบี่
    {
      from: "1505492",
      to: "12170491671"
    }, {
      from: "0272616",
      to: "12170308817"
    },
    //สำนักงานที่ดินจังหวัดกระบี่
    {
      from: "1480209",
      to: "12170468899"
    }, {
      from: "273644",
      to: "12170308862"
    },
    //บริษัท ห้างทองสามารถ จำกัด ( สำนักงานใหญ่ ) เลขที่ผู้เสียภาษีอากร 0815560000364
    {
      from: "0931236",
      to: "12170468899"
    }, {
      from: "0958246",
      to: "12170355536"
    },
    //บมจ. ซีพี ออลล์ จำกัด (สำนักงานใหญ่) เลขที่ผู้เสียภาษีอากร 0107542000011
    {
      from: "0910204",
      to: "12170353796"
    }, {
      from: "1471104",
      to: "12170460732"
    }, {
      from: "1410831",
      to: "12170417787"
    }, {
      from: "1382554",
      to: "12170396995"
    }
  ]
  let found = fixer.find(o => o.from == meter)
  if (meter.length == 7) {
    if (found != undefined) return found.to
    else {
      let found2 = addressOneToManyMeter.find(o => o.nameAddress == `${name}-${address}`)
      if (found2 != undefined) {
        return found2.unique.find((el: any) => el.length == 11) ?? meter
      } else {
        return meter
      }
    }
  }
  return meter
}

let addInvoiceColumn = (worksheet: Excel.Worksheet) => {
  summary.columnFound++
  worksheet.getRow(3).eachCell((cell, rowNumber) => {
    invoiceColumns.push(cell.text)
  });
}
let addReceiptColumn = (worksheet: Excel.Worksheet) => {
  summary.columnFound++
  worksheet.getRow(3).eachCell((cell, rowNumber) => {
    receiptColumns.push(cell.text)
  });
}

let createInvoice = async (prepInvoice: Array<any>) => {
  const sheet1 = newWorkbook.addWorksheet('ใบแจ้งหนี้', {
    views: [
      { state: 'frozen', ySplit: 1 }
    ]
  });
  sheet1.columns = [
    { header: 'ลำดับในไฟล์ต้นฉบับ', key: 'no', width: 15 },
    { header: 'เลขที่ใบแจ้งหนี้', key: 'sequence', width: 15 },
    { header: 'ปี', key: 'year', width: 10 },
    { header: 'เดือน', key: 'month', width: 10 },
    { header: 'เดือน', key: 'monthReverse', width: 10 },
    { header: 'เลขที่ผู้ใช้น้ำ (ใหม่)', key: 'meter', width: 10 },
    { header: 'เลขที่ผู้ใช้น้ำ (เก่า)', key: 'oldMeter', width: 10 },
    { header: 'ชื่อ', key: 'name', width: 60 },
    { header: 'ที่อยู่', key: 'address', width: 50 },
    { header: 'ปริมาณการใช้น้ำ', key: 'qty', width: 10, style: { numFmt: '0.0' } },
    { header: 'อัตราค่าบำบัดน้ำเสีย', key: 'rate', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'อัตราภาษี', key: 'vatRate', width: 10, style: { numFmt: '0%' } },
    { header: 'มูลค่าภาษี', key: 'vat', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'เหมาจ่าย', key: 'flatRate', width: 10 },
    { header: 'เดือนที่ค้างชำระ', key: 'debtText', width: 10 },
    { header: 'เงินคงค้าง', key: 'debtAmount', width: 10 },
    { header: 'รวมเงิน', key: 'billAmount', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'รวมเงินชำระทั้งสิ้น', key: 'totalAmount', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'ประเภท', key: 'category', width: 10 },
    { header: 'แบบ', key: 'categoryType', width: 10 },
    { header: 'วิธีการคำนวณ', key: 'calculationType', width: 10 },
    { header: 'ชำระเงินแล้ว', key: 'isPaid', width: 10 },
    { header: 'หมายเลขใบเสร็จที่ชำระ', key: 'paidReceipt', width: 10 },
    { header: 'Reference', key: 'ref', width: 80 },
    { header: 'Id', key: 'id', width: 40 },
  ];
  sheet1.autoFilter = {
    from: 'A1',
    to: 'W1',
  }
  prepInvoice.forEach((element, i) => {
    sheet1.addRow(element);
  });
}
let createReceipt = async (prepInvoice: Array<any>) => {
  const sheet1 = newWorkbook.addWorksheet('ใบเสร็จรับเงิน', {
    views: [
      { state: 'frozen', ySplit: 1 }
    ]
  });
  sheet1.columns = [
    { header: 'ลำดับในไฟล์ต้นฉบับ', key: 'no', width: 15 },
    { header: 'Prefix', key: 'prefix', width: 5 },
    { header: 'เลขที่ใบเสร็จรับเงิน', key: 'sequence', width: 15 },
    { header: 'ปี', key: 'year', width: 10 },
    { header: 'เดือน', key: 'month', width: 10 },
    { header: 'เดือน', key: 'monthReverse', width: 10 },
    { header: 'เลขที่ผู้ใช้น้ำ (ใหม่)', key: 'meter', width: 12 },
    { header: 'เลขที่ผู้ใช้น้ำ (เก่า)', key: 'oldMeter', width: 10 },
    { header: 'ชื่อ', key: 'name', width: 60 },
    { header: 'ที่อยู่', key: 'address', width: 50 },
    { header: 'รับจริง', key: 'paymentAmount', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'วันที่ชำระเงิน', key: 'paymentDate', width: 10, style: { numFmt: '[$-th-TH,107]d mmm yy;@' } },
    { header: 'หมายเลขใบแจ้งหนี้ที่ตรงเดือน', key: 'invoiceNumber', width: 18 },
    { header: 'เดือนที่ค้างชำระตามใบแจ้งหนี้', key: 'debtText', width: 17 },
    { header: 'ยอดเงินที่ค้างชำระตามใบแจ้งหนี้', key: 'debtAmount', width: 17, style: { numFmt: '#,##0.00' } },
    { header: 'ภาษียอดค้าง', key: 'debtVat', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'ลบ.ม.', key: 'qty', width: 10, style: { numFmt: '#,##0.00' } },
    { header: 'ค่าบริการ', key: 'billAmount', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'อัตราภาษี', key: 'vatRate', width: 12, style: { numFmt: '0%' } },
    { header: 'ภาษี', key: 'vat', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'K+L', key: 'totalAmount', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'รวมภาษีขาย', key: 'totalVatAmount', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'รวมเงิน\nตามใบแจ้งหนี้', key: 'grandTotal', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'เดือนค้างใบเสร็จ', key: 'receiptDebtText', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'ยอดค้างใบเสร็จ', key: 'receiptDebtAmount', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'ยอดหนี้ใบแจ้งหนี้', key: 'invoiceBillAmount', width: 12, style: { numFmt: '#,##0.00' } },
    { header: 'หมายเหตุ', key: 'remark', width: 30 },
    { header: 'ประเภท', key: 'category', width: 10 },
    { header: 'แบบ', key: 'categoryType', width: 10 },
    { header: 'วิธีการคำนวณ', key: 'calculationType', width: 10 },
    { header: 'Reference', key: 'ref', width: 80 },
    { header: 'Id', key: 'id', width: 40 },
  ];
  sheet1.autoFilter = {
    from: 'A1',
    to: 'W1',
  }
  prepInvoice.forEach((element, i) => {
    sheet1.addRow(element);
  });
}


let createMeterMapper = async (prepInvoice: Array<any>) => {
  const workbook = new Excel.Workbook();
  const sheet1 = newWorkbook.addWorksheet('MeterMap');
  sheet1.columns = [
    { header: 'ชื่อ', key: 'name', width: 15 },
    { header: 'ที่อยู่', key: 'address', width: 15 },
    { header: 'ชื่อ-ที่อยู่', key: 'nameAddress', width: 15 },
    { header: 'unique', key: 'unique', width: 15 },
    { header: 'จำนวนมิเตอร์', key: 'uniqueMeter', width: 15 },
    { header: 'เลขที่ผู้ใช้น้ำ (ใหม่)', key: 'meter', width: 15 },
    { header: 'เลขที่ผู้ใช้น้ำ (เก่า)', key: 'oldMeter', width: 15 },
  ];
  sheet1.autoFilter = {
    from: 'A1',
    to: 'U1',
  }
  prepInvoice.forEach((element, i) => {
    sheet1.addRow(element);
  });
}
const main = async () => {
  await invoice()
  await receipt()
  await createMeterMapper(addressMap)
  await newWorkbook.xlsx.writeFile(finalFileCombined);
  console.log({ summary, uniqueInvoiceColumn, uniqueReceiptColumn })
}

main()