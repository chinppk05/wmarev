const mongoose = require('mongoose')
import Invoice from "../src/models/invoice";

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

let i = 0
Invoice.find({calculationType:"บาท/เดือน"}).then((data:Array<any>)=>{
  // data.forEach(el => {
  //   if(el.rate===0){
  //     el.rate = el.totalAmount
  //     el.save()
  //     console.log(`${el.year} ${el.month} ${el.sequence} updated ` + (i++))
  //   }
  // });
  data.forEach(el => {
    let prep = JSON.parse(JSON.stringify(el))
    if(prep.invoiceAmount==null||Number.isNaN(prep.invoiceAmount)){
      el.invoiceAmount = (el.totalAmount??0)*1.07 + (el.debtAmount??0)
      el.save()
      console.log(`${el.year} ${el.month} ${el.sequence} updated ` + (i++))
    }
  });
})