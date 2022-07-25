const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);

var url = 'https://api.rajaongkir.com/starter';
const key = 'f7e960f8b1d392519e77eb69c2d44a47';
const axios = require('axios');

module.exports = {
  getProvince: (req, res) => {
    axios
      .get(`${url}/province?key=${key}`)
      .then((response) => {
        res.send({
          error: false,
          massage: 'get data province success',
          data: response.data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  getCity: (req, res) => {
    axios
      .get(`${url}/city?province=${req.headers.provinceid}&key=${key}`)
      .then((response) => {
        res.send({
          error: false,
          massage: 'get data kota success',
          data: response.data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  getCost: async (req, res) => {
    try {
      const city = req.headers.kota;
      const berat = req.headers.berat;

      let query1 = {
        key: 'f7e960f8b1d392519e77eb69c2d44a47',
        origin: '152',
        destination: city,
        weight: berat,
        courier: 'jne',
      };
      let query2 = {
        key: 'f7e960f8b1d392519e77eb69c2d44a47',
        origin: '152',
        destination: city,
        weight: berat,
        courier: 'pos',
      };
      let query3 = {
        key: 'f7e960f8b1d392519e77eb69c2d44a47',
        origin: '152',
        destination: city,
        weight: berat,
        courier: 'tiki',
      };
      let dataOngkir = { jne: [], pos: [], tiki: [] };

      await axios
        .post(`https://api.rajaongkir.com/starter/cost`, query1)
        .then((response) => {
          response.data.rajaongkir.results[0].costs.forEach((element) => {
            dataOngkir.jne.push(element);
          });
          node;
        })
        .catch((err) => {
          console.log(err.massage);
        });
      await axios
        .post(`https://api.rajaongkir.com/starter/cost`, query2)
        .then((response) => {
          response.data.rajaongkir.results[0].costs.forEach((element) => {
            dataOngkir.pos.push(element);
          });
        })
        .catch((err) => {
          console.log(err.massage);
        });
      await axios
        .post(`https://api.rajaongkir.com/starter/cost`, query3)
        .then((response) => {
          response.data.rajaongkir.results[0].costs.forEach((element) => {
            dataOngkir.tiki.push(element);
          });
        })
        .catch((err) => {
          console.log(err.massage);
        });
      res.status(200).send({
        error: false,
        dataOngkir,
      });
    } catch (error) {
      res.status(500).send({
        status: 500,
        error: true,
        message: error.message,
      });
    }
  },
};
