const { Route } = require('express');
const express = require('express');
const Router = express.Router();

// Import Controller
const AdminController = require('../Controllers/AdminController');

// Import JWT Verify
const jwtVerify = require('../Middleware/JWT');


Router.get('/dataproduct', jwtVerify, AdminController.getDataProduct);
Router.delete('/deleteproduct/:id', jwtVerify, AdminController.deleteProduct);
Router.post('/loginadmin', AdminController.login) 
Router.get("/getprodukID",  jwtVerify, AdminController.getUnikIDProduct);
Router.get("/paginate",  jwtVerify, AdminController.pagination);
Router.post('/addproduct', jwtVerify, AdminController.addProduct) 
Router.patch('/editproduct', jwtVerify, AdminController.editProduct)
Router.get('/search', AdminController.search)


module.exports = Router;
