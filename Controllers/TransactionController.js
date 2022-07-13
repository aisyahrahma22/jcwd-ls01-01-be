const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const { uploader } = require('../Helpers/Uploader');

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
            harga, diskon, gambar, stok, keluhan_id AS keluhanId, golonganObat_id AS golonganObatId
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
            harga, diskon, gambar, berat FROM produk WHERE id = ?`
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

    getMaxId: async(req,res) => {
        try {
            const query1 = `SELECT MAX(id) AS maxId FROM transaksi;`
            let maxId = await query(query1)
            res.status(200).send(maxId)
        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },

    addNewTransaction: async (req,res) => {
        try {
            const {
                noPemesanan,labelAlamat,namaDepan,namaBelakang,noHp,idProvinsi,
                provinsi,idKabupaten_kota,kabupatenKota,alamat,kodePos,totalPembayaran,
                kurir,ongkir,MetodePembayaranId
            } = req.body.dataTransaksi
            const products = req.body.products
            const userId = req.dataToken.id 

            const query1 = `INSERT INTO transaksi (no_pemesanan, label_alamat, nama_depan_penerima,
                nama_belakang_penerima, no_hp, id_provinsi, provinsi, id_kabupaten_kota,
                kabupaten_kota, alamat, kode_pos, total_pembayaran, kurir, ongkir, MetodePembayaran_id, User_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
            await query(query1, [noPemesanan,labelAlamat,namaDepan,namaBelakang,
            noHp,idProvinsi,provinsi,idKabupaten_kota,kabupatenKota,alamat,kodePos,totalPembayaran,
            kurir,ongkir,MetodePembayaranId,userId])
            
            const query2 = `SELECT MAX(id) AS id FROM transaksi WHERE User_id = ?;`
            let transactionId = await query(query2, userId)

            const query3 = `INSERT INTO detailtransaksi (nama_produk, harga_produk,
                gambar_produk, quantity, satuan_produk, Produk_id, Transaksi_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)`
            products.forEach(p => {
                query(query3, [p.namaObat, p.harga, p.gambar, p.quantity, p.satuanObat, p.produkId, transactionId[0].id])
            });
            res.status(200).send({error: false, message:'Success!'})
        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },

    getPaymentDetails: async(req,res) => {
        try {
            const id = req.query.transactionid
            
            const query1 = `SELECT created_at AS createdAt, total_pembayaran AS totalPembayaran, 
            MetodePembayaran_id FROM transaksi WHERE id = ?;`
            const transaction = await query(query1, id)

            const query2 = `SELECT id, nama_produk AS nama, harga_produk AS harga,
            quantity, gambar_produk AS gambar, satuan_produk AS satuan FROM detailtransaksi WHERE Transaksi_id = ?`
            const products = await query(query2, id)
            
            const query3 = `SELECT * FROM metodepembayaran WHERE id = ?`
            const metodePembayaran = await query(query3, transaction[0].MetodePembayaran_id)
            
            res.status(200).send({transaction: transaction[0], products, metodePembayaran: metodePembayaran[0]})
        } catch (error) {
            res.status(500).send({
                status: 500,
                error: true,
                message: error.message
            })
        }
    },

    uploadPaymentProof: (req, res) => {
    const path = 'Public/buktipembayaran';
    const upload = uploader(path, 'PROOF').fields([{ name: 'image' }]);

    upload(req, res, (err) => {
        if (err) {
        return res.status(500).json({ message: 'Image upload failed!', error: err.message });
        }
        const { image } = req.files;
        const imagePath = image ? path + '/' + image[0].filename : null;
        const data = JSON.parse(req.body.data);
        try {
            const query1 = `UPDATE transaksi SET bukti_pembayaran = ? WHERE id = ?;`
            db.query(query1, [imagePath, data.id], (err, result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            return res.status(200).send({error: false, message:'Success!'})
        })   
            
        } catch (err) {
            console.log(err.message);
            return res.status(500).json({ message: 'Server Error', error: err });
        }
    });
    },
    getSemuaPesananUser: (req,res) => {
        const id = req.dataToken.id 
        var sql = `SELECT transaksi.*, statustransaksi.status_transaksi FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id WHERE transaksi.User_id = ${id}`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            var sql2 = `SELECT detailtransaksi.*, transaksi.User_id, transaksi.statusTransaksi_id FROM detailtransaksi JOIN transaksi ON detailtransaksi.Transaksi_id = transaksi.id WHERE transaksi.User_id = ${id}`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                console.log(result2)
                return res.status(200).json({
                    transaksi: result,
                    detailtransaksi: result2
                })
            })
        })
    },
    getMenungguPesananUser: (req,res) => {
        const id = req.dataToken.id 
        var sql = `SELECT transaksi.*, statustransaksi.status_transaksi FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id WHERE transaksi.User_id = ${id} AND transaksi.statusTransaksi_id = 1 or transaksi.statusTransaksi_id = 2 or transaksi.statusTransaksi_id = 3`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            var sql2 = `SELECT detailtransaksi.*, transaksi.User_id, transaksi.statusTransaksi_id FROM detailtransaksi JOIN transaksi ON detailtransaksi.Transaksi_id = transaksi.id WHERE transaksi.User_id  = ${id} AND transaksi.statusTransaksi_id = 1 or transaksi.statusTransaksi_id = 2 or transaksi.statusTransaksi_id = 3`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                console.log(result2)
                return res.status(200).json({
                    transaksi: result,
                    detailtransaksi: result2
                })
            })
        })
    },
    getPesananDiprosesUser: (req,res) => {
        const id = req.dataToken.id 
        var sql = `SELECT transaksi.*, statustransaksi.status_transaksi FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id WHERE transaksi.User_id = ${id} AND transaksi.statusTransaksi_id = 4`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            var sql2 = `SELECT detailtransaksi.*, transaksi.User_id, transaksi.statusTransaksi_id FROM detailtransaksi JOIN transaksi ON detailtransaksi.Transaksi_id = transaksi.id WHERE transaksi.User_id  = ${id} AND transaksi.statusTransaksi_id = 4`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                console.log(result2)
                return res.status(200).json({
                    transaksi: result,
                    detailtransaksi: result2
                })
            })
        })
    },
    getPesananDikirimUser: (req,res) => {
        const id = req.dataToken.id 
        var sql = `SELECT transaksi.*, statustransaksi.status_transaksi FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id WHERE transaksi.User_id = ${id} AND transaksi.statusTransaksi_id = 5`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            var sql2 = `SELECT detailtransaksi.*, transaksi.User_id, transaksi.statusTransaksi_id FROM detailtransaksi JOIN transaksi ON detailtransaksi.Transaksi_id = transaksi.id WHERE transaksi.User_id  = ${id} AND transaksi.statusTransaksi_id = 5`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                console.log(result2)
                return res.status(200).json({
                    transaksi: result,
                    detailtransaksi: result2
                })
            })
        })
    },
    getPesananSelesaiUser: (req,res) => {
        const id = req.dataToken.id 
        var sql = `SELECT transaksi.*, statustransaksi.status_transaksi FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id WHERE transaksi.User_id = ${id} AND transaksi.statusTransaksi_id = 6`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            var sql2 = `SELECT detailtransaksi.*, transaksi.User_id, transaksi.statusTransaksi_id FROM detailtransaksi JOIN transaksi ON detailtransaksi.Transaksi_id = transaksi.id WHERE transaksi.User_id  = ${id} AND transaksi.statusTransaksi_id = 6`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                console.log(result2)
                return res.status(200).json({
                    transaksi: result,
                    detailtransaksi: result2
                })
            })
        })
    },
    getPesananDibatalkanUser: (req,res) => {
        const id = req.dataToken.id 
        var sql = `SELECT transaksi.*, statustransaksi.status_transaksi FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id WHERE transaksi.User_id = ${id} AND transaksi.statusTransaksi_id = 7`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            var sql2 = `SELECT detailtransaksi.*, transaksi.User_id, transaksi.statusTransaksi_id FROM detailtransaksi JOIN transaksi ON detailtransaksi.Transaksi_id = transaksi.id WHERE transaksi.User_id  = ${id} AND transaksi.statusTransaksi_id = 7`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                console.log(result2)
                return res.status(200).json({
                    transaksi: result,
                    detailtransaksi: result2
                })
            })
        })
    },
}