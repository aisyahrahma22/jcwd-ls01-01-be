const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const transporter = require('../Helpers/Transporter');
const { uploader } = require('../Helpers/Uploader');
var fs = require('fs');

module.exports = {
  getTotalProductsNum: (req, res) => {
    var query = `SELECT COUNT(*) as countProducts FROM produk;`;
    db.query(query, (err, result) => {
      if (err) return res.status(500).send({ message: 'Error!', error: err });
      return res.status(200).send(result);
    });
  },

  getProductCards: async (req, res) => {
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const sortBy = req.query.sortby;
      const startIndex = (page - 1) * limit;

      const defaultQuery = `SELECT id, nama_obat AS namaObat,
            butuh_resep AS butuhResep, harga, gambar, stok,
            Keluhan_id AS keluhanId,
            KategoriObat_id AS kategoriObatId,
            SatuanObat_id AS satuanObatId,
            GolonganObat_id AS golonganObatId
            FROM produk`;

      var query1 = '';

      if (sortBy == 'AZ') {
        query1 = `${defaultQuery}
                ORDER BY namaObat ASC
                LIMIT ${startIndex},${limit};`;
      }
      if (sortBy == 'ZA') {
        query1 = `${defaultQuery}
                ORDER BY namaObat DESC
                LIMIT ${startIndex},${limit};`;
      }
      if (sortBy == 'hargaTerendah') {
        query1 = `${defaultQuery}
                ORDER BY harga ASC
                LIMIT ${startIndex},${limit};`;
      }
      if (sortBy == 'hargaTertinggi') {
        query1 = `${defaultQuery} 
                ORDER BY harga DESC
                LIMIT ${startIndex},${limit};`;
      }
      const products = await query(query1);
      console.log(products);

      let query2 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`;
      for (let i = 0; i < products.length; i++) {
        let satuan = await query(query2, products[i].satuanObatId);
        products[i] = { ...products[i], satuanObat: satuan[0].satuanObat };
      }

      res.status(200).send(products);
    } catch (error) {
      res.status(500).send({
        status: 500,
        error: true,
        message: error.message,
      });
    }
  },
  addResep: (req, res) => {
    try {
      const path = 'Public/resep';
      const upload = uploader(path, 'RESEP').fields([{ name: 'image' }]);
      const id = req.dataToken.id;

      upload(req, res, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Uplous Resep failed !', error: err.message });
        }
        const { image } = req.files;
        const imagePath = image ? path + '/' + image[0].filename : null;

        var sql = `INSERT INTO resep (gambar_resep, User_id) VALUES ('${imagePath}', '${id}');`;
        db.query(sql, (err, results) => {
          console.log('ini results', results);
          console.log('ini err', err);
          if (err) {
            return res.status(500).json({ message: 'Server Error', error: err.message });
          }

          sql = `SELECT * from resep where User_id = ${id};`;
          db.query(sql, id, (err2, results2) => {
            console.log('ini results2', results2);
            if (err2) {
              return res.status(500).json({ message: 'Server Error', error: err.message });
            }

            return res.status(200).send(results2);
          });
        });
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },
};
