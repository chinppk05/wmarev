import * as ctrl from "../../controllers/estimate"
import {Express} from "express"
let endpoint = "estimate"
let endpoints = "estimates"

// const fs = require("fs")
// const path = require("path")
// const multer = require("multer")
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, 'excel-import/')
//   },
//   filename: function (req, file, cb) {
//       var uploadDir = `excel-import/${req.body.name}`
//       if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive: true});
//       let rdm = (Math.ceil(Math.random()*1000)).toString().padStart(5,'0')
//       cb(null, `${req.body.name}/${rdm}${path.extname(file.originalname)}`)
//   }
// })
// var upload = multer({
//   storage: storage
// })
module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}/`, ctrl.create)
  app.get(`/api/v1/${endpoint}/:id`, ctrl.get)
  app.get(`/api/v1/${endpoint}-by-field/:field/:value`, ctrl.getByField)
  app.post(`/api/v1/${endpoint}-find`, ctrl.postOne)
  app.patch(`/api/v1/${endpoint}/:id`, ctrl.update)
  app.delete(`/api/v1/${endpoint}/:id`, ctrl.remove)
  app.get(`/api/v1/${endpoints}/`, ctrl.list)
  app.post(`/api/v1/${endpoints}-paginate`, ctrl.postPaginate)
  app.post(`/api/v1/${endpoints}-group`, ctrl.postGroup)
  // app.post(`/api/v1/${endpoints}-import`,upload.single("file"), ctrl.importExcel)
}