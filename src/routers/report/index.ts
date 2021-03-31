import * as ctrl from "../../controllers/report"
import {Express} from "express"
let endpoint = "report"
let endpoints = "reports"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}-debt-meter/`, ctrl.getDebtByMeter)
  app.post(`/api/v1/${endpoint}-debt-invoice/`, ctrl.getDebtByInvoice)
  app.post(`/api/v1/${endpoint}-debt-payment/`, ctrl.getDebtByPayment)
  app.post(`/api/v1/${endpoint}-debt-payment-list/`, ctrl.getDebtByPayment)
  app.post(`/api/v1/${endpoint}-debt-receipt/`, ctrl.getDebtByReceipt)
  app.post(`/api/v1/${endpoint}-customer-latest/`, ctrl.getCustomerLatest)

}