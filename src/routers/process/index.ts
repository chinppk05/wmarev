import * as ctrl from "../../controllers/process"
import {Express} from "express"
let endpoint = "process"
let endpoints = "processes"

module.exports = (app: Express) => {

  app.get(`/api/v1/${endpoint}/test`, (req,res)=>res.send("test done"))
  app.post(`/api/v1/${endpoint}/create/receipt/v2/`, ctrl.createReceiptV2)
  app.post(`/api/v1/${endpoint}/create/invoice/`, ctrl.createInvoice)
  app.post(`/api/v1/${endpoint}/print/invoice/`, ctrl.printInvoice)
  app.post(`/api/v1/${endpoint}/create/receipt/`, ctrl.createReceipt)

  app.post(`/api/v1/${endpoint}/change/meter/`, ctrl.batchChangeMeter)

  app.post(`/api/v1/${endpoint}/print/receipt/`, ctrl.printReceipt)
  app.post(`/api/v1/${endpoint}/request/receipt/`, ctrl.approvalRequestReceipt)
  app.post(`/api/v1/${endpoint}/approve/receipt/`, ctrl.approvalApprovedReceipt)
  app.post(`/api/v1/${endpoint}/sign/receipt/`, ctrl.signReceipt)
  app.post(`/api/v1/${endpoint}/print/receipt/`, ctrl.printReceipt)
  app.post(`/api/v1/${endpoint}/create/receipt/v3/`, ctrl.createReceiptV3)

}