
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
  path: '/api/v1/socket.io'
});

const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const uuidv4 = uuid.v4
const port = 20310

mongoose.connect('mongodb://localhost:27017/wma', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


app.use(cors())
app.use(bodyParser.json({limit: '50mb'}))
app.use(express.urlencoded({ extended: true,limit: '50mb' }))
// app.use(morgan('combined'))
app.use(morgan(function (tokens:any, req:any, res:any) {
  let time = tokens['response-time'](req, res)
  let prefix = "🤕"
  if(time > 5000) prefix = "😡"
  else prefix = "😇"
  return [
    prefix,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
}))

app.use('/api/v1/uploads', express.static('uploads'))
app.use('/api/v1/manuals', express.static('manuals'))

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

const invoice = require('./routers/invoice')(app)
const payment = require('./routers/payment')(app)
const receipt = require('./routers/receipt')(app)
const area = require('./routers/area')(app)
const areaCondition = require('./routers/areaCondition')(app)
const areaCollection = require('./routers/areaCollection')(app)
const areaIncome = require('./routers/areaIncome')(app)
const areaRate = require('./routers/areaRate')(app)
const areaRation = require('./routers/areaRation')(app)
const usage = require('./routers/usage')(app)
const cost = require('./routers/cost')(app)
const costCode = require('./routers/costCode')(app)
const request = require('./routers/request')(app)
const history = require('./routers/history')(app)
const user = require('./routers/user')(app)
const auth = require('./routers/auth')(app)
const calculation = require('./routers/calculation')(app)
const coverLetter = require('./routers/coverLetter')(app)
const render = require('./routers/render')(app)
const process = require('./routers/process')(app)
const risk = require('./routers/risk')(app)
const report = require('./routers/report')(app)
const usageRequest = require('./routers/usageRequest')(app)

app.get("/api/v1/", (req:any, res:any) => {
  res.send("Welcome to WMA201AM1 API Server!");
});

app.post('/api/v1/upload', upload.single('file'), function (req:any, res:any, next:any) {
  res.send({
    status: 'success',
    timestamp: new Date(),
    file: req.file,
    ...req.file
  })
  next()
})

let connectCounter = 0
var users:Array<{user:string,createdAt:Date}> = []

let clearUsers = () =>{
  console.log("clearing users...")
  setTimeout(() => {
    users.forEach((el,i)=>{
      let diff = DateTime.fromJSDate(el.createdAt).diffNow('minutes').minutes
      if(diff>3) users.splice(i,1)
    })
    clearUsers()
  }, 2*1000*60);
}
clearUsers()
// io.on('connection', (socket: Socket) => {
//   console.log('a user connected: ' + connectCounter);
//   socket.on('connected', function () {
//     connectCounter++;
//     io.emit('userCount', connectCounter);
//   });

//   socket.on('getuser', function () {
//     io.emit('users', users);
//   });
//   socket.on('removeuser', function (payload) {
//     let found = users.findIndex(el=>el.user===payload)
//     try {
//       users.splice(found,1)
//     } catch (error) {
      
//     }
//   });

//   socket.on('loggedin', function (payload) {
//     let found = users.find(el=>el.user===payload)
//     if(found==undefined){
//       users.push({
//         user:payload,
//         createdAt:new Date()
//       })
//     }
//     else{
//       let diff = DateTime.fromJSDate(found.createdAt).diffNow('minutes').minutes
//       if(diff>3){
//         let i = users.findIndex(el=>el.user===payload)
//         users.splice(i,1)
//         users.push({
//           user:payload,
//           createdAt:new Date()
//         })
//       }else{
//         io.emit('users', users);
//       }
//     }
//   });

//   socket.on('disconnect', function () {
//     connectCounter--;
//     if (connectCounter < 0) connectCounter = 0
//     io.emit('userCount', connectCounter);
//   });
// });


function haltOnTimedout (req:any, res:any, next:any) {
  if (!req.timedout) next()
}

http.listen(port, () => {
  console.log("Server started! at port " + port)
})