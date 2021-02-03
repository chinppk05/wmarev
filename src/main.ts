const mongoose = require('mongoose')
import  * as multer from "multer" 
import * as  morgan from "morgan"
import  * as bodyParser from "body-parser"
import  * as cors from "cors"
import * as express from "express"
const app = express()
const port = 20310

mongoose.connect('mongodb://localhost:27017/wma',{useNewUrlParser:true,useUnifiedTopology:true})

app.use(bodyParser.json())
app.use(express.urlencoded())

const paymentCondition = require('./routers/paymentcondition')(app)

app.listen(port,()=>{
  console.log("เซิฟเวอร์สตารทแล่ว!")
})