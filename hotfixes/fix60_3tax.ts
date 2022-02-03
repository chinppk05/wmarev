const Excel = require('exceljs');

const patchUpdate = (row:any) => {
  console.log(row)
}


(async () => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(__dirname + "/60_3.xlsx");
  let sheet2 = workbook.getWorksheet("type2")
  let sheet3 = workbook.getWorksheet("type3")
  sheet2.eachRow(function (row: any, rowNumber: number) {
    patchUpdate(row)
  })
  sheet3.eachRow(function (row: any, rowNumber: number) {
    patchUpdate(row)
  })
})()
