
const passport = require('passport'); const jwt = require('jsonwebtoken');
import express, { Express, NextFunction, Response, Request } from 'express'
import * as ctrl from "../../controllers/auth"
module.exports = (app: Express) => {


  app.post('/api/v1/user/signup/', passport.authenticate('signup', { session: false }), ctrl.signup)
  app.post('/api/v1/user/login/', passport.authenticate('login', { session: false }), ctrl.login)
  app.post('/api/v1/user/logout/', ctrl.logout)
  app.get('/api/v1/user-list/', ctrl.getUser)
  app.get('/api/v1/test-secured-path/', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send("you're secured!")
  })
  app.post('/api/v1/user-keep-alive/', ctrl.keepAlive)
  app.post('/api/v1/user-update-path/', ctrl.updatePath)

  app.post('/api/v1/reset/request/', ctrl.resetRequest)
  app.post('/api/v1/reset/submit/', ctrl.resetSubmission)
}