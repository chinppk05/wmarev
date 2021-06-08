import * as ctrl from "../../controllers/render"
import { Express } from "express"
let endpoint = "render"
let endpoints = "renders"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}-calculation-list/`, ctrl.postCalculationList)
  app.post(`/api/v1/${endpoint}-customer-list/`, ctrl.getCustomerList)

  app.post(`/api/v1/${endpoint}-areacondition-year-list/`, ctrl.getAreaWithYearCondition)

}