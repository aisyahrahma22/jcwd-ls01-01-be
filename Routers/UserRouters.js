const { Route } = require('express');
const express = require('express');
const Router = express.Router();

const UserController = require('../Controllers/UserController');

const jwtVerify = require('../Middleware/JWT');

Router.post('/register', UserController.register);
Router.post('/login', UserController.login);
Router.post('/changepassword', jwtVerify, UserController.changePassword);
Router.patch('/confirmation', jwtVerify, UserController.verification);
Router.post('/checkuserverify', jwtVerify, UserController.checkUserVerify);
Router.post('/resend', jwtVerify, UserController.resend);
Router.patch('/editprofiledata', jwtVerify, UserController.editProfileData);
Router.get('/datauser', jwtVerify, UserController.getUsers);
Router.post('/resendpassword', UserController.resendPassword);
Router.patch('/resetpassword', jwtVerify, UserController.resetPassword);

module.exports = Router;
