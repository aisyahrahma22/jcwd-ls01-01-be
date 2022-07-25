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
Router.get('/search', AdminController.search);
Router.get("/paginatestok/:id",  jwtVerify, AdminController.paginationStok);
Router.get("/gettokenadmin",  jwtVerify, AdminController.getTokenAdmin);
Router.get("/searchstok/:id",  AdminController.searchKartuStok);
Router.get("/gethomedata", jwtVerify, AdminController.getDashboardData);
Router.get('/transactioncount', jwtVerify, AdminController.transactionCount);
Router.get('/transactiondetail', jwtVerify, AdminController.transactionDetail);
Router.get('/searchtransactionnumber', jwtVerify, AdminController.searchTransactionNumber);
Router.get('/searchtransactionusername', jwtVerify, AdminController.searchTransactionUsername);
Router.patch('/canceltransaction', jwtVerify, AdminController.cancelTransaction);
Router.patch('/continuetransaction', jwtVerify, AdminController.continueTransaction);
Router.post('/salinresep', jwtVerify, AdminController.salinResep);
Router.post('/reducestock', jwtVerify, AdminController.reduceStock);

module.exports = Router;
