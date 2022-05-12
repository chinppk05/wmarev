
import * as ctrl from "../../controllers/helper"
import { Express } from "express"
let endpoint = "helper"
let endpoints = "helpers"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}/invoice-number-adjustment`, ctrl.invoiceNumberAdjustment)
  app.post(`/api/v1/${endpoint}/receipt-number-adjustment`, ctrl.receiptNumberAdjustment)
  app.post(`/api/v1/${endpoint}/receipt-sequence-temp`, ctrl.receiptSequenceTemp)
  app.post(`/api/v1/${endpoint}/receipt-invoice-map`, ctrl.receiptInvoiceMap)
  app.post(`/api/v1/${endpoint}/invoice-restore`, ctrl.restoreInvoice)
  app.post(`/api/v1/${endpoint}/receipt-debttext-restore`, ctrl.restoreDebtText)
  
  
}