import * as ctrl from "../../controllers/usageRequest"
import {Express} from "express"
let endpoint = "usageRequest"
let endpoints = "usageRequests"

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
}