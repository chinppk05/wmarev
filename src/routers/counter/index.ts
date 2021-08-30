import * as ctrl from "../../controllers/counter"
import {Express} from "express"
let endpoint = "counter"
let endpoints = "counters"

module.exports = (app: Express) => {
  app.get(`/api/v1/${endpoint}/:id`, ctrl.get)
  app.patch(`/api/v1/${endpoint}/:id`, ctrl.update)
  app.get(`/api/v1/${endpoints}/`, ctrl.list)
}