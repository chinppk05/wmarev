import * as ctrl from "../../controllers/calculation"
import { Express } from "express"
let endpoint = "calculation"
let endpoints = "calculations"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}/`, ctrl.create)
  app.post(`/api/v1/${endpoint}-upsert/`, ctrl.upsert)
  app.get(`/api/v1/${endpoint}/:id`, ctrl.get)
  app.post(`/api/v1/${endpoint}-quarter-sum/:area/:year/:quarter`, ctrl.quarterSum)
  app.get(`/api/v1/${endpoint}-quarter-sum/:area/:year/:quarter`, ctrl.quarterSum)
  app.get(`/api/v1/${endpoint}-by-field/:field/:value`, ctrl.getByField)
  app.post(`/api/v1/${endpoint}-find`, ctrl.postOne)
  app.patch(`/api/v1/${endpoint}/:id`, ctrl.update)
  app.delete(`/api/v1/${endpoint}/:id`, ctrl.remove)
  app.get(`/api/v1/${endpoints}/`, ctrl.list)
  app.post(`/api/v1/${endpoints}-paginate`, ctrl.postPaginate)
  app.post(`/api/v1/${endpoints}-group`, ctrl.postGroup)
  app.get(`/api/v1/${endpoints}-excel`, ctrl.excelDownload)
}