import * as ctrl from "../../controllers/adjust"
import {Express} from "express"

module.exports = (app: Express) => {
  app.get(`/api/v1/adjust-collection/`, ctrl.adjustCollection)
  
  
  
  
}