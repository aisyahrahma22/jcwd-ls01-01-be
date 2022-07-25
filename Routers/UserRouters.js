const { Route } = require('express');
const express = require('express');
const Router = express.Router();

const UserController = require('../Controllers/UserController');

const jwtVerify = require('../Middleware/JWT');

Router.post('/register', UserController.register);
Router.post('/login', UserController.login);
Router.post('/changepassword', jwtVerify, UserController.changePassword);
Router.patch('/confirmation', jwtVerify, UserController.verification);
Router.get('/checkuserverify', jwtVerify, UserController.checkUserVerify);
Router.post('/resend', jwtVerify, UserController.resend);
Router.patch('/editprofiledata', jwtVerify, UserController.editProfileData);
Router.get('/datauser', jwtVerify, UserController.getUsers);
Router.post('/resendpassword', UserController.resendPassword);
Router.patch('/resetpassword', jwtVerify, UserController.resetPassword);
Router.get('/getaddress', jwtVerify, UserController.getAddress);
Router.post('/addaddress', jwtVerify, UserController.addAddress);
Router.get('/gettokenuser', jwtVerify, UserController.getTokenUser);
Router.patch('/editalamat/:id', jwtVerify, UserController.editAlamat);
Router.get('/getalamatuser', jwtVerify, UserController.getAlamatUser);
Router.get('/getalamatuser2/:id', jwtVerify, UserController.getAlamatUser2);

module.exports = Router;
