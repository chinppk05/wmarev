import express, { Request, Response, NextFunction } from 'express'
const qs = require('querystring');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
import UserModel from '../../models/user/index'

passport.use('signup', new localStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, async (username: string, password: string, done: Function) => {
    console.log("signing up...")
    try {
      const user = await UserModel.create({ username, password });
      return done(null, user);
    } catch (error) {
      console.log(error)
      done(error);
    }
  }));
  
  
  //Create a passport middleware to handle User login
  passport.use('login', new localStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  
    async (username: string, password: string, done: Function) => {
      console.log("login passport strategy")
      try {
  
        const user = await UserModel.findOne({ username });
        if (!user) {
          console.log('User not found')
          return done(null, false, { message: 'User not found' });
        }
        const validate = await user.isValidPassword(password);
        if (!validate) {
          console.log('Wrong Password')
          return done(null, false, { message: 'Wrong Password' });
        }
        //Send the user information to the next middleware
        console.log('Logged in Successfully')
        return done(null, user, { message: 'Logged in Successfully' });
      } catch (error) {
        return done(error);
      }
    }
  ));
  const JWTstrategy = require('passport-jwt').Strategy;
  const ExtractJWT = require('passport-jwt').ExtractJwt;
  const jwt = require('jsonwebtoken');
  
  //This verifies that the token sent by the user is valid
  passport.use(new JWTstrategy({
    //secret we used to sign our JWT
    secretOrKey: 'JMANDJM-CHN201AM1',
    //we expect the user to send the token as a query parameter with the name 'secret_token'
    jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token')
  }, async (token: { user: string }, done: Function) => {
    try {
      //Pass the user details to the next middleware
      return done(null, token.user);
    } catch (error) {
      done(error);
    }
  }));

  
  export const signup = (req: Request, res: Response) => {
    console.log("signing... up...")
    res.send({
      message: 'Signup successful',
      user: req.user
    });
  }
  export const login = (req: Request, res: Response) => {
    const token = jwt.sign({ user: req.user }, 'JMANDJM-CHN201AM1');
    res.send({
      message: 'Signup successful',
      user: req.user,
      token:token
      
    });
}