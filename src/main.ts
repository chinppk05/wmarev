const multer = require('multer')
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const express = require('express')
var cors = require('cors')
const app = express()
const port = 20310

mongoose.connect('mongodb://localhost:27017/wma',{useNewUrlParser:true,useUnifiedTopology:true})

app.use(cors())
app.use(bodyParser.json())
app.use(express.urlencoded())

const paymentCondition = require('./routers/paymentcondition')(app)
const collectcondition = require('./routers/collectcondition')(app)
const collection = require('./routers/collection')(app)
const customer = require('./routers/customer')(app)
const invoice = require('./routers/invoice')(app)
const payment = require('./routers/payment')(app)
const receipt = require('./routers/receipt')(app)
const contract = require('./routers/contract')(app)
const usage = require('./routers/usage')(app)
const cost = require('./routers/cost')(app)

app.listen(port,()=>{
  console.log("เซิฟเวอร์สตารทแล่ว!")
})