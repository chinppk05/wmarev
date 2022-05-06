import * as ctrl from "../../controllers/invoice"
import {Express} from "express"
let endpoint = "invoice"
let endpoints = "invoices"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}/`, ctrl.create)
  app.post(`/api/v1/${endpoint}-upsert/`, ctrl.upsert)
  app.post(`/api/v1/${endpoint}-many/`, ctrl.createMany)
  app.post(`/api/v1/${endpoint}-date/`, ctrl.updateInvoiceDate)
  app.get(`/api/v1/${endpoint}/:id`, ctrl.get)
  app.get(`/api/v1/${endpoint}-by-field/:field/:value`, ctrl.getByField)
  app.post(`/api/v1/${endpoint}-find`, ctrl.postOne)
  app.patch(`/api/v1/${endpoint}/:id`, ctrl.update)
  app.patch(`/api/v1/${endpoint}-number/:number`, ctrl.updateByNumber)
  app.delete(`/api/v1/${endpoint}/:id`, ctrl.remove)
  app.post(`/api/v1/${endpoints}-delete`, ctrl.removeMany)
  app.get(`/api/v1/${endpoints}/`, ctrl.list)
  app.get(`/api/v1/${endpoints}-information/`, ctrl.information)
  app.post(`/api/v1/${endpoints}-paginate`, ctrl.postPaginate)
  app.post(`/api/v1/${endpoints}-paginate-light`, ctrl.postPaginateLight)
  app.post(`/api/v1/${endpoints}-group`, ctrl.postGroup)
  app.get(`/api/v1/${endpoints}-excel`, ctrl.excelDownload)
  app.post(`/api/v1/${endpoints}-excel`, ctrl.excelDownload)
}