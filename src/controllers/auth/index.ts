import express, { Request, Response, NextFunction } from 'express'
const qs = require('querystring');
const fs = require('fs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const bcrypt = require('bcryptjs');
const localStrategy = require('passport-local').Strategy;
import UserModel from '../../models/user/index'
import ResetModel from '../../models/reset/index'
import { DateTime } from 'luxon';

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

var loginusers:Array<{username:string,path?:string,createdAt:Date}> = []
export const login = (req: Request, res: Response) => {
  const token = jwt.sign({ user: req.user }, 'JMANDJM-CHN201AM1');

  let i = loginusers.findIndex(el=>el.username===req.body.username)
  if(i==-1) loginusers.push({username:req.body.username, createdAt:new Date()})
  console.log("auth: added users...",loginusers)
  res.send({
    message: 'Signin successful',
    user: req.user,
    token: token
  });
}
export const logout = (req: Request, res: Response) => {
  let i = loginusers.findIndex(el=>el.username===req.body.username)
  loginusers.splice(i,1)
  res.send({
    message: 'Signout successful'
  });
}
export const keepAlive = (req: Request, res: Response) => {
  let i = loginusers.findIndex(el=>el.username===req.body.username)
  if(i==-1) loginusers.push({username:req.body.username, path:req.body.path, createdAt:new Date()})
  else loginusers[i].path = req.body.path
  res.send(loginusers);
}
export const updatePath = (req: Request, res: Response) => {
  let i = loginusers.findIndex(el=>el.username===req.body.username)
  if(i==-1&&req.body.username!='') loginusers.push({username:req.body.username, path:req.body.path, createdAt:new Date()})
  else loginusers[i].path = req.body.path
  res.send(loginusers);
}
export const getUser = (req: Request, res: Response) => {
  console.log("loginusers",loginusers)
  res.send(loginusers);
}
let clearUsers = () =>{
  loginusers.forEach((el,i)=>{
    let diff = DateTime.fromJSDate(el.createdAt).diffNow('minutes').minutes
    console.log(el.username,"diff",diff)
    if(diff<-3) loginusers.splice(i,1)
    else if(el.username=="") loginusers.splice(i,1)
  })
  console.log("auth: cleared users...",loginusers)
  setTimeout(() => {
    clearUsers()
  }, 1*1000*60);
}
clearUsers()


export const resetRequest = (req: Request, res: Response) => {
  let username = req.body.username
  let userId = req.body.userId
  let userEmail = req.body.email
  ResetModel.create({
    username,
    userId
  }).then((document: any) => {
    SendEmail(userId, document.uuid, userEmail)
    res.send({
      message: 'Reset Request Successfully',
      user: req.user,
    });
  })
}
export const resetSubmission = (req: Request, res: Response) => {
  //TODO: ตรวจสอบว่า รหัสใน url ตรงกับบน ฐานข้อมูล
  //TODO: ตรวจสอบว่า รหัสที่สร้างยังไม่ expire
  //TODO: บันทึกรหัสผ่านใหม่ให้ผู้ใช้
  let uuid = req.body.uuid
  let password = req.body.password
  ResetModel.findOne({uuid}).then(async (data:any)=>{
    const hash = await bcrypt.hash(password, 8);
    UserModel.updateOne({ username: data.username }, { password: hash }).then((data: any) => {
      res.send({
        message: 'Reset Request Successfully',
        data,
        user: req.user,
      });
    })
  })
}

let transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: "noreply@jmandjm.com",
    pass: "Gd8c5s4e*",
  }
});

let SendEmail = function (id: string, uuid: string, sendTo: string) {
  console.log("sending email to..." + sendTo)
  var mailOptions = {
    from: "รีเซ็ตรหัสผ่านของ อจน. <noreply@jmandjm.com>",
    to: sendTo,
    subject: 'อีเมล์อัตโนมัติจาก อจน.',
    html: `<h4> คุณสามารถคลิกที่ลิงค์ <a href="http://wma.jmandjm.com/reset/submit/${uuid}">รีเซ็ต</a> เพื่อรีเซ็ตรหัสผ่านได้ทันที <h4>`
  };
  transporter.sendMail(mailOptions, function (error: Error, info: any) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

var readHTMLFile = function (path: string, callback: Function) {
  fs.readFile(path, { encoding: 'utf-8' }, function (err: Error, html: string) {
    if (err) {
      throw err;
      callback(err);
    }
    else {
      callback(null, html);
    }
  });
};