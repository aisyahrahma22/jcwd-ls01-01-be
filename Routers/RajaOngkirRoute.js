const express = require('express');
const rajaOngkirController = require('../Controllers/rajaOngkirController.js');
const Router = express.Router();

Router.get('/getProvince', rajaOngkirController.getProvince);
Router.get('/getCity', rajaOngkirController.getCity);

module.exports = Router;
