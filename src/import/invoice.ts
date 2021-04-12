const Excel = require('exceljs');
const mongoose = require('mongoose')
import Invoice from "../models/invoice";
import Usage from "../models/usage";

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

(async () => {
  await Invoice.deleteMany({}).exec()
  await Usage.deleteMany({}).exec()
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile("./invoice.xlsx");
  let sheet = workbook.getWorksheet("Data")

  sheet.columns = [
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
  ];

  sheet.eachRow(async function (row: any, rowNumber: number) {
    if (rowNumber > 1) {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log("row", rowNumber)
      try {
        await Invoice.create({
          sequence: row.getCell(2),
          year: row.getCell(3),
          month: row.getCell(4),
          meter: row.getCell(5),
          name: row.getCell(6),
          address: row.getCell(7),
          qty: row.getCell(8),
          rate: row.getCell(9),
          flatRate: row.getCell(10),
          debtText: row.getCell(11),
          debtAmount: row.getCell(12),
          totalAmount: row.getCell(13),
          category: row.getCell(14),
          categoryType: row.getCell(15),
        }).then(() => {
          console.log(`invoice ${rowNumber}: The script uses approximately ${Math.round(used * 100) / 100} MB`);
        })
      } catch (error) {
        console.log("invoice create error", error)
      }
      try {
        await Usage.create({
          sequence: row.getCell(2),
          year: row.getCell(3),
          month: row.getCell(4),
          meter: row.getCell(5),
          name: row.getCell(6),
          address: row.getCell(7),
          qty: row.getCell(8),
          rate: row.getCell(9),
          flatRate: row.getCell(10),
          debtText: row.getCell(11),
          debtAmount: row.getCell(12),
          totalAmount: row.getCell(13),
          category: row.getCell(14),
          categoryType: row.getCell(15),
        }).then(() => {
          console.log(`usage ${rowNumber}: The script uses approximately ${Math.round(used * 100) / 100} MB`);
        })
      } catch (error) {
        console.log("usage create error", error)
      }
      console.log("done", rowNumber)
    }
  })
})()