const { Route } = require('express')
const express = require('express')
const Router = express.Router()

const UserController = require('../Controllers/UserController')

const jwtVerify = require('../Middleware/JWT')


module.exports = Router