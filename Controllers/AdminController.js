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
                    var sql2 = `UPDATE admin SET token = ?  WHERE id = ?`
                    db.query(sql2,  [token, result[0].id], (err2,result2) => {
                      console.log('result2 login admin', result2)
                        if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                        var sql3 = `SELECT * FROM admin WHERE id = ${result[0].id} ;`
                        db.query(sql3, (err3,result3) => {
                          console.log('result3 login admin', result3)
                            if(err3) return res.status(500).send({ message: 'Error!', error: err3})
                             res.status(200).json({
                              id: result3[0].id,
                              username: result3[0].username,
                              email: result3[0].email,
                              token: result3[0].token,
                            });
                        }) 
                    })
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
                    console.log('token admin', token)
                  
                    var sql4 = `UPDATE admin SET token = ?  WHERE id = ?`
                    db.query(sql4,  [token, result[0].id], (err4,result4) => {
                      console.log('result4 login admin', result4)
                        if(err4) return res.status(500).send({ message: 'Error!', error: err4})
                        var sql5 = `SELECT * FROM admin WHERE id = ${result[0].id} ;`
                        db.query(sql5, (err5,result5) => {
                          console.log('result5 login admin', result5)
                            if(err5) return res.status(500).send({ message: 'Error!', error: err5})
                             res.status(200).json({
                              id: result5[0].id,
                              username: result5[0].username,
                              email: result5[0].email,
                              token: result5[0].token,
                            });
                        }) 
                    })
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
      console.log(Id)

      const sql1 = 'DELETE FROM produk WHERE id = ?;';
      let sql1Result = await query(sql1, [Id]);
      console.log('sql1Result', sql1Result)
      
      const sql2 = `Select produk.*, produk.id as nomerObat, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id ORDER BY produk.id;`
      let sql2Result = await query(sql2);
      console.log('sql2Result', sql2Result)

      res.status(200).send({
        deleteData: sql1Result,
        error: false,
        message: 'Delete Product Success!',
        data: sql2Result
      });
    } catch (error) {
      console.log(error.massage);
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
            console.log('data add data', data)

            if(data.nama_obat === "" || data.berat ==="" || data.NIE === "" || data.harga === "" ||  data.nilai_barang === "" ||  data.SatuaObat_id === "" ||  data.GolonganObat_id === "" ||  data.tempat_penyimpanan ==="" ||  data.expired ==="" || data.gambar === null){
              return res.status(500).json({ message: "Fill All Data", error: true }); 
            }
            
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
    console.log('ini produk_id', produk_id)
    var id = req.dataToken.id
    console.log('ini id', id)
    
    var sql = `SELECT * from produk where id = ${produk_id};`;
    db.query(sql, (err, results) => {
      console.log('results edit produk', results)
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
                console.log('ini data ', data )

                try {
                    if(imagePath) {
                        data.gambar = imagePath;   
                    }

                    console.log('data.stok', data.stok)
                    if(data.stok){
                        queryStok = `SELECT stok from produk where id = ${produk_id};`
                        db.query(queryStok, (err1, results1) => {
                            console.log('results1', results1[0].stok)
                            if(err1) {
                                return res.status(500).json({ message: "Server Error", error: err.message });
                            }

                            if(data.stok > results1[0].stok){
                                let newDataStokMasuk = data.stok - results1[0].stok
                                let sisa = results1[0].stok + newDataStokMasuk
                                console.log('newDataStokMasuk', newDataStokMasuk)
                                queryStokMasuk = `INSERT INTO detailstokproduk (keluar, aktivitas, masuk, Produk_id, admin_id, sisa) VALUES (0, "Penerimaan Barang", ${newDataStokMasuk}, ${produk_id}, ${id}, ${sisa});`
                                db.query(queryStokMasuk, (err2, results2) => {
                                    console.log('results2', results2)
                                    console.log('err2', err2)
                                    if(err2) {
                                        return res.status(500).json({ message: "Server Error", error: err.message });
                                    }

                                    queryGetStokMasuk = `Select * from detailstokproduk where detailstokproduk.Produk_id = ${produk_id}`;
                                    db.query(queryGetStokMasuk, (err3, results3) => {
                                        console.log('results3', results3)
                                        console.log('err3', err3)
                                        if(err3) {
                                            return res.status(500).json({ message: "Server Error", error: err.message });
                                        }
                                        
                                    })   
                                    
                                })   
                            }
                            
                        })   
                    }

                    sql = `Update produk set ? where id = ${produk_id};`
                    db.query(sql,data, (error1,results1) => {
                        if(error1) {
                            if(imagePath) {
                                fs.unlinkSync('./Public' + imagePath);
                            }
                            return res.status(500).json({ message: "Server Error", error: error1.message });
                        }

                        if(imagePath) {
                            fs.unlinkSync('' + results[0].gambar);
                        }

                        queryHasil = `SELECT * from produk where id = ${produk_id}`;
                        db.query(queryHasil, (error4, results4) => {
                            if(error4) {
                                return res.status(500).json({ message: "Server Error", error: error4.message });
                            }
                            
                            return res.status(200).send({ message: "Update Product Success", result: results4 });
                        })   
                    })
                }
                catch(errors){
                    console.log('errors.message', errors.message)
                    return res.status(500).json({ message: "Server Error", error: erros.message });
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

search: async(req, res) => {
  try {
   
    const data = parseInt(req.query.kategori)
    const nama = req.query.nama
       
     if(data || nama){
      db.query(`Select produk.*, produk.id as nomerObat, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id WHERE produk.nama_obat LIKE "%${nama}%" AND produk.GolonganObat_id = ${data};`, (err, result) => {
          try {
              if(err) throw err 
              
              res.status(200).send({
                  error: false, 
                  result: result
              })
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

paginationStok: async(req, res) => {
  try {
      var produkId = req.params.id;
      const page = parseInt(req.query.page)
      const limit = parseInt(req.query.limit)
      const start = (page - 1) * limit
      const end = page * limit

      let query1 = `SELECT detailstokproduk.*, admin.username, produk.expired, produk.nama_obat, produk.stok as stok_obat FROM detailstokproduk JOIN produk ON detailstokproduk.Produk_id=produk.id JOIN admin ON detailstokproduk.admin_id=admin.id WHERE detailstokproduk.Produk_id = ${produkId} LIMIT ${start},${limit};`
      const findStok = await query(query1, {
          limit: limit,
          offset: start
      })

      let query2 = `SELECT COUNT(detailstokproduk.id) as TotalData FROM detailstokproduk WHERE detailstokproduk.Produk_id = ${produkId};`
      const countStok = await query(query2)
      console.log('countStok', countStok[0].TotalData)

      let countFiltered = parseInt(countStok[0].TotalData)
      let pagination = {}
      pagination.totalRow = countStok
      pagination.totalPage = Math.ceil(countFiltered/limit)
      console.log('pagination.totalPage', pagination.totalPage)

      let query3 = `SELECT produk.nama_obat from produk WHERE produk.id = ${produkId};`
      const getProdukName = await query(query3)

      if(findStok.length == 0){
          throw { message: 'Produk Not Found' }
      }else {
          res.status(201).send({
              status: 201,
              error: false,
              message: 'Get Data Success',
              namaObat: getProdukName,
              pagination,
              data: findStok,
             
          })
      }
  } catch (error) {
      res.status(500).send({
          error: true, 
          message: error.message
      })
  }
}, 

getTokenAdmin: (req,res) => {
  const id = req.dataToken.id 
  var sql = `Select token from admin where id = ${id}`
  db.query(sql, (err,result) => {
      if(err) return res.status(500).send({ message: 'Error!', error: err})
      console.log(result)
      return res.status(200).json(result)
  })
},

}

