import * as ctrl from "../../controllers/payment"
import {Express} from "express"
let endpoint = "payment"
let endpoints = "payments"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}/`, ctrl.create)
  app.post(`/api/v1/${endpoint}-upsert/`, ctrl.upsert)
  app.get(`/api/v1/${endpoint}/:id`, ctrl.get)
  app.get(`/api/v1/${endpoint}-by-field/:field/:value`, ctrl.getByField)
  app.post(`/api/v1/${endpoint}-find`, ctrl.postOne)
  app.patch(`/api/v1/${endpoint}/:id`, ctrl.update)
  app.delete(`/api/v1/${endpoint}/:id`, ctrl.remove)
  app.post(`/api/v1/${endpoints}-delete`, ctrl.removeMany)
  app.get(`/api/v1/${endpoints}/`, ctrl.list)
  app.get(`/api/v1/${endpoints}-information/`, ctrl.information)
  app.post(`/api/v1/${endpoints}-paginate`, ctrl.postPaginate)
  app.post(`/api/v1/${endpoints}-group`, ctrl.postGroup)
}