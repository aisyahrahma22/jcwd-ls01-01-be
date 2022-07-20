const db = require('../Connection/Connection');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const { uploader } = require('../Helpers/Uploader');
const validator = require('validator');
const crypto = require('crypto');
const transporter = require('../Helpers/Transporter');
const fs = require('fs');
const handlebars = require('handlebars');
const jwt = require('jsonwebtoken');
const path = require("path");

module.exports = {
  register: async (req, res) => {
    try {
      let data = req.body;

      if (!data.username || !data.email || !data.password) throw { message: 'Data Not Completed!' };
      if (!validator.isEmail(data.email)) throw { message: 'Email Invalid' };
      if (data.password.length > 50) throw { message: 'Password Maximum 50 Character' };

      const hmac = crypto.createHmac('sha256', 'abc123');
      await hmac.update(data.password);
      const passwordHashed = await hmac.digest('hex');
      data.password = passwordHashed;

      let query01 = 'SELECT * FROM user WHERE username = ?';
      const findUsername = await query(query01, data.username).catch((error) => {
        throw error;
      });

      if (findUsername.length > 0) {
        throw { message: 'Username Already Register!' };
      }

      let query1 = 'SELECT * FROM user WHERE email = ?';
      const findEmail = await query(query1, data.email).catch((error) => {
        throw error;
      });

      if (findEmail.length > 0) {
        throw { message: 'Email Already Register!' };
      }

      let query2 = 'INSERT INTO user SET ?';
      const insertUser = await query(query2, data).catch((error) => {
        throw error;
      });

      jwt.sign({ id: insertUser.insertId }, '123abc', (err, token) => {
        try {
          if (err) throw err;

          // Step5.0. Save Token to Db
          let query3 = 'UPDATE user SET token = ? WHERE id = ?';
          db.query(query3, [token, insertUser.insertId], (err1, result1) => {
            try {
              if (err1) throw err1;
              let emailType = "index.html"
              let filepath = path.resolve(__dirname, `../Public/Template/${emailType}`);
              let htmlString = fs.readFileSync(filepath, "utf-8");
          
              const template = handlebars.compile(htmlString);
              const htmlToEmail = template({link: `http://localhost:3000/confirmation/${token}`});

              // Step5.1. Send Email Confirmation

              // fs.readFile(
              //   'C:/My Apps/api-sosmed/Public/Template/index.html',
              //   {
              //     encoding: 'utf-8',
              //   },
              //   (err, file) => {
              //     if (err) throw err;

              //     const newTemplate = handlebars.compile(file);
              //     const newTemplateResult = newTemplate({ bebas: data.email, link: `http://localhost:3000/confirmation/${token}` });

              transporter
                .sendMail({
                  from: 'apoatakecare@gmail.com',
                  to: data.email,
                  subject: 'Email Confirmation',
                  html: htmlToEmail,
                })
                .then((response) => {
                  res.status(200).send({
                    error: false,
                    message: 'Register Success! Check Email to Verified Account!',
                  });
                })
                .catch((error) => {
                  res.status(500).send({
                    error: false,
                    message: error.message,
                  });
                });
              // }
              // );
            } catch (error) {
              res.status(500).send({
                error: true,
                message: error.message,
              });
            }
          });
        } catch (error) {
          res.status(500).send({
            error: true,
            message: error.message,
          });
        }
      });
    } catch (error) {
      res.status(500).send({
        error: true,
        message: error.message,
      });
    }
  },

  login: (req, res) => {
    let { account, password } = req.body;
    password = crypto.createHmac('sha256', 'abc123').update(password).digest('hex');
    let getUserQuery = `select * from user where (email = ${db.escape(account)} or username = ${db.escape(account)}) and password = ${db.escape(password)}`;

    db.query(getUserQuery, (err, result) => {
      if (err) {
        res.status(404).send({
          message: err,
        });
      }

      if (result.length === 1) {
        jwt.sign({ id: result[0].id }, '123abc', (err, token) => {
          try {
            if (err) throw err;
            db.query('UPDATE user SET token = ?  WHERE id = ?', [token, result[0].id], (err1, result1) => {
           
              try {
                if (err1) throw err1;
                var sql2 = `SELECT * from user where id = ${result[0].id} ;`
                db.query(sql2, (err2,result2) => {
                 
                    if(err2) return res.status(500).send({ message: 'Error!', error: err2})
                    return res.status(200).json({
                        error: false,
                        message: 'Login Success',
                        token: result2[0].token,
                        username: result2[0].username,
                        email: result2[0].email,
                        verified: result2[0].verified,
                    })
                })
              } catch (error) {
                res.status(500).send(error);
                
              }
            });
          } catch (error) {
            res.status(500).send(error);
          }
        });
      } else {
        res.status(200).send({
          error: true,
          message: 'Incorrect email/username or password',
        });
      }
    });
  },
  changePassword: (req, res) => {
    let newPassword = req.body.newPassword;
    let oldPassword = req.body.oldPassword;
  
    let id = req.dataToken.id;

    let hashPassword1 = crypto.createHmac('sha256', 'abc123').update(oldPassword).digest('hex');

    let hashPassword2 = crypto.createHmac('sha256', 'abc123').update(newPassword).digest('hex');

    db.query(`SELECT * FROM user WHERE id = ${id} AND password =  ${db.escape(hashPassword1)}`, (err, result) => {
      try {
        if (err) throw err;
       

        if (result.length === 0) {
          res.status(400).send({
            error: true,
            message: 'Old Password Wrong',
          });
        } else {
          db.query(`UPDATE user SET password =  ${db.escape(hashPassword2)} WHERE id = ${id}`, (err2, result2) => {
            try {
              if (err2) throw err2;
             
              db.query(`SELECT * FROM user WHERE id = ${id}`, (err3, result3) => {
                try {
                  if (err3) throw err3;
                  
                  res.status(200).send({
                    error: false,
                    message: 'Change Password Success!',
                    data: result3,
                  });
                } catch (error) {
                  res.status(500).send({
                    error: true,
                    message: error.message,
                  });
                }
              });
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
    });
  },
  verification: (req, res) => {
    const id = req.dataToken.id;

    db.query('SELECT * FROM user WHERE id = ? AND verified = 0', id, (err, result) => {
      try {
        if (err) throw err;

        if (result.length === 0) {
          res.status(400).send({
            error: true,
            message: 'Id Tidak Ditemukan',
          });
        } else {
          db.query('SELECT token FROM user WHERE token = ?', req.headers.authorization, (err, result) => {
            try {
              if (err) throw err;

              if (result.length === 0) {
                res.status(400).send({
                  error: true,
                  message: 'Token Tidak Aktif',
                });
              } else {
                db.query('UPDATE user SET verified = 1 WHERE id = ?', id, (err1, result1) => {
                  try {
                    if (err) throw err;

                    res.status(200).send({
                      error: false,
                      message: 'Akun Sudah Aktif!',
                    });
                  } catch (error) {
                    res.status(500).send({
                      error: true,
                      message: error.message,
                    });
                  }
                });
              }
            } catch (error) {
              res.status(500).send(error);
            }
          });
        }
      } catch (error) {
        res.status(500).send({
          error: true,
          message: error.message,
        });
      }
    });
  },
  checkUserVerify: (req, res) => {
    let id = req.dataToken.id;

    db.query('SELECT * FROM user WHERE id = ?', id, (err, result) => {
      try {
        if (err) throw err;

       

        res.status(200).send({
          error: false,
          id: result[0].id,
          username: result[0].username,
          verified: result[0].verified,
          token: result[0].token,
        });
      } catch (error) {
        res.status(500).send({
          error: true,
          message: error.message,
        });
      }
    });
  },
  resend: (req, res) => {
    let id = req.dataToken.id;
    db.query('SELECT * FROM user WHERE id = ?', id, (err, result) => {
      try {
        if (err) throw err;

        if (result.length === 1) {
          let email = result[0].email;
          jwt.sign({ id: id }, '123abc', (err, token) => {
            try {
              if (err) throw err;

              let query3 = 'UPDATE user SET token = ? WHERE id = ?';
              db.query(query3, [token, id], (err1, result1) => {
                try {
                  if (err1) throw err1;
                  let emailType = "index.html"
                 
                  let filepath = path.resolve(__dirname, `../Public/Template/${emailType}`);
                 
                  let htmlString = fs.readFileSync(filepath, "utf-8");
              
                  const template = handlebars.compile(htmlString);
                  const htmlToEmail = template({link: `http://localhost:3000/confirmation/${token}`});

                  transporter
                  .sendMail({
                    from: 'apotakecare@mail.com',
                    to: email,
                    subject: 'Email Confirmation',
                    html: htmlToEmail,
                  })
                  .then((response) => {
                    res.status(200).send({
                      error: false,
                      message: 'Silahkan Check Email Untuk Verifikasi Akun Anda!',
                    });
                  })
                  .catch((error) => {
                    res.status(500).send({
                      error: false,
                      message: error.message,
                    });
                  });
                } catch (error) {
                  res.status(500).send({
                    error: true,
                    message: error.message,
                  });
                }
              });
            } catch (error) {
              res.status(500).send({
                error: true,
                message: error.message,
              });
            }
          });
        } else {
          res.status(500).send({
            error: true,
            message: 'Akun Tidak Ditemukan',
          });
        }
      } catch (error) {
        res.status(500).send(error);
      }
    });
  },

  editProfileData: (req, res) => {
    var id = req.dataToken.id;
    var sql = `SELECT * from user where id = ${id};`;
    db.query(sql, (err, results) => {
        if (err) throw err;
        
        if (results.length > 0) {
        const path = 'Public/users';
        const upload = uploader(path, 'USER').fields([{ name: 'image' }]);
          
        upload(req, res, (error) => {
          if (error) {
            return res.status(500).json({ message: 'Edit Foto Profile Gagal !', error: error.message });
          }

          const { image } = req.files;
          const imagePath = image ? path + '/' + image[0].filename : null;
          const data = JSON.parse(req.body.data);

          try {
            if (imagePath) {
              data.profile_picture = imagePath;
            }

            if (data.umur) {
              let year = new Date().getFullYear();
              let usia = year - data.umur;
              data.umur = usia;
            }

            sql = `SELECT * FROM user WHERE username = ?;` 
            db.query(sql, data.username, (err3, results3) => {
              if (err3) {
              return res.status(500).json({ message: 'Server Error', error: err3.message });
              }
              if(results3.length > 0){
                if(results[0].username !== results3[0].username){
                  return res.status(500).json({ message: 'Username Sudah Dipakai', error: true });
                }else{
                  sqlHasil = `Update user set ? where id = ${id};`;
                  db.query(sqlHasil, data, (err1, results1) => {
                    if (err1) {
                      if (imagePath) {
                        fs.unlinkSync('./Public/users' + imagePath);
                      }
                      return res.status(500).json({ message: 'Server Error', error: err1.message });
                    }
                    
                    if (results[0].profile_picture === '' || results[0].profile_picture === null) {
                      if (imagePath === null) {
                        data.profile_picture = results[0].profile_picture;
                      } else {
                        data.profile_picture = imagePath;
                      }
                    } else {
                      if (!data.profile_picture) {
                        data.profile_picture = results[0].profile_picture;
                      } else {
                        if (data.profile_picture !== results[0].profile_picture) {
                          fs.unlinkSync('' + results[0].profile_picture);
                        }
                      }
                    }
                  });
      
                  queryHasil = `SELECT * from user where id = ${id}`;
                  db.query(queryHasil, (err4, results4) => {
                    if (err4) {
                      return res.status(500).json({ message: 'Server Error', error: err4.message });
                    }
      
                    return res.status(200).send(results4);
                  });
                }

              }
            });
          } catch (error) {
            
            return res.status(500).json({ message: 'Server Error', error: error.message });
          }
        });
      }
    });
  },
  getUsers: (req, res) => {
    const id = req.dataToken.id;
    var sql = `Select * from user where id = ${id};`;
    db.query(sql, (err, result) => {
      if (err) return res.status(500).send({ message: 'Error!', error: err });

      return res.status(200).send(result);
    });
  },
  resendPassword: (req, res) => {
    let email = req.body.email;
   

    db.query('SELECT * FROM user WHERE email = ?', email, (err, result) => {
      try {
        if (err) throw err;

       
        if (result.length === 1) {
          let email = result[0].email;
          let id = result[0].id;

          jwt.sign({ id: id }, '123abc', (err, token) => {
            try {
              if (err) throw err;

              let query3 = 'UPDATE user SET token = ? WHERE id = ?';
              db.query(query3, [token, id], (err1, result1) => {
                try {
                  if (err1) throw err1;
                  let emailType = "index2.html"
                 
                  let filepath = path.resolve(__dirname, `../Public/Template/${emailType}`);
                 
                  let htmlString = fs.readFileSync(filepath, "utf-8");
              
                  const template = handlebars.compile(htmlString);
                  const htmlToEmail = template({link: `http://localhost:3000/newpassword/${token}`});

                  // fs.readFile(
                  //   'C:/My Apps/api-sosmed/Public/Template/index2.html',
                  //   {
                  //     encoding: 'utf-8',
                  //   },
                  //   (err, file) => {
                  //     if (err) throw err;

                  //     const newTemplate = handlebars.compile(file);
                  //     const newTemplateResult = newTemplate({ bebas: email, link: `http://localhost:3000/resetpassword/${token}` });

                  transporter
                    .sendMail({
                      from: 'apotakecare@gmail.com',
                      to: email,
                      subject: 'Reset Password',
                      html: htmlToEmail,
                    })
                    .then((response) => {
                      res.status(200).send({
                        error: false,
                        message: 'Please Check Your Email to Change Password',
                      });
                    })
                    .catch((error) => {
                      res.status(500).send({
                        error: false,
                        message: error.message,
                      });
                      // });
                    });
                } catch (error) {
                  res.status(500).send({
                    error: true,
                    message: error.message,
                  });
                }
              });
            } catch (error) {
              res.status(500).send({
                error: true,
                message: error.message,
              });
            }
          });
        } else {
          res.status(500).send({
            error: true,
            message: 'Account not found',
          });
        }
      } catch (error) {
        res.status(500).send({
          error: true,
          message: 'Account not found',
        });
      }
    });
  },
  resetPassword: (req, res) => {
    let { password } = req.body;
    let id = req.dataToken.id;
    let hashPassword = crypto.createHmac('sha256', 'abc123').update(password).digest('hex');
   
    db.query('SELECT * FROM user WHERE id = ?', id, (err, result) => {
      try {
        if (err) throw err;
        
        if (result.length === 0) {
          res.status(400).send({
            error: true,
            message: 'Account Not Found',
          });
        } else {
          db.query('SELECT token FROM user WHERE token = ?', req.headers.authorization, (err1, result1) => {
            try {
              if (err1) throw err1;

              if (result1.length === 0) {
                res.status(400).send({
                  error: true,
                  message: 'Token Deactived',
                });
              } else {
                db.query(`UPDATE user SET password =  ${db.escape(hashPassword)} WHERE id = ${id}`, (err2, result2) => {
                  try {
                    if (err2) throw err2;
                   
                    res.status(200).send({
                      error: false,
                      message: 'Reset Password Success!',
                    });
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
          });
        }
      } catch (error) {
        res.status(500).send({
          error: true,
          message: error.message,
        });
      }
    });
  },
  getAddress: async(req,res) => {
    try {
        const id = req.dataToken.id 
        const query1 = `SELECT * FROM alamat WHERE User_id = ?`
        let addresses = await query(query1, id)
        res.status(200).send(addresses)
    } catch (error) {
        res.status(500).send({
            status: 500,
            error: true,
            message: error.message
        })
    }
  },
  
getTokenUser: (req,res) => {
  const id = req.dataToken.id 
  var sql = `Select token from user where id = ${id}`
  db.query(sql, (err,result) => {
      if(err) return res.status(500).send({ message: 'Error!', error: err})
     
      return res.status(200).json(result)
  })
},
  
};
