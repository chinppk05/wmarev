import * as ctrl from "../../controllers/process"
import {Express} from "express"
let endpoint = "process"
let endpoints = "processes"

module.exports = (app: Express) => {
  app.post(`/api/v1/process/create/invoice/`, ctrl.createInvoice)
  app.post(`/api/v1/process/print/invoice/`, ctrl.printInvoice)
  app.post(`/api/v1/process/create/receipt/`, ctrl.createReceipt)
  app.post(`/api/v1/receiptv2/`, ctrl.createReceiptV2)
  
  app.post(`/api/v1/process/print/receipt/`, ctrl.printReceipt)
  app.post(`/api/v1/process/request/receipt/`, ctrl.approvalRequestReceipt)
  app.post(`/api/v1/process/approve/receipt/`, ctrl.approvalApprovedReceipt)
  app.post(`/api/v1/process/sign/receipt/`, ctrl.signReceipt)
  app.post(`/api/v1/process/print/receipt/`, ctrl.printReceipt)
}