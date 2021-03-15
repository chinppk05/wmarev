import * as ctrl from "../../controllers/user"
import {Express} from "express"

module.exports = (app: Express) => {
  app.post(`/api/v1/user/`, ctrl.create)
  app.get(`/api/v1/user/:id`, ctrl.get)
  app.patch(`/api/v1/user/:id`, ctrl.update)
  app.delete(`/api/v1/user/:id`, ctrl.remove)
  app.get(`/api/v1/user/`, ctrl.list)
  app.post(`/api/v1/user-paginate`, ctrl.postPaginate)
}