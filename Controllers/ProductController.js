const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const transporter = require('../Helpers/Transporter');

module.exports = {
    getTotalProductsNum: (req,res) => {
        var query = `SELECT COUNT(*) as countProducts FROM produk;`;
        db.query(query, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            return res.status(200).send(result)
        })
    },

    getProductCards: async(req,res) => {
        try {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const sortBy = req.query.sortby
            const startIndex = (page - 1) * limit
            
            const defaultQuery = `SELECT id, nama_obat AS namaObat,
            butuh_resep AS butuhResep, harga, gambar, stok,
            Keluhan_id AS keluhanId,
            KategoriObat_id AS kategoriObatId,
            SatuanObat_id AS satuanObatId,
            GolonganObat_id AS golonganObatId
            FROM produk`

            var query1 = ''

            if(sortBy == 'AZ'){
                query1 = `${defaultQuery}
                ORDER BY namaObat ASC
                LIMIT ${startIndex},${limit};`;
            }
            if(sortBy == 'ZA'){
                query1 = `${defaultQuery}
                ORDER BY namaObat DESC
                LIMIT ${startIndex},${limit};`;
            }
            if(sortBy == 'hargaTerendah'){
                query1 = `${defaultQuery}
                ORDER BY harga ASC
                LIMIT ${startIndex},${limit};`;
            }
            if(sortBy == 'hargaTertinggi'){
                query1 = `${defaultQuery} 
                ORDER BY harga DESC
                LIMIT ${startIndex},${limit};`;
            }
            const products = await query(query1)
            console.log(products)

            let query2 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`;
                for (let i = 0; i < products.length; i++) {
                    let satuan = await query(query2, products[i].satuanObatId);
                    products[i] = { ...products[i], satuanObat: satuan[0].satuanObat};
                }

            res.status(200).send(products)

        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },
};
