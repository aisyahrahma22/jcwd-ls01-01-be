const { Route } = require('express')
const express = require('express')
const Router = express.Router()

// Import Controller 
const AdminController = require('../Controllers/AdminController')

// Import JWT Verify
const jwtVerify = require('../Middleware/JWT')

Router.post('/loginadmin', AdminController.login) 

module.exports = Router