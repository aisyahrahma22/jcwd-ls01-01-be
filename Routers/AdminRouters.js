const { Route } = require('express');
const express = require('express');
const Router = express.Router();

// Import Controller
const AdminController = require('../Controllers/AdminController');

// Import JWT Verify
const jwtVerify = require('../Middleware/JWT');

Router.post('/loginadmin', AdminController.login);
Router.get('/dataproduct', AdminController.getDataProduct);
Router.delete('/deleteproduct/:id', AdminController.deleteProduct);

module.exports = Router;
