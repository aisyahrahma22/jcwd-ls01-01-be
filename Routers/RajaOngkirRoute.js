const express = require('express');
const rajaOngkirController = require('../Controllers/rajaOngkirController.js');
const Router = express.Router();

Router.get('/getProvince', rajaOngkirController.getProvince);
Router.get('/getCity', rajaOngkirController.getCity);
Router.get('/getCost', rajaOngkirController.getCost);

module.exports = Router;
