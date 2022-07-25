const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const transporter = require('../Helpers/Transporter');
const { uploader } = require('../Helpers/Uploader');
var fs = require('fs');

module.exports = {
  getTotalProductsNum: (req,res) => {
    const category = req.query.category
    let keluhan = req.query.keluhan
    let hargaMin = req.query.hargamin
    let hargaMax = req.query.hargamax
    let jenisObat = req.query.jenisobat
    let golonganObat = req.query.golonganobat
    let search = req.query.search

    var query1 = `SELECT COUNT(*) as countProducts FROM produk `

    if(category == 'obat-obatan'){query1 += `WHERE KategoriObat_id = 1 `}
    if(category == 'nutrisi'){query1 += `WHERE KategoriObat_id = 2 `}
    if(category == 'herbal'){query1 += `WHERE KategoriObat_id = 3 `}
    if(category == 'vitamin-suplemen'){query1 += `WHERE KategoriObat_id = 4 `}
    if(category == 'alat-kesehatan'){query1 += `WHERE KategoriObat_id = 5 `}
    if(category == 'perawatan-tubuh'){query1 += `WHERE KategoriObat_id = 6 `}
    if(category == 'ibu-anak'){query1 += `WHERE KategoriObat_id = 7 `}
        
    if((category === ('semua-kategori' || '')) && (search || keluhan || hargaMin || hargaMax || jenisObat || golonganObat)){
        query1 += `WHERE `
    }
    
    if(search){
        if (category !== ('semua-kategori' || '')){
            query1 += `AND `
        }
        query1 += `nama_obat LIKE '%${search}%' `
    }

    if(keluhan){
        if ((category !== ('semua-kategori' || '')) || search){
            query1 += `AND `
        }
        keluhanString = keluhan.split('-').join(',')
        query1 += `keluhan_id in (${keluhanString}) `
    }

    db.query(query1, (err,result) => {
        if(err) return res.status(500).send({ message: 'Error!', error: err})
        return res.status(200).send(result)
    })
},

getProductCards: async(req,res) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const category = req.query.category
        let keluhan = req.query.keluhan
        let hargaMin = req.query.hargamin
        let hargaMax = req.query.hargamax
        let jenisObat = req.query.jenisobat
        let golonganObat = req.query.golonganobat
        let search = req.query.search
        const sortBy = req.query.sortby
        const startIndex = (page - 1) * limit
        
        let query1 = `SELECT id, nama_obat AS namaObat,
        butuh_resep AS butuhResep, harga, diskon, gambar, stok,
        Keluhan_id AS keluhanId,
        KategoriObat_id AS kategoriObatId,
        SatuanObat_id AS satuanObatId,
        GolonganObat_id AS golonganObatId
        FROM produk `

        if(category == 'obat-obatan'){query1 += `WHERE KategoriObat_id = 1 `}
        if(category == 'nutrisi'){query1 += `WHERE KategoriObat_id = 2 `}
        if(category == 'herbal'){query1 += `WHERE KategoriObat_id = 3 `}
        if(category == 'vitamin-suplemen'){query1 += `WHERE KategoriObat_id = 4 `}
        if(category == 'alat-kesehatan'){query1 += `WHERE KategoriObat_id = 5 `}
        if(category == 'perawatan-tubuh'){query1 += `WHERE KategoriObat_id = 6 `}
        if(category == 'ibu-anak'){query1 += `WHERE KategoriObat_id = 7 `}
        
        if((category === ('semua-kategori' || '')) && (search || keluhan || hargaMin || hargaMax || jenisObat || golonganObat)){
            query1 += `WHERE `
        }
       
        if(search){
            if (category !== ('semua-kategori' || '')){
                query1 += `AND `
            }
            query1 += `nama_obat LIKE '%${search}%' `
        }

        if(keluhan){
            if ((category !== ('semua-kategori' || '')) || search){
                query1 += `AND `
            }
            keluhanString = keluhan.split('-').join(',')
            query1 += `keluhan_id in (${keluhanString}) `
        }

        if(sortBy == 'AZ'){query1 += `ORDER BY namaObat ASC `}
        if(sortBy == 'ZA'){query1 += `ORDER BY namaObat DESC `}
        if(sortBy == 'hargaTerendah'){query1 += `ORDER BY harga ASC `}
        if(sortBy == 'hargaTertinggi'){query1 += `ORDER BY harga DESC `}
        
        query1 += `LIMIT ${startIndex},${limit};`

        const products = await query(query1)

        let query2 = `SELECT satuan_obat AS satuanObat FROM satuanobat WHERE id = ?`
            for (let i = 0; i < products.length; i++) {
                let satuan = await query(query2, products[i].satuanObatId)
                products[i] = { ...products[i], satuanObat: satuan[0].satuanObat}
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
    console.log('ini { image }', { image })
    const imagePath = image ? path + '/' + image[0].filename : null;
    console.log('imagePath ', imagePath )

   if(imagePath === null ){
    return res.status(500).json({ message: 'Resep Tidak Terdeteksi, Uploud Resep Gagal', error: true });
   }else{

    var sql = `INSERT INTO resep (gambar_resep, User_id) VALUES ('${imagePath}', '${id}');`;
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server Error', error: err.message });
      }

      var sql2 =`INSERT INTO transaksi (no_pemesanan, User_id, statusTransaksi_id) VALUES ('APTKRSP${results.insertId}', '${id}', "1");`
      db.query(sql2, (err2, results2) => {
        console.log('ini results2', results2);
        if (err2) {
          return res.status(500).json({ message: 'Server Error', error: err.message });
        }

        var sql3 = `UPDATE resep SET Transaksi_id = ${results2.insertId} WHERE User_id = ${id} AND id = ${results.insertId};`
        db.query(sql3, (err3, results3) => {
            console.log('ini results3', results3);
            if (err3) {
            return res.status(500).json({ message: 'Server Error', error: err.message });
            }

        return res.status(200).send(results3);
      });
      });
    });
   }

   
  });
} catch (err) {
  return res.status(500).json({ message: 'Server Error', error: err.message });
}
},

getProductDetail: async(req,res) => {
    try {
        const id = parseInt(req.query.id)
        
        let query1 = `SELECT id, nama_obat AS namaObat, butuh_resep AS butuhResep, harga, diskon, gambar, stok,
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
        butuh_resep AS butuhResep, harga, diskon, gambar, stok,
        SatuanObat_id AS satuanObatId
        FROM produk WHERE keluhan_id = ? 
        AND NOT id = ? LIMIT 0,5`

        let products = await query(query1, [keluhanId, id])

        if(products.length < 5){
            const limit = 5 - products.length
            const query2 = `SELECT id, nama_obat AS namaObat,
            butuh_resep AS butuhResep, harga, diskon, gambar, stok,
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
},

searchProducts: async(req, res) => {
    try {
        let entry = req.query.entry

        const query1 = `SELECT COUNT(*) AS total FROM produk WHERE nama_obat LIKE ?`
        let total = await query(query1, ['%' + entry + '%'])

        const query2 = `SELECT id, nama_obat AS namaObat, diskon, satuanObat_id, gambar, stok FROM produk WHERE nama_obat LIKE ?`
        let products1 = await query(query2, [entry + '%'])
        
        const query3 = `SELECT id, nama_obat AS namaObat, diskon, satuanObat_id, gambar, stok FROM produk WHERE nama_obat LIKE ? AND nama_obat NOT LIKE ?`
        let products2 = await query(query3, [('%' + entry + '%'), (entry + '%')])
        
        let products = [...products1, ...products2]

        res.status(200).send({total: total, products: products})
    } catch (error) {
        res.status(500).send({
                error: true, 
                message: error.message
        })
    }
},

    diskon: (req,res) => { 
        var sql = `Select produk.harga from produk`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})
            var newArray = []
            for (let i = 0; i < result.length; i++) {
                let hargaDiskon = result[i].harga * (10/100)
                let newHarga = result[i].harga - hargaDiskon 
                newArray.push(newHarga)
            }
            res.status(200).send({
                diskon : newArray
            })

        })
    },

    getHomeProduk: (req,res) => { 
        var sql = `SELECT produk.id, produk.nama_obat, produk.harga, produk.diskon, produk.nilai_barang, produk.butuh_resep, produk.gambar, produk.stok, produk.berat, satuanobat.satuan_obat FROM produk JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id LIMIT 4;`
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})

            var sql2 = `SELECT produk.id, produk.nama_obat, produk.harga, produk.diskon, produk.nilai_barang, produk.butuh_resep, produk.gambar, produk.stok, produk.berat, satuanobat.satuan_obat from produk JOIN satuanobat ON produk.SatuanObat_id = satuanobat.id ORDER BY produk.id DESC LIMIT 0, 5;`
            db.query(sql2, (err2,result2) => {
                if(err2) return res.status(500).send({ message: 'Error!', error: err2})
            
                res.status(200).send({
                    produkDiskon : result,
                    produkTerbaru: result2
                })
    
            })

        })
    },

    getResep: async(req, res) => {
        try {
            let id = req.dataToken.id

            let query1 = `SELECT resep.id as no_resep, transaksi.id as transaksi_id, resep.gambar_resep, 
            resep.tgl_pemesanan, transaksi.no_pemesanan from resep 
            JOIN transaksi ON resep.Transaksi_id = transaksi.id WHERE resep.User_id = ${id} `

            const data = await query(query1)
            console.log('data', data)
            
            let query2 = `SELECT transaksi.statusTransaksi_id as status_transkasi_id, statustransaksi.status_transaksi  
            FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id 
            WHERE transaksi.User_id = ${id} and transaksi.id = ?;`
            for (let i = 0; i < data.length; i++) {
                let result = await query(query2, data[i].transaksi_id);
                console.log('result', result)
                data[i] = { ...data[i], ...result[i]};
            }

            res.status(200).send(data)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },
   
    deleteResep: async(req, res) => {
        try {
            var transaksi_id = parseInt(req.query.id);
            let id = req.dataToken.id;

            let sql0 = `SELECT * FROM resep WHERE resep.Transaksi_id = ${transaksi_id} `
            const query0Hasil = await query(sql0)
            console.log('query0Hasil', query0Hasil)

            let sql = `INSERT INTO riwayat_resep (gambar, tgl_pemesanan, Transaksi_id, User_id, Resep_id, statusTransaksi_id) VALUES ('${query0Hasil[0].gambar_resep}', '${query0Hasil[0].tgl_pemesanan}','${transaksi_id}', '${id}', '${query0Hasil[0].id}', '7');`
            const queryHasil = await query(sql)


            let sql1 = `DELETE FROM resep WHERE resep.Transaksi_id = ${transaksi_id} `
            const query1Hasil = await query(sql1)
          
            let sql2 = `UPDATE transaksi SET statusTransaksi_id = 7 WHERE id = ${transaksi_id};`
            let query2Hasil = await query(sql2);

            let query1 = `SELECT resep.id as no_resep, transaksi.id as transaksi_id, resep.gambar_resep, 
            resep.tgl_pemesanan, transaksi.no_pemesanan from resep 
            JOIN transaksi ON resep.Transaksi_id = transaksi.id WHERE resep.User_id = ${id} `

            const data = await query(query1)
            console.log('data', data)
            
            let query2 = `SELECT transaksi.statusTransaksi_id as status_transkasi_id, statustransaksi.status_transaksi  
            FROM transaksi JOIN statustransaksi ON transaksi.statusTransaksi_id = statustransaksi.id 
            WHERE transaksi.User_id = ${id} and transaksi.id = ?;`
            for (let i = 0; i < data.length; i++) {
                let result = await query(query2, data[i].transaksi_id);
                console.log('result', result)
                data[i] = { ...data[i], ...result[i]};
            }
            
            res.status(200).send(data)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },
};