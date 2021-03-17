
const passport = require('passport'); const jwt = require('jsonwebtoken');
import express, { Express, NextFunction, Response, Request } from 'express'
import * as ctrl from "../../controllers/auth"
module.exports = (app: Express) => {


app.post('/api/v1/user/signup/', passport.authenticate('signup', { session: false }), ctrl.signup)
app.post('/api/v1/user/login/', passport.authenticate('login', { session: false }), ctrl.login)

}