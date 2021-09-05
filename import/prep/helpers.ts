
import Excel from "exceljs"
import { DateTime } from "luxon"

export const resolveAmount2 = (row: Excel.Row, cell: Excel.Cell, index: number): number => {
  if (cell.type == Excel.ValueType.Formula) {
    return cell.result as number
  }
  else if (cell.type == Excel.ValueType.Number) {
    return cell.value as number
  } else {
    return 0 // `${index} : ` + JSON.stringify(row.values as Array<string>)//JSON.stringify(row.getCell(index).value)
  }
}
export const resolveAmount = (cell: Excel.Cell): number => {
  if (cell.type == Excel.ValueType.Formula) {
    return cell.result as number
  }
  else if (cell.type == Excel.ValueType.Number) {
    return cell.value as number
  } else {
    return 0
  }
}

export const resolveDateThai = (cell: Excel.Cell): Date => {
  let input = cell.text.split(".").join("").split(" ").join("")
  var myRegexp = /(\d+)(.+?)(\d+)/g ///1-(.*?)\)/g;
  var match = myRegexp.exec(input);
  if (match != null) {
    let dt = DateTime.fromObject({ year: parseInt(match[3]) + 2500 - 543, month: getMonth(match[2]), day: parseInt(match[1]) ?? 1, hour: 12, minute: 0 })
    return dt.toJSDate()
  }
  else
    return new Date()
}

export const resolveAddress = (mapper: number | undefined, row: Excel.Row): string => {
  if (mapper == undefined) {
    return "-"
  }
  else if (Excel.ValueType.String == row.getCell(mapper).type) {
    let result = row.getCell(mapper).text
    return result.replace("- ", "").replace("[object Object]", "*")
  } else if (Excel.ValueType.Formula == row.getCell(mapper).type) {
    return row.getCell(mapper).result.toString().replace("[object Object]", "*")
  } else {
    return JSON.stringify(row.getCell(mapper).text).replace("[object Object]", "*")
  }
  // let result = mapper == undefined ? "-" : row.getCell(mapper).text
  // return result.replace("- ", "")
}


export const resolveDebtText = (cell: Excel.Cell) => {
  if (cell.text == '1') {
    return "เมย59"
  }
  else if (cell.text == '0') {
    return ""
  }
  else if (cell.type == Excel.ValueType.Date) {
    let date = cell.value as Date
    return DateTime.fromJSDate(date).set({ year: date.getFullYear() - 543 }).reconfigure({ outputCalendar: "buddhist" }).setLocale("th").toFormat("LLLyy")
  } else {
    return cell.text
  }
}
export const resolveName = (name: string, meter: string): string => {
  if (name == "ตลาดสดเทศบาล" && meter.length == 7) return "ตลาดสดเทศบาล(บริษัทแสงอรุณเคมีภัณฑ์ จำกัด)"
  return name
}

export const getMonth = (str: string): number => {
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

export const reverseMonth = (no: number): string => {
  switch (no) {
    case 1:
      return "มค"
      break;
    case 2:
      return "กพ"
      break;
    case 3:
      return "มีค"
      break;
    case 4:
      return "เมย"
      break;
    case 5:
      return "พค"
      break;
    case 6:
      return "มิย"
      break;
    case 7:
      return "กค"
      break;
    case 8:
      return "สค"
      break;
    case 9:
      return "กย"
      break;
    case 10:
      return "ตค"
      break;
    case 11:
      return "พย"
      break;
    case 12:
      return "ธค"
      break;

    default:
      return "-"
      break;
  }
}
