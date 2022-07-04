const express = require('express');
const Router = express.Router();
const TransactionController = require('../Controllers/TransactionController');
const jwtVerify = require('../Middleware/JWT');

Router.post('/addtocart', jwtVerify, TransactionController.addToCart);
Router.get('/getcart', jwtVerify, TransactionController.getCart)
Router.patch('/editquantity', jwtVerify, TransactionController.editQuantity)
Router.patch('/editselected', jwtVerify, TransactionController.editSelected)

module.exports = Router;