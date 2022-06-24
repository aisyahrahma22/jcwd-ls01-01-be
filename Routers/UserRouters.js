const { Route } = require('express');
const express = require('express');
const Router = express.Router();

const UserController = require('../Controllers/UserController');

const jwtVerify = require('../Middleware/JWT');

Router.post('/register', UserController.register);
Router.post('/login', UserController.login);
Router.get('/getoldpassword', jwtVerify, UserController.getOldPassword);
Router.post('/changepassword', jwtVerify, UserController.changePassword);

module.exports = Router;
