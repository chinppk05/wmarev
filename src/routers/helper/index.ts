
import * as ctrl from "../../controllers/helper"
import { Express } from "express"
let endpoint = "helper"
let endpoints = "helpers"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}/invoice-number-adjustment`, ctrl.invoiceNumberAdjustment)
}