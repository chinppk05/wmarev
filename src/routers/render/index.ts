import * as ctrl from "../../controllers/render"
import { Express } from "express"
let endpoint = "render"
let endpoints = "renders"

module.exports = (app: Express) => {
  app.get(`/api/v1/${endpoint}-calculation-list/`, ctrl.getCalculationList)

}