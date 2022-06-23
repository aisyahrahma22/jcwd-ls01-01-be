const { Route } = require('express')
const express = require('express')
const Router = express.Router()

const UserController = require('../Controllers/UserController')

const jwtVerify = require('../Middleware/JWT')

Router.patch('/verification', jwtVerify,  UserController.verification) 
Router.post('/checkuserverify', jwtVerify, UserController.checkUserVerify)
Router.post('/resend', jwtVerify, UserController.resend)


module.exports = Router