import axios from "axios";
import Invoice from "../src/models/invoice";
const Excel = require('exceljs');
let delayed = 10
let config = {
  headers:{
    Authorization: "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImFjY2VzcyI6WyJiaWxsaW5nIiwi4LiX4Liw4LmA4Lia4Li14Lii4LiZ4LiE4Li44Lih4Lic4Li54LmJ4LmD4LiK4LmJ4Lia4Lij4Li04LiB4Liy4LijIiwi4LmD4Lia4LmB4LiI4LmJ4LiH4Lir4LiZ4Li14LmJIiwi4Lic4Li54LmJ4LiK4Liz4Lij4Liw4LmA4LiH4Li04LiZIiwi4LiE4Liz4LiC4Lit4Lit4LiZ4Li44Lih4Lix4LiV4Li0Iiwi4Liq4Liy4Lii4Lij4Lir4Lix4Liq4LmA4LiB4LmH4Lia4LmA4LiH4Li04LiZIiwi4LiX4Liw4LmA4Lia4Li14Lii4LiZ4LiE4Li44Lih4LmD4Lia4LiE4Liz4Lij4LmJ4Lit4LiHIiwi4LiX4Liw4LmA4Lia4Li14Lii4LiZ4LiE4Li44Lih4LmD4Lia4LmA4Liq4Lij4LmH4LiI4Lij4Lix4Lia4LmA4LiH4Li04LiZL-C5g-C4muC4geC4s-C4geC4seC4muC4oOC4suC4qeC4tSIsIuC4l-C4sOC5gOC4muC4teC4ouC4meC4hOC4uOC4oeC5g-C4muC5geC4iOC5ieC4h-C4q-C4meC4teC5iSIsIuC4o-C4suC4ouC4h-C4suC4meC4leC4seC4lOC4ouC4reC4lOC4q-C4meC4teC5iSIsIuC4o-C4suC4ouC4geC4suC4o-C4nOC4ueC5ieC5g-C4iuC5ieC4meC5ieC4syIsIkRhc2hib2FyZCIsIuC4nOC4peC4geC4suC4o-C4iOC4seC4lOC5gOC4geC5h-C4muC4hOC5iOC4suC4muC4o-C4tOC4geC4suC4oyIsIuC4o-C4suC4ouC4h-C4suC4meC4oOC4suC4qeC4teC4guC4suC4oiIsIuC5gOC4l-C4oeC5gOC4nuC4peC4leC5gOC4reC4geC4quC4suC4o-C4muC4tOC4peC4peC4tOC5iOC4hyIsIuC5g-C4muC5gOC4quC4o-C5h-C4iOC4o-C4seC4muC5gOC4h-C4tOC4mS_guIHguLPguIHguLHguJrguKDguLLguKnguLUiLCJpbmNvbWUiLCLguITguYjguLLguYPguIrguYnguIjguYjguLLguKIgKOC4geC4o-C4reC4miAyKSIsIuC4quC4o-C4uOC4m-C4o-C4suC4ouC4o-C4seC4miAtIOC4o-C4suC4ouC4iOC5iOC4suC4oiAo4LiB4Lij4Lit4LiaIDMpIiwi4LmD4Lia4LiZ4Liz4Liq4LmI4LiHL0ludm9pY2UiLCLguYHguJzguJnguIHguLLguKPguIjguLHguJTguYDguIHguYfguJrguKPguLLguKLguYTguJTguYnguJvguKPguLDguIjguLPguJvguLXguIfguJrguJvguKPguLDguKHguLLguJMiLCLguITguLPguJnguKfguJPguKLguK3guJTguYDguIfguLTguJnguKrguKHguJfguJogKOC4geC4o-C4reC4miA0KSIsIuC4leC5ieC4meC4l-C4uOC4meC4m-C4seC4meC4quC5iOC4p-C4meC4meC5ieC4syIsIuC4o-C4q-C4seC4quC4muC4seC4jeC4iuC4tSIsIuC4muC4seC4meC4l-C4tuC4geC4geC4suC4o-C4o-C4seC4muC5gOC4h-C4tOC4mSDguK3guJvguJcuIiwi4LmA4LiH4Li34LmI4Lit4LiZ4LmE4LiC4Liq4Lix4LiN4LiN4LiyIOC4reC4m-C4ly4iLCLguJXguLLguKPguLLguIfguYHguJzguJkv4Lic4Lil4LiB4Liy4Lij4LiI4Lix4LiU4LmA4LiB4LmH4Lia4Lij4Liy4Lii4LmE4LiU4LmJ4LiX4Li14LmI4Lic4LmI4Liy4LiZ4Lih4LiyIiwi4LmA4Lib4Lij4Li14Lii4Lia4LmA4LiX4Li14Lii4Lia4LmB4Lic4LiZL-C4nOC4peC4o-C4suC4ouC5gOC4lOC4t-C4reC4mSIsIuC4quC4o-C4uOC4m-C4quC4luC4suC4meC4sOC4geC4suC4o-C4iOC4seC4lOC5gOC4geC5h-C4muC4o-C4suC4ouC5hOC4lOC5iSIsIuC4quC4luC4tOC4leC4tOC4nOC4peC4geC4suC4o-C4iOC4seC4lOC5gOC4geC5h-C4muC4o-C4suC4ouC5hOC4lOC5ieC4l-C4teC5iOC4nOC5iOC4suC4meC4oeC4siIsIuC5geC4nOC4meC4geC4suC4o-C4iOC4seC4lOC5gOC4geC5h-C4muC4o-C4suC4ouC5hOC4lOC5iSIsImFyZWEiLCJ1c2VyIiwiYXBwcm92ZSIsImRhc2hib2FyZCBiaWxsaW5nIiwiZGFzaGJvYXJkIOC4iOC4seC4lOC5gOC4geC5h-C4muC4o-C4suC4ouC5hOC4lOC5iSJdLCJfaWQiOiI2MGM1YjU4YzU0ZGU1YWM5NTY1NDNkMTYiLCJ1c2VybmFtZSI6IlRlc3RVc2VyMyIsInBhc3N3b3JkIjoiJDJhJDA4JGx0dmVOMkk1RGtnRVRMMi4vVHdveHVTcFlzS04yQnJ5WVovZmFIVTE5M2ppL0ZCa2R4TktDIiwiY3JlYXRlZEF0IjoiMjAyMS0wNi0xM1QwNzozNjo0NC4yNjRaIiwiY3JlYXRlZElQIjoiNDkuMjI4LjE0NC43NCIsIl9fdiI6MH0sImlhdCI6MTY0Mzg1OTQxN30.TZ-7d-xktQvLPMABqzokr38HxxucNunV54Z3PInKeX8"
  }
}
const patchUpdate = (row:any) => {
  let vat = parseFloat(parseFloat(row.getCell("L").text).toFixed(2))
  let sequence = row.getCell("B").text
  if(Number.isNaN(vat)) vat = 0
  let prep = {
    vat
  }
  console.log(sequence, prep)
  delayed = delayed + 10
  Invoice.updateOne({sequence},{$set:{vat}}).then((result)=>{
    console.log('done', sequence)
  })
  // setTimeout(() => {
  //   axios.patch(`https://inco.wma.go.th/api/v2/invoice-number/${sequence}`, prep, config).then(res=>{
  //     console.log(res.data)
  //   }).catch(err=>{
  //     console.log(err)
  //   })
  // }, delayed);
}


(async () => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(__dirname + "/60_3.xlsx");
  let sheet2 = workbook.getWorksheet("type2")
  let sheet3 = workbook.getWorksheet("type3")
  sheet2.eachRow(function (row: any, rowNumber: number) {
    if(rowNumber>5&&row.getCell("A").value!=null) patchUpdate(row)
  })
  sheet3.eachRow(function (row: any, rowNumber: number) {
    if(rowNumber>5&&row.getCell("A").value!=null) patchUpdate(row)
  })
})()
