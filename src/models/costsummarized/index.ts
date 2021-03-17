const mongoose = require('mongoose')
const mongoosePaginate = require("mongoose-paginate")
const Schema = mongoose.Schema
const schema = new Schema({
  year: Number,
  month: Number,
  // ค่าใช้จ่ายจริง
  systemRepairCost:Number,         
  buildingRepairCost1:Number,
  toolRepairCost1:Number,
  pondRepairCost:Number,
  pipeRepairCost:Number,
  transformerRepairCost:Number,
  machineMaintenanceCost1:Number,
  machineMaintenanceCost2:Number,
  transformerMaintenanceCost:Number,
  chemicalMaterialCost:Number,
  analysisCost:Number,
  buildingRepairCost2:Number,
  improveLandscape:Number,
  electricalMaterialCost:Number,
  mechanicMaterialCost:Number,
  rentTransformer:Number,
  installationCost1:Number,
  temporaryCost:Number,
  regularCost:Number,
  portage:Number,
  oilCost:Number,
  vehicleCost:Number,
  assureCost:Number,
  documentCost:Number,
  fee:Number,
  equipmentCost1:Number,
  equipmentCost2:Number,
  publishCost:Number,
  advertisingCost:Number,
  meetingCost:Number,
  officeRepairCost:Number,
  toolRepairCost2:Number,
  vehicleRepairCost:Number,
  officeMaterialCost:Number,
  journalCost:Number,
  kitchenMaterialCost:Number,
  computerMaterialCost:Number,
  vehocleMaterialCost:Number,
  transformerRental:Number,
  installationCost2:Number,
  miscellaneousCost:Number,
  otherCost:Number,
  utilitiesCost1:Number,
  utilitiesCost2:Number,
  phoneCost:Number,
  faxCost:Number,
  internetCost:Number,
  salary:Number,
  rent1:Number,
  rent2:Number,
  rent3:Number,

  // สตง.รับรอง
  systemRepairCertified:Number,
  buildingRepaiCertified1:Number,
  toolRepairCertified1:Number,
  pondRepairCertified:Number,
  pipeRepairCertified:Number,
  transformerRepairCertified:Number,
  machineMaintenanceCertified1:Number,
  machineMaintenanceCertified2:Number,
  transformerMaintenanceCertified:Number,
  chemicalMaterialCertified:Number,
  analysisCertified:Number,
  buildingRepairCertified:Number,
  improveLandscapeCertified:Number,
  electricalMaterialCertified:Number,
  mechanicMaterialCertified:Number,
  rentTransformerCertified:Number,
  installationCertified1:Number,
  temporaryCertified:Number,
  regularCertified:Number,
  portageCertified:Number,
  oilCertified:Number,
  vehicleCertified:Number,
  assureCertified:Number,
  documentCertified:Number,
  feeCertified:Number,
  equipmentCertified1:Number,
  equipmentCertified2:Number,
  publishCertified:Number,
  advertisingCertified:Number,
  meetingCertified:Number,
  officeRepairCertified:Number,
  toolRepairCertified2:Number,
  vehicleRepairCertified:Number,
  officeMaterialCertified:Number,
  journalCertified:Number,
  kitchenMaterialCertified:Number,
  computerCertified:Number,
  vehocleMaterialCertified:Number,
  transformerRentalCertified:Number,
  installationCertified2:Number,
  miscellaneousCertified:Number,
  otherCertified:Number,
  utilitiesCertified1:Number,
  utilitiesCertified2:Number,
  phoneCertified:Number,
  faxCertified:Number,
  internetCertified:Number,
  salaryCertified:Number,
  rentCertified1:Number,
  rentCertified2:Number,
  rentCertified3:Number,
})
schema.plugin(mongoosePaginate)
const Costsummarized = mongoose.model("Costsummarized", schema)
export default Costsummarized