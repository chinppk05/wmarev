import * as ctrl from "../../controllers/history"
import {Express} from "express"
let endpoint = "history"
let endpoints = "histories"

module.exports = (app: Express) => {
  app.get(`/api/v1/${endpoint}/:id`, ctrl.get)
  app.get(`/api/v1/${endpoints}/`, ctrl.list)
  app.post(`/api/v1/${endpoints}-paginate`, ctrl.postPaginate)
}