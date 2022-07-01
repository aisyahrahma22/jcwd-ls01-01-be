const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);

module.exports = {
    getTotalProductsNum: (req,res) => {
        var query = `SELECT COUNT(*) as countProducts FROM produk;`
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
                LIMIT ${startIndex},${limit};`
            }
            if(sortBy == 'ZA'){
                query1 = `${defaultQuery}
                ORDER BY namaObat DESC
                LIMIT ${startIndex},${limit};`
            }
            if(sortBy == 'hargaTerendah'){
                query1 = `${defaultQuery}
                ORDER BY harga ASC
                LIMIT ${startIndex},${limit};`
            }
            if(sortBy == 'hargaTertinggi'){
                query1 = `${defaultQuery} 
                ORDER BY harga DESC
                LIMIT ${startIndex},${limit};`
            }
            const products = await query(query1)

            let query2 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`
                for (let i = 0; i < products.length; i++) {
                    let satuan = await query(query2, products[i].satuanObatId)
                    products[i] = { ...products[i], satuanObat: satuan[0].satuanObat}
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

    getProductDetail: async(req,res) => {
        try {
            const id = parseInt(req.query.id)
            
            let query1 = `SELECT id, nama_obat AS namaObat, butuh_resep AS butuhResep, harga, gambar, stok,
            indikasi, komposisi, kemasan, cara_penyimpanan AS caraPenyimpanan,
            principal, nie, cara_pakai AS caraPakai, peringatan, Keluhan_id AS keluhanId,
            KategoriObat_id AS kategoriObatId, SatuanObat_id AS satuanObatId, GolonganObat_id AS golonganObatId
            FROM produk WHERE id = ?`

            let productArr = await query(query1, id)
            let product = productArr[0]

            let query2 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`
            let satuan = await query(query2, product.satuanObatId)
            product = { ...product, satuanObat: satuan[0].satuanObat}

            let query3 = `SELECT golongan_obat AS golonganObat FROM golonganobat WHERE id = ?`
            let golongan = await query(query3, product.golonganObatId)
            product = { ...product, golonganObat: golongan[0].golonganObat}

            let query4 = `SELECT kategori_obat AS kategoriObat FROM kategoriobat WHERE id = ?`
            let kategori = await query(query4, product.kategoriObatId)
            product = { ...product, kategoriObat: kategori[0].kategoriObat}

            res.status(200).send(product)

        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },

    getRelatedProducts: async(req,res) => {
        try {
            const id = parseInt(req.query.id)
            const keluhanId = parseInt(req.query.keluhanid)
            const golonganObatId = parseInt(req.query.golonganobatid)
            
            const query1 = `SELECT id, nama_obat AS namaObat,
            butuh_resep AS butuhResep, harga, gambar, stok,
            SatuanObat_id AS satuanObatId
            FROM produk WHERE keluhan_id = ? 
            AND NOT id = ? LIMIT 0,5`

            let products = await query(query1, [keluhanId, id])

            if(products.length < 5){
                const limit = 5 - products.length
                const query2 = `SELECT id, nama_obat AS namaObat,
                butuh_resep AS butuhResep, harga, gambar, stok,
                SatuanObat_id AS satuanObatId
                FROM produk WHERE golonganobat_id = ? 
                AND NOT id = ? LIMIT 0,${limit}`

                const moreProducts = await query(query2, [golonganObatId, id])
                products = [...products, ...moreProducts]
            }
            console.log(products)
           
            const query3 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`
            for (let i = 0; i < products.length; i++) {
                let satuan = await query(query3, products[i].satuanObatId)
                products[i] = { ...products[i], satuanObat: satuan[0].satuanObat}
            }
            
            res.status(200).send(products)

        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    }
};
