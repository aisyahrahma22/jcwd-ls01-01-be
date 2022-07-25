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
                     
                        if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                        var sql3 = `SELECT * FROM admin WHERE id = ${result[0].id} ;`
                        db.query(sql3, (err3,result3) => {
                         
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
                  message: 'Password Salah',
                });
              }
            } else {
              res.status(400).send({
                error: true,
                message: 'Email Tidak Ditemukan',
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
                    var sql4 = `UPDATE admin SET token = ?  WHERE id = ?`
                    db.query(sql4,  [token, result[0].id], (err4,result4) => {
                    
                        if(err4) return res.status(500).send({ message: 'Error!', error: err4})
                        var sql5 = `SELECT * FROM admin WHERE id = ${result[0].id} ;`
                        db.query(sql5, (err5,result5) => {
                         
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
                  message: 'Password Salah',
                });
              }
            } else {
              res.status(400).send({
                error: true,
                message: 'Username Tidak Ditemukan',
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
     
      var ProdukId = req.params.id;
      console.log('ini produk id',  ProdukId)

      const sql0 = `Select * FROM detailstokproduk WHERE Produk_id = ${ProdukId};`
      let sql0Result = await query(sql0);
     

      if(sql0Result.length > 0){
      const sqlA = 'DELETE FROM detailstokproduk WHERE Produk_id = ?;';
      let sqlAResult = await query(sqlA, [ProdukId]);
        
      const sql1 = 'DELETE FROM produk WHERE id = ?;';
      let sql1Result = await query(sql1, [ProdukId]);
    
      }else{
        const sql3 = 'DELETE FROM produk WHERE id = ?;';
        let sql3Result = await query(sql3, [ProdukId]);
      }

      const sql2 = `Select produk.nama_obat, produk.NIE, produk.stok, produk.harga, produk.nilai_barang, produk.id, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id ORDER BY produk.id;`
      let sql2Result = await query(sql2);

  
      res.status(200).send({
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
                return res.status(500).json({ message: 'Uploud Foto Produk Gagal!', error: err.message });
            }
            const { gambar } = req.files;
            const imagePath = gambar ? path + '/' + gambar[0].filename : null;
            const data = JSON.parse(req.body.data);
            data.gambar = imagePath;
            console.log('data add data', data)

            if(data.nama_obat === "" || data.berat ==="" || data.NIE === "" || data.harga === "" ||  data.nilai_barang === "" ||  data.SatuaObat_id === "" ||  data.GolonganObat_id === "" ||  data.tempat_penyimpanan ==="" ||  data.expired ==="" || data.gambar === null){
              return res.status(500).json({ message: "Semua Data Harus Diisi", error: true }); 
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
                    return res.status(500).json({ message: 'Update Foto Produk Gagal !', error: err.message });
                }

                const { gambar } = req.files;
                const imagePath = gambar ? path + '/' + gambar[0].filename : null;
                const data = JSON.parse(req.body.data);
                console.log('ini data ', data )

                try {
                    if(imagePath) {
                        data.gambar = imagePath;   
                    }

                 
                    if(data.stok){
                        queryStok = `SELECT stok from produk where id = ${produk_id};`
                        db.query(queryStok, (err1, results1) => {
                           
                            if(err1) {
                                return res.status(500).json({ message: "Server Error", error: err.message });
                            }

                            if(data.stok > results1[0].stok){
                                let newDataStokMasuk = data.stok - results1[0].stok
                                let sisa = results1[0].stok + newDataStokMasuk
                               
                                queryStokMasuk = `INSERT INTO detailstokproduk (keluar, aktivitas, masuk, Produk_id, admin_id, sisa) VALUES (0, "Penerimaan Barang", ${newDataStokMasuk}, ${produk_id}, ${id}, ${sisa});`
                                db.query(queryStokMasuk, (err2, results2) => {
                                   
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

        let query1 = `Select produk.nama_obat, produk.NIE, produk.stok, produk.harga, produk.nilai_barang, produk.id, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id ORDER BY produk.id LIMIT ${start},${limit};`
        const findProduk = await query(query1, {
            limit: limit,
            offset: start
        })
  
        let query2 = 'SELECT COUNT(produk.id) as TotalData FROM produk;'
        const countProduk = await query(query2)

        let countFiltered = parseInt(countProduk[0].TotalData)
        let pagination = {}
        pagination.totalRow = countProduk
        pagination.totalPage = Math.ceil(countFiltered/limit)

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
      db.query(`Select produk.nama_obat, produk.NIE, produk.stok, produk.harga, produk.nilai_barang, produk.id, golonganobat.golongan_obat, satuanobat.satuan_obat from produk JOIN golonganobat ON produk.GolonganObat_id = golonganobat.id JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id WHERE produk.nama_obat LIKE "%${nama}%" AND produk.GolonganObat_id = ${data}`, (err, result) => {
          try {
              if(err) throw err 

              if(result.length < 0){
                res.status(500).send({
                  error: true, 
                  message: 'Data Tidak Ditemukan'
              })
              }
              
              res.status(200).send({
                  error: false, 
                  result: result,
                  total: result.length
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
   
      let countFiltered = parseInt(countStok[0].TotalData)
      let pagination = {}
      pagination.totalRow = countStok
      pagination.totalPage = Math.ceil(countFiltered/limit)
   
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

searchKartuStok: async(req, res) => {
  try {
    const data = req.query.kategori
    const bulan = parseInt(req.query.bulan)
    const tahun = parseInt(req.query.tahun)
    var produkId = req.params.id;

     if(data || bulan || tahun){
      db.query(`SELECT detailstokproduk.*, admin.username FROM detailstokproduk 
      JOIN admin ON detailstokproduk.admin_id=admin.id 
      WHERE MONTH(detailstokproduk.created_at) = ${bulan} AND YEAR(detailstokproduk.created_at) = ${tahun} AND detailstokproduk.Produk_id = ${produkId} AND detailstokproduk.aktivitas = "${data}"`, (err, result) => {
          try {
              if(err) throw err 

              if(result.length < 0){
                res.status(500).send({
                  error: true, 
                  message: 'Data Tidak Ditemukan'
              })
              }
              
              res.status(200).send({
                  error: false, 
                  result: result,
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

getTokenAdmin: (req,res) => {
  const id = req.dataToken.id 
  var sql = `Select token from admin where id = ${id}`
  db.query(sql, (err,result) => {
      if(err) return res.status(500).send({ message: 'Error!', error: err})
      console.log(result)
      return res.status(200).json(result)
  })
},

getDashboardData: async(req, res) => {
  try {
      let id = req.dataToken.id
      var currentDate = new Date().getDate();
      console.log(currentDate)

      // GET total pesanan hari ini
      let query1 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate}`;
      const data = await query(query1)
      
      // GET sisa stok hari ini
      let query2 = `SELECT * FROM detailstokproduk WHERE DAY(created_at) = ${currentDate}`;
      const stok = await query(query2);

      // GET semua pesanan baru
      let query3 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 1`;
      const pesananBaru = await query(query3);

       // GET semua pesanan baru
       let query03 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 2 `;
       const pesananBaru2 = await query(query03);

       let query003 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 3 `;
       const pesananBaru3 = await query(query003);
 
       // GET siap dikirim
       let query4 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 4 `;
      const siapKirim = await query(query4);

        // GET sedang dikirim
        let query5 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 5`;
        const sedangKirim = await query(query5);

        // GET selesai
        let query6 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 6`;
        const selesai = await query(query6);

        // GET dibatalkan
        let query7 = `SELECT * FROM transaksi WHERE DAY(created_at) = ${currentDate} AND statusTransaksi_id = 7`;
        const dibatalkan = await query(query7);

        res.status(200).send({
          status: 200,
          error: false,
          message: 'Get Home Data Success',
          data: data,
          stok: stok,
          pesananBaru: pesananBaru,
          pesananBaru2: pesananBaru2,
          pesananBaru3: pesananBaru3,
          siapKirim: siapKirim,
          sedangKirim: sedangKirim,
          selesai: selesai,
          dibatalkan: dibatalkan
      })
  } catch (error) {
      res.status(400).send({
          status: 400,
          error: true,
          message: error.message
      })
  }
},

transactionCount: async(req, res) => {
  try {
    const status = req.query.status
    const transnum = req.query.transnum
    const userIds = req.query.userids
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    const sort = req.query.sort

    let query1 = `SELECT COUNT(id) as TotalData FROM transaksi `
    if(status === 'resep-baru'){query1 += `WHERE statusTransaksi_id = 1 `}
    if(status === 'menunggu-bukti-pembayaran'){query1 += `WHERE statusTransaksi_id = 2 `}
    if(status === 'cek-bukti-pembayaran'){query1 += `WHERE statusTransaksi_id = 3 `}
    if(status === 'pesanan-diproses'){query1 += `WHERE statusTransaksi_id = 4 `}
    if(status === 'dalam-pengiriman'){query1 += `WHERE statusTransaksi_id = 5 `}
    if(status === 'pesanan-selesai'){query1 += `WHERE statusTransaksi_id = 6 `}
    if(status === 'pesanan-dibatalkan'){query1 += `WHERE statusTransaksi_id = 7 `}
    if(status === 'menunggu-checkout'){query1 += `WHERE statusTransaksi_id = 8 `}

    if((status === ('semua-pesanan' || '')) && (transnum || userIds || startDate || endDate)){
      query1 += `WHERE `
    }

    if(transnum){
      if (status !== ('semua-pesanan' || '')){
          query1 += `AND `
      }
      query1 += `no_pemesanan LIKE '%${transnum}%' `
    }
    
    if(userIds){
      if (status !== ('semua-pesanan' || '') || transnum){
          query1 += `AND `
      }
      query1 += `user_id IN (${userIds}) `
    }
    
    if(startDate){
      if (status !== ('semua-pesanan' || '') || transnum || userIds){
          query1 += `AND `
      }
      startDate = startDate.split('/').reverse().join('-')
      endDate = (endDate.split('/'))
      endDate[0] = Number(endDate[0]) + 1
      endDate = endDate.reverse().join('-')
      query1 += `created_at >='${startDate} 00:00:00' AND created_at <'${endDate} 00:00:00' `
    }

    const count = await query(query1)
    res.status(200).send(count)
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

transactionDetail: async(req, res) => {
  try {
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const status = req.query.status
    const transnum = req.query.transnum
    const userIds = req.query.userids
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    const sort = req.query.sort
    const startIndex = (page - 1) * limit

    let query1 = `SELECT id, statusTransaksi_id, no_pemesanan, alamat, kabupaten_kota, provinsi,
                    kurir, bukti_pembayaran, User_id, total_pembayaran, created_at FROM transaksi `

    if(status === 'resep-baru'){query1 += `WHERE statusTransaksi_id = 1 `}
    if(status === 'menunggu-bukti-pembayaran'){query1 += `WHERE statusTransaksi_id = 2 `}
    if(status === 'cek-bukti-pembayaran'){query1 += `WHERE statusTransaksi_id = 3 `}
    if(status === 'pesanan-diproses'){query1 += `WHERE statusTransaksi_id = 4 `}
    if(status === 'dalam-pengiriman'){query1 += `WHERE statusTransaksi_id = 5 `}
    if(status === 'pesanan-selesai'){query1 += `WHERE statusTransaksi_id = 6 `}
    if(status === 'pesanan-dibatalkan'){query1 += `WHERE statusTransaksi_id = 7 `}
    if(status === 'menunggu-checkout'){query1 += `WHERE statusTransaksi_id = 8 `}

    if((status === ('semua-pesanan' || '')) && (transnum || userIds || startDate || endDate)){
      query1 += `WHERE `
    }

    if(transnum){
      if (status !== ('semua-pesanan' || '')){
          query1 += `AND `
      }
      query1 += `no_pemesanan LIKE '%${transnum}%' `
    }
    
    if(userIds){
      if (status !== ('semua-pesanan' || '') || transnum){
          query1 += `AND `
      }
      query1 += `user_id IN (${userIds}) `
    }
    
    if(startDate){
      if (status !== ('semua-pesanan' || '') || transnum || userIds){
          query1 += `AND `
      }
      startDate = startDate.split('/').reverse().join('-')
      endDate = (endDate.split('/'))
      endDate[0] = Number(endDate[0]) + 1
      endDate = endDate.reverse().join('-')
      query1 += `created_at >='${startDate} 00:00:00' AND created_at <'${endDate} 00:00:00' `
    }

    if(sort === 'terbaru') {
      query1 += `ORDER BY id DESC `
    }

    query1 += `LIMIT ${startIndex},${limit};`
    console.log(query1)
    let transaksi = await query(query1)

    const query2 = `SELECT username FROM user WHERE id = ?`
    for (let i = 0; i < transaksi.length; i++) {
        let username = await query(query2, transaksi[i].User_id)
        transaksi[i] = { ...transaksi[i], username: username[0].username}
    }
    const query3 = `SELECT Produk_id, nama_produk, harga_produk, quantity, gambar_produk FROM detailtransaksi WHERE Transaksi_id = ?`
    //  harga produk di tabel ini sudah dikalikan quantity
    for (let i = 0; i < transaksi.length; i++) {
        let produk = await query(query3, transaksi[i].id)
        transaksi[i] = { ...transaksi[i], produk: produk}
    }

    const query4 = `SELECT id, gambar_resep FROM resep WHERE Transaksi_id = ?`
    for (let i = 0; i < transaksi.length; i++) {
        if(transaksi[i].no_pemesanan.includes('RSP')){
          let hasil = await query(query4, transaksi[i].id)
          if(hasil.length){
            transaksi[i] = { ...transaksi[i], gambarResep: hasil[0].gambar_resep, idResep: hasil[0].id}
          }
        }
    }

    for (let i = 0; i < transaksi.length; i++) {
      let date = new Date(transaksi[i].created_at)
      date.setHours(date.getHours() + 7)
      transaksi[i] = { ...transaksi[i], created_at: date}
    }

    res.status(200).send(transaksi)
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

searchTransactionNumber: async(req, res) => {
  try {
    const no = req.query.no
    let query1 = `SELECT no_pemesanan FROM transaksi WHERE no_pemesanan LIKE '%${no}%' LIMIT 10;`
    const nomorPemesanan = await query(query1)
    const result = nomorPemesanan.map(n => n.no_pemesanan)
    res.status(200).send(result)
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

searchTransactionUsername: async(req, res) => {
  try {
    const user = req.query.user
    let query1 = `SELECT id, username FROM user WHERE username LIKE '%${user}%' LIMIT 10;`
    let users = await query(query1)
    let indices = []
    for(let i=0; i<users.length; i++) {
      let query2 = `SELECT User_id FROM transaksi WHERE User_id = ${users[i].id} LIMIT 10;`
      let transactionUser = await query(query2)
      if(transactionUser.length > 0){indices.push(i)}
    };
    let finalUsers = []
    indices.forEach(val => finalUsers.push(users[val]))
    const userIds = finalUsers.map(u => u.id)
    const usernames = finalUsers.map(u => u.username)
    res.status(200).send({userIds, usernames})
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

cancelTransaction: async(req, res) => {
  try {
    const id = req.body.id
    query1 = `UPDATE transaksi SET statusTransaksi_id = 7  WHERE id = ?`
    await query(query1, id)
    res.status(200).send({error: false, message: 'success!'})
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

continueTransaction: async(req, res) => {
  try {
    const id = req.body.id
    query1 = `SELECT statusTransaksi_id FROM transaksi WHERE id = ?`
    let status = await query(query1, id)
    status = Number(status[0].statusTransaksi_id) + 1
    query2 = `UPDATE transaksi SET statusTransaksi_id = ?  WHERE id = ?`
    await query(query2, [status, id])
    res.status(200).send({error: false, message: 'success!'})
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

salinResep: async(req, res) => {
  try {
    const {pasien, dokter} = req.body
    const {id, idResep} = req.body.transaction
    const products = req.body.products

    query1 = `UPDATE transaksi SET statusTransaksi_id = 8  WHERE id = ?`
    await query(query1, id)
    
    query2 = `UPDATE resep SET nama_pasien = ?, nama_dokter = ? WHERE transaksi_id = ?`
    await query(query2, [pasien, dokter, id])

    query3 = `INSERT INTO detailtransaksi (nama_produk, harga_produk, gambar_produk, quantity,
              satuan_produk, dosis, Produk_id, Transaksi_id, Resep_id)
              VALUES (?,?,?,?,?,?,?,?,?)`
    products.forEach(async (p) => {
      await query(query3, [p.nama, p.harga, p.gambar, p.qty, p.satuan, p.dosis, p.id, id, idResep])
    });

    res.status(200).send({error: false, message: 'success!'})
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},

reduceStock: async(req, res) => {
  try {
    const idAdmin = req.dataToken.id
    const products = req.body.transaksi.produk
    console.log(products)

    query0 = `SELECT stok FROM produk WHERE id = ?`    
    query1 = `UPDATE produk SET stok = ? WHERE id = ?`
    query2 = `INSERT INTO detailstokproduk (aktivitas, keluar, masuk, sisa, Produk_id, Admin_id)
              VALUES ('penjualan barang', ?, 0, ?, ?, ?)`
    products.forEach(async (p) => {
      let stok = await query(query0, p.Produk_id)
      let stokBaru = stok[0].stok - p.quantity
      await query(query1, [stokBaru, p.Produk_id])
      await query(query2, [p.quantity, stokBaru, p.Produk_id, idAdmin])
    });
    res.status(200).send({error: false, message: 'success!'})
  } catch (error) {
    res.status(500).send({
      error: true, 
      message: error.message
    })
  }
},
};
