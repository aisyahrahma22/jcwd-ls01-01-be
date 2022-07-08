const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);

module.exports = {
    addToCart: async(req,res) => {
        try {
            const userId = req.dataToken.id 
            const productId = req.body.productId
            const quantity = req.body.quantity

            const query1 = `SELECT COUNT(*) produk_id FROM keranjang WHERE user_id = ? AND produk_id = ?;`
            const productExists = await query(query1, [userId, productId])

            if(productExists[0].produk_id === 0){
                const query2 = `INSERT INTO keranjang (User_id, Produk_id, quantity, selected) VALUES (?, ?, ?, ?);`
                db.query(query2, [userId, productId, quantity, 0], (err, result) => {
                    if(err) return res.status(500).send({ message: 'Error!', error: err})
                    return res.status(200).send({error: false, message:'Success!'})
                })   
            } else {
                const query3 = `SELECT quantity FROM keranjang WHERE User_id = ? AND Produk_id = ?;`
                const quantityKeranjang = await query(query3, [userId, productId])

                const query4 = `UPDATE keranjang SET quantity = ? WHERE User_id = ? AND Produk_id = ?;`
                db.query(query4, [quantity+quantityKeranjang[0].quantity, userId, productId], (err, result) => {
                    if(err) return res.status(500).send({ message: 'Error!', error: err})
                    return res.status(200).send({error: false, message:'Success!'})
                })   
            }
        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },

    getCart: async(req,res) => {
        try {
            const id = req.dataToken.id 
            
            const query1 = `SELECT id, produk_id AS produkId, quantity, selected
            FROM keranjang WHERE user_id = ?`

            let products = await query(query1, id)

            const query2 = `SELECT nama_obat AS namaObat, satuanObat_id AS satuanObatId,
            harga, gambar, stok, keluhan_id AS keluhanId, golonganObat_id AS golonganObatId
            FROM produk WHERE id = ?`
            for (let i = 0; i < products.length; i++) {
                let detail = await query(query2, products[i].produkId)
                products[i] = { ...products[i], ...detail[0]}
            }
            
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
    },

    editQuantity: (req,res) => {
        const userId = req.dataToken.id 
        const productId = req.body.productId
        const quantity = req.body.quantity

        const query1 = `UPDATE keranjang SET quantity = ? WHERE User_id = ? AND Produk_id = ?;`
        db.query(query1, [quantity, userId, productId], (err, result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            return res.status(200).send({error: false, message:'Success!'})
        })   
    },

    editSelected: (req,res) => {
        const userId = req.dataToken.id 
        const productId = req.body.productId
        const selected = req.body.selected

        const query1 = `UPDATE keranjang SET selected = ? WHERE User_id = ? AND Produk_id = ?;`
        db.query(query1, [selected, userId, productId], (err, result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            return res.status(200).send({error: false, message:'Success!'})
        })   
    },

    selectAll: (req,res) => {
        const userId = req.dataToken.id 
        const productsId = req.body.productsId
        const selected = req.body.checkMark

        const query1 = `UPDATE keranjang SET selected = ? WHERE User_id = ? AND Produk_id = ?;`
        for(let i = 0; i < productsId.length; i++){
            db.query(query1, [selected, userId, productsId[i]], (err, result) => {
                if(err) return res.status(500).send({ message: 'Error!', error: err})
            })   
        }
        return res.status(200).send({error: false, message:'Success!'})
    },

    deleteProduct: (req,res) => {
        const userId = req.dataToken.id 
        const productId = req.query.produkId

        const query1 = `DELETE FROM keranjang WHERE User_id = ? AND Produk_id = ?;`
        db.query(query1, [userId, productId], (err, result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            return res.status(200).send({error: false, message:'Success!'})
        })   
    },

    getCheckoutData: async(req,res) => {
        try {
            const id = req.dataToken.id 
            
            const query1 = `SELECT id, produk_id AS produkId, quantity, selected
            FROM keranjang WHERE user_id = ? AND selected = 1`
            let products = await query(query1, id)

            const query2 = `SELECT nama_obat AS namaObat, satuanObat_id AS satuanObatId,
            harga, gambar, berat FROM produk WHERE id = ?`
            for (let i = 0; i < products.length; i++) {
                let detail = await query(query2, products[i].produkId)
                products[i] = { ...products[i], ...detail[0]}
            }
            
            const query3 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`
            for (let i = 0; i < products.length; i++) {
                let satuan = await query(query3, products[i].satuanObatId)
                products[i] = { ...products[i], satuanObat: satuan[0].satuanObat}
            }

            const query4 = `SELECT * from alamat WHERE user_id = ?`
            let alamat = await query(query4, id)

            res.status(200).send({products, alamat})
        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },

    getPaymentMethod: async(req,res) => {
        try {
            const query1 = `SELECT * FROM metodepembayaran`
            let payment = await query(query1)
            res.status(200).send(payment)
        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },
}