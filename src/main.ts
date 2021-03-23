
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
// const express = require('express')
import multer from "multer"
import express from "express"
import { DateTime } from "luxon"
import passport from "passport";
import passportLocal from "passport-local";
const localStrategy = require("passport-local").Strategy;
import { Socket } from "socket.io"
var cors = require('cors')
const app = express()

const http = require('http').Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*", //origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true
  },
  // path: '/api/v1'
});

const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const uuidv4 = uuid.v4
const port = 20310

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })

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
    var sanitize = require("sanitize-filename");
    var uploadDir = `uploads/${req.body.name}`
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    let rdm = (Math.ceil(Math.random() * 1000)).toString().padStart(5, '0')
    let extension = path.extname(file.originalname)
    let escapedName = sanitize(file.originalname).replace(extension, "")
    let fileName = DateTime.now().toFormat('yyyyLLddHHmmss') + "_" + escapedName + path.extname(file.originalname)
    cb(null, `${req.body.name}/${fileName}`)
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

const area = require('./routers/area')(app)
const areaCondition = require('./routers/areaCondition')(app)
const areaCollection = require('./routers/areaCollection')(app)
const areaRate = require('./routers/areaRate')(app)

const usage = require('./routers/usage')(app)
const cost = require('./routers/cost')(app)
const costsummarized = require('./routers/costsummarized')(app)
const costCode = require('./routers/costCode')(app)
const estimate = require('./routers/estimate')(app)
const history = require('./routers/history')(app)
const user = require('./routers/user')(app)
const auth = require('./routers/auth')(app)

const report = require('./routers/report')(app)

app.get("/", (req, res) => {
  res.send("Welcome to WMA201AM1 API Server!");
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

let connectCounter = 0

io.on('connection', (socket: Socket) => {
  console.log('a user connected: ' + connectCounter);
  socket.on('connect', function () { connectCounter++; });
  socket.on('disconnect', function () { connectCounter--; });
});

http.listen(port, () => {
  console.log("Server started! at port " + port)
})