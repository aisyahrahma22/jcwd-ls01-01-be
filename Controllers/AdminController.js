const db = require('./../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const { uploader } = require('../Helpers/Uploader');

// Import Validator
const validator = require('validator');

// Import Crypto
const crypto = require('crypto');

// Import Transporter Nodemailer
const transporter = require('./../Helpers/Transporter');

const fs = require('fs');
const handlebars = require('handlebars');

// Import JWT Token
const jwt = require('jsonwebtoken');
const { assign } = require('nodemailer/lib/shared');

module.exports = {
  login: (req, res) => {
    try {
      const data = req.body;

      if (!data.usernameOrEmail || !data.password) throw { message: 'Data incomplete!' };

      if (data.usernameOrEmail.includes('@')) {
        db.query('SELECT * FROM admin WHERE email = ?', [data.usernameOrEmail], (err, result) => {
          try {
            if (err) throw error;

            if (result.length === 1) {
              if (data.password == result[0].password) {
                jwt.sign({ id: result[0].id }, '123abc', (err, token) => {
                  try {
                    if (err) throw err;

                    console.log('ini token with email', token);
                    res.status(200).json({
                      token: token,
                      id: result[0].id,
                    });
                  } catch (error) {
                    res.status(500).send({
                      error: true,
                      message: error.message,
                    });
                  }
                });
              } else {
                res.status(400).send({
                  error: true,
                  message: 'Incorrect password',
                });
              }
            } else {
              res.status(400).send({
                error: true,
                message: 'Account not found',
              });
            }
          } catch (error) {
            res.status(500).send({
              error: true,
              message: error.message,
            });
          }
        });
      } else {
        db.query('SELECT * FROM admin WHERE username = ?', [data.usernameOrEmail], (err, result) => {
          try {
            if (err) throw error;
            if (result.length === 1) {
              if (data.password == result[0].password) {
                jwt.sign({ id: result[0].id }, '123abc', (err, token) => {
                  try {
                    if (err) throw err;
                    console.log('ini token with username', token);
                    res.status(200).json({
                      token: token,
                      id: result[0].id,
                    });
                  } catch (error) {
                    res.status(500).send({
                      error: true,
                      message: error.message,
                    });
                  }
                });
              } else {
                res.status(400).send({
                  error: true,
                  message: 'Incorrect password',
                });
              }
            } else {
              res.status(400).send({
                error: true,
                message: 'Account not found',
              });
            }
          } catch (error) {
            res.status(500).send({
              error: true,
              message: error.message,
            });
          }
        });
      }
    } catch (error) {
      res.status(500).send({
        error: true,
        message: error.message,
      });
    }
  },

  getDataProduct: async (req, res) => {
    try {
      const query1 = 'SELECT id, nama_obat AS namaObat,id AS nomorObat, NIE, stok, nilai_barang AS nilaiBarang, harga AS nilaiJual, SatuanObat_id, GolonganObat_id  FROM produk';
      const products = await query(query1);

      let query2 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`;
      for (let i = 0; i < products.length; i++) {
        let satuan = await query(query2, products[i].SatuanObat_id);
        products[i] = { ...products[i], satuanObat: satuan[0].satuanObat };
      }
      let query3 = `SELECT golongan_obat AS golonganObat FROM golonganobat WHERE id = ?`;
      for (let i = 0; i < products.length; i++) {
        let Kategori = await query(query3, products[i].GolonganObat_id);
        products[i] = { ...products[i], Kategori: Kategori[0].golonganObat };
      }

      res.status(200).send(products);
    } catch (error) {
      console.log(error);
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const Id = req.params.id;

      const sql1 = 'DELETE FROM produk WHERE id = ?;';
      let sql1Result = await query(sql1, [Id]);

      res.status(200).send({
        data: sql1Result,
        error: false,
        message: 'Delete Product Success!',
      });
    } catch (error) {
      console.log(error.massage);
    }
  },
};
