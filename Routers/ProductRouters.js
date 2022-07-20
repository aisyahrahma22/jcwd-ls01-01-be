const { Route } = require('express');
const express = require('express');
const Router = express.Router();
const ProductController = require('../Controllers/ProductController');
const jwtVerify = require('../Middleware/JWT');

Router.get('/totalproductsnum', ProductController.getTotalProductsNum);
Router.get('/productcards', ProductController.getProductCards);
Router.post('/uploadresep', jwtVerify, ProductController.addResep);
Router.get('/productdetail', ProductController.getProductDetail);
Router.get('/relatedproducts', ProductController.getRelatedProducts);
Router.get('/searchproducts', ProductController.searchProducts);
Router.get('/diskon', ProductController.diskon);
Router.get('/homeproduk', ProductController.getHomeProduk);
Router.get('/getresep', jwtVerify, ProductController.getResep);
Router.delete('/deleteresep', jwtVerify, ProductController.deleteResep);

module.exports = Router;
