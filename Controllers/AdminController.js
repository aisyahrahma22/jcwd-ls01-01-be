const db = require('./../Connection/Connection');
const util = require('util')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')

// Import Validator
const validator = require('validator')

// Import Crypto 
const crypto = require('crypto')

// Import Transporter Nodemailer
const transporter = require('./../Helpers/Transporter')

const fs = require('fs')
const handlebars = require('handlebars')

// Import JWT Token
const jwt = require('jsonwebtoken')


module.exports = {
    login: (req, res) => {
        try {
            const data = req.body 

            if(!data.usernameOrEmail || !data.password) throw { message: 'Data incomplete!' }

            if(data.usernameOrEmail.includes('@')) {
            db.query('SELECT * FROM admin WHERE email = ?', [data.usernameOrEmail], (err, result) => {
                try {
                    if(err) throw error

                    if(result.length === 1){
                        if (data.password == result[0].password) {
                            jwt.sign({id: result[0].id}, '123abc', (err, token) => {
                                try {
                                    if(err) throw err

                                    console.log('ini token with email', token)
                                    res.status(200).json({
                                        token: token,
                                        id: result[0].id
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } else {
                            res.status(400).send({
                                error: true, 
                                message: "Incorrect password",
                            });
                          }
                    }else{
                        res.status(400).send({
                            error: true, 
                            message: 'Account not found'
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        } else {
            db.query('SELECT * FROM admin WHERE username = ?', [data.usernameOrEmail], (err, result) => {
                try {
                    if(err) throw error
                    if(result.length === 1){
                        if (data.password == result[0].password) {
                            jwt.sign({id: result[0].id}, '123abc', (err, token) => {
                                try {
                                    if(err) throw err
                                    console.log('ini token with username', token)
                                    res.status(200).json({
                                        token: token,
                                        id: result[0].id
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } else {
                            res.status(400).send({
                                error: true, 
                                message: "Incorrect password",
                            });
                          }
                    }else{
                        res.status(400).send({
                            error: true, 
                            message: 'Account not found'
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    },

    addProduct: (req,res) => {
        try {
            const path = 'Public/produk/images'; 
            const upload = uploader(path, 'PRODUK').fields([{ name: 'gambar'}]);
            const id = req.dataToken.id
            console.log('ini id', id)
            upload(req, res, (err) => {
                if(err){
                    return res.status(500).json({ message: 'Add Image Product failed !', error: err.message });
                }
                const { gambar } = req.files;
                const imagePath = gambar ? path + '/' + gambar[0].filename : null;
                const data = JSON.parse(req.body.data);
                data.gambar = imagePath;
            
                
                var sql = 'INSERT INTO produk SET ?';
                db.query(sql, data, (err, results) => {
                    console.log('ini results', results)
                    if(err) {
                        fs.unlinkSync('' + imagePath);
                        return res.status(500).json({ message: "Server Error", error: err.message });
                    } 
                
                    sql = `SELECT * from produk`;
                    db.query(sql, (err, results) => {
                        if(err) {
                            return res.status(500).json({ message: "Server Error", error: err.message });
                        }
                        
                        return res.status(200).send({ message: "Add Product Success", error: false, results: results });
                    })   
                })    
            })
        } catch(err) {
            return res.status(500).json({ message: "Server Error", error: err.message });
        }
    },
    editProduct: (req,res) => {
        var produk_id = parseInt(req.query.id);
        var id = req.dataToken.id
        
        var sql = `SELECT * from produk where id = ${produk_id};`;
        db.query(sql, (err, results) => {
            if(err) throw err;
            if(results.length > 0) {
                const path = 'Public/produk/images'; 
                const upload = uploader(path, 'PRODUK').fields([{ name: 'gambar'}]);
    
                upload(req, res, (err) => {
                    if(err){
                        return res.status(500).json({ message: 'Update Product Image Failed !', error: err.message });
                    }
    
                    const { gambar } = req.files;
                    const imagePath = gambar ? path + '/' + gambar[0].filename : null;
                    const data = JSON.parse(req.body.data);
    
                    try {
                        if(imagePath) {
                            data.gambar = imagePath;   
                        }
                        sql = `Update produk set ? where id = ${produk_id};`
                        db.query(sql,data, (err1,results1) => {
                            if(err1) {
                                if(imagePath) {
                                    fs.unlinkSync('./Public' + imagePath);
                                }
                                return res.status(500).json({ message: "Server Error", error: err1.message });
                            }

                            if(imagePath) {
                                fs.unlinkSync('' + results[0].gambar);
                            }

                            queryHasil = `SELECT * from produk where id = ${produk_id}`;
                            db.query(queryHasil, (err4, results4) => {
                                if(err4) {
                                    return res.status(500).json({ message: "Server Error", error: err.message });
                                }
                                
                                return res.status(200).send({ message: "Update Product Success", result: results4 });
                            })   
                        })
                    }
                    catch(err){
                        console.log(err.message)
                        return res.status(500).json({ message: "Server Error", error: err.message });
                    }
                })
            }
        })
    },
    
    getProduct: (req,res) => {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const startIndex = (page - 1) * limit
        const id = req.dataToken.id 
        var sql = `Select produk.*, produk.id as nomerObat, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id ORDER BY produk.id LIMIT ${startIndex},${limit};`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            var sql2 = 'SELECT COUNT(produk.id) as TotalData FROM produk;'
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                return res.status(200).json({
                    result1: result2,
                    result2: result
                })
            })
        })
    },

    getUnikIDProduct: (req,res) => {
        var produk_id = parseInt(req.query.id);
        const id = req.dataToken.id 
        var sql = `Select produk.*, produk.id as nomerObat, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id WHERE produk.id = ${produk_id}`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            console.log(result)
            return res.status(200).json(result)
        })
    },


    pagination: async(req, res) => {
        try {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const start = (page - 1) * limit
            const end = page * limit

            let query1 = `Select produk.*, produk.id as nomerObat, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id ORDER BY produk.id LIMIT ${start},${limit};`
            const findProduk = await query(query1, {
                attributes: [['id', 'id'], ['nama_obat', 'nama_obat']],
                order: [['id']],
                limit: limit,
                offset: start
            })

            let query2 = 'SELECT COUNT(produk.id) as TotalData FROM produk;'
            const countProduk = await query(query2)
            console.log('countProduk', countProduk[0].TotalData)

            let countFiltered = parseInt(countProduk[0].TotalData)
            let pagination = {}
            pagination.totalRow = countProduk
            pagination.totalPage = Math.ceil(countFiltered/limit)
            console.log('pagination.totalPage', pagination.totalPage)

            if (end < countFiltered){
                pagination.next = {
                    page : pagination.totalPage - page,
                    limit
                }
            }

            if (start > 0){
                pagination.prev = {
                    page : page - 1,
                    limit
                }
            }



            if(findProduk.length == 0){
                throw { message: 'Produk Not Found' }
            }else {
                res.status(201).send({
                    status: 201,
                    error: false,
                    message: 'Pagination Success',
                    pagination,
                    data: findProduk
                })
            }
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    }, 
    
}
