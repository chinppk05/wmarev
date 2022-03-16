import * as ctrl from "../../controllers/report"
import { Express } from "express"
let endpoint = "report"
let endpoints = "reports"

module.exports = (app: Express) => {
  app.post(`/api/v1/${endpoint}-debt-meter/`, ctrl.getDebtByMeter)
  app.post(`/api/v1/${endpoint}-debt-invoice/`, ctrl.getDebtByInvoice)
  app.post(`/api/v1/${endpoint}-debt-payment/`, ctrl.getDebtByPayment)
  app.post(`/api/v1/${endpoint}-debt-paymentlist/`, ctrl.getDebtByPaymentList)
  app.post(`/api/v1/${endpoint}-debt-receipt/`, ctrl.getDebtByReceipt)
  app.post(`/api/v1/${endpoint}-customer-latest/`, ctrl.getCustomerLatest)


  app.post(`/api/v1/${endpoint}-customer-history/`, ctrl.getCustomerHistory)

  app.get(`/api/v1/${endpoint}-billing-dashboard/`, ctrl.getBillingDashboard)
  app.post(`/api/v1/${endpoint}-billing-dashboard/`, ctrl.getBillingDashboard)

  app.post(`/api/v1/${endpoint}-billing-receipt/`, ctrl.getBillingReceiptReport)


  app.get(`/api/v1/${endpoint}-income-fixed-collection/:id`, ctrl.getIncomeFixedCollection)
  app.get(`/api/v1/${endpoint}-income-collectionstatus/`, ctrl.getCollectionStatus)
  app.get(`/api/v1/${endpoint}-income-collectionstatistic/`, ctrl.getCollectionStatistic)
  app.get(`/api/v1/${endpoint}-income-compareplanresult/`, ctrl.getComparePlanResult)
  app.get(`/api/v1/${endpoint}-income-areamonthly/`, ctrl.getAreaMonthly)
  app.get(`/api/v1/${endpoint}-get-green-yellow/`, ctrl.getGreenYellow)
  app.post(`/api/v1/${endpoint}-green-yellow/`, ctrl.getGreenYellow)

}