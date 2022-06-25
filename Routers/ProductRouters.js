const { Route } = require('express');
const express = require('express');
const Router = express.Router();
const ProductController = require('../Controllers/ProductController');

Router.get('/totalproductsnum', ProductController.getTotalProductsNum);
Router.get('/productcards', ProductController.getProductCards);

module.exports = Router;