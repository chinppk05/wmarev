const multer = require('multer')
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const express = require('express')
var cors = require('cors')
const app = express()
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const uuidv4 = uuid.v4
const port = 20310

mongoose.connect('mongodb://localhost:27017/wma',{useNewUrlParser:true,useUnifiedTopology:true})

app.use(cors())
app.use(bodyParser.json())
app.use(express.urlencoded())
app.use(morgan('combined'))
app.use('/api/v1/uploads', express.static('uploads'))


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
      var uploadDir = `uploads/${req.body.name}`
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive: true});
      let rdm = (Math.ceil(Math.random()*1000)).toString().padStart(5,'0')
      cb(null, `${req.body.name}/${uuidv4()}_${rdm}${path.extname(file.originalname)}`)
  }
})
var upload = multer({
  storage: storage
})

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


app.get("/", (req, res) => {
  res.send("Welcome to DAE202AM1 API Server!");
});

app.post('/api/v1/upload', upload.single('file'), function (req, res, next) {
  res.send({
      status: 'success',
      timestamp: new Date(),
      file: req.file,
      ...req.file
  })
  next()
})


app.listen(port,()=>{
  console.log("Server started! at port " + port)
})