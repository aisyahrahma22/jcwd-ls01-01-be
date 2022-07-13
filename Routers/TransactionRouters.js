const express = require('express');
const Router = express.Router();
const TransactionController = require('../Controllers/TransactionController');
const jwtVerify = require('../Middleware/JWT');

Router.post('/addtocart', jwtVerify, TransactionController.addToCart);
Router.get('/getcart', jwtVerify, TransactionController.getCart)
Router.patch('/editquantity', jwtVerify, TransactionController.editQuantity)
Router.patch('/editselected', jwtVerify, TransactionController.editSelected)
Router.patch('/selectall', jwtVerify, TransactionController.selectAll)
Router.delete('/deleteproduct', jwtVerify, TransactionController.deleteProduct)
Router.get('/getcheckoutdata', jwtVerify, TransactionController.getCheckoutData)
Router.get('/getpaymentmethod', jwtVerify, TransactionController.getPaymentMethod)
Router.get('/getmaxid', TransactionController.getMaxId)
Router.post('/addnewtransaction', jwtVerify, TransactionController.addNewTransaction)
Router.get('/getpaymentdetails', jwtVerify, TransactionController.getPaymentDetails)
Router.patch('/uploadpaymentproof', jwtVerify, TransactionController.uploadPaymentProof);
Router.get('/getsemuapesanan', jwtVerify, TransactionController.getSemuaPesananUser);
Router.get('/getmenunggupesanan', jwtVerify, TransactionController.getMenungguPesananUser);
Router.get('/getdiprosespesanan', jwtVerify, TransactionController.getPesananDiprosesUser);
Router.get('/getdikirimpesanan', jwtVerify, TransactionController.getPesananDikirimUser);
Router.get('/getselesaipesanan', jwtVerify, TransactionController.getPesananSelesaiUser);
Router.get('/getdibatalkanpesanan', jwtVerify, TransactionController.getPesananDibatalkanUser);

// set transaksi
// set detail transaksi
// kurangin stok + log di admin setelah bukti pembayaran dikonfirmasi
module.exports = Router;