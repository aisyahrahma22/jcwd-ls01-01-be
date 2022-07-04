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
                  from: 'myUniverse@mail.com',
                  to: data.email,
                  subject: 'Email Confirmation',
                  html: `<div>welcome</div>`,
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
    console.log({ account, password });

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
                res.status(200).send({
                  error: false,
                  message: 'Login Success',
                  token: token,
                  id: result[0].id,
                  verified: result[0].verified,
                });
              } catch (error) {
                console.log(error);
              }
            });
          } catch (error) {
            console.log(error);
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
    console.log('ni newPasswor', newPassword);
    console.log('ni oldPasswor', oldPassword);
    let id = req.dataToken.id;

    let hashPassword1 = crypto.createHmac('sha256', 'abc123').update(oldPassword).digest('hex');

    let hashPassword2 = crypto.createHmac('sha256', 'abc123').update(newPassword).digest('hex');

    db.query(`SELECT * FROM user WHERE id = ${id} AND password =  ${db.escape(hashPassword1)}`, (err, result) => {
      try {
        if (err) throw err;
        console.log('atas', result);

        if (result.length === 0) {
          res.status(400).send({
            error: true,
            message: 'Old Password Wrong',
          });
        } else {
          db.query(`UPDATE user SET password =  ${db.escape(hashPassword2)} WHERE id = ${id}`, (err2, result2) => {
            try {
              if (err2) throw err2;
              console.log('ini result2', result2);
              db.query(`SELECT * FROM user WHERE id = ${id}`, (err3, result3) => {
                try {
                  if (err3) throw err3;
                  console.log('ini result3', result3);

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
            message: 'Id Not Found or Account Already Active',
          });
        } else {
          db.query('SELECT token FROM user WHERE token = ?', req.headers.authorization, (err, result) => {
            try {
              if (err) throw err;

              if (result.length === 0) {
                res.status(400).send({
                  error: true,
                  message: 'Token Deactived',
                });
              } else {
                db.query('UPDATE user SET verified = 1 WHERE id = ?', id, (err1, result1) => {
                  try {
                    if (err) throw err;

                    res.status(200).send({
                      error: false,
                      message: 'Your Account Active!',
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
              console.log(error);
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

        console.log(result);

        res.status(200).send({
          error: false,
          id: result[0].id,
          username: result[0].username,
          verified: result[0].verified,
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

                  fs.readFile(
                    'C:/My Project/jcwd-ls01-01-be/Public/Template/index.html',
                    {
                      encoding: 'utf-8',
                    },
                    (err, file) => {
                      if (err) throw err;

                      const newTemplate = handlebars.compile(file);
                      const newTemplateResult = newTemplate({ bebas: email, link: `http://localhost:3000/confirmation/${token}` });

                      transporter
                        .sendMail({
                          from: 'apotakecare@mail.com',
                          to: email,
                          subject: 'Email Confirmation',
                          html: newTemplateResult,
                        })
                        .then((response) => {
                          res.status(200).send({
                            error: false,
                            message: 'Please Check Email to Verify Your Account!',
                          });
                        })
                        .catch((error) => {
                          res.status(500).send({
                            error: false,
                            message: error.message,
                          });
                        });
                    }
                  );
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
            message: 'Account Not Found',
          });
        }
      } catch (error) {
        console.log(error);
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

        upload(req, res, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Uploud Profile Image Failed !', error: err.message });
          }

          const { image } = req.files;
          const imagePath = image ? path + '/' + image[0].filename : null;
          const data = JSON.parse(req.body.data);
          console.log('ini imagePath', imagePath);

          try {
            console.log('imagePath after try', imagePath);
            console.log('results', results);
            if (imagePath) {
              data.profile_picture = imagePath;
            }

            if (data.umur) {
              let year = new Date().getFullYear();
              let usia = year - data.umur;
              data.umur = usia;
            }

            sql = `Update user set ? where id = ${id};`;
            db.query(sql, data, (err1, results1) => {
              console.log('ini results1', results1);
              console.log('ini results', results);
              console.log('ini err1', err1);
              if (err1) {
                console.log('imagePath err1', imagePath);
                if (imagePath) {
                  fs.unlinkSync('./Public/users' + imagePath);
                }
                return res.status(500).json({ message: 'Server Error', error: err1.message });
              }

              console.log(' data.profile_picture', data.profile_picture);
              console.log('resultf before results[0].profile_picture', results);
              console.log('results[0].profile_picture', results[0].profile_picture);
              console.log('imagePath bawha', imagePath);
              // kalo pp nya ga string kosong or null maka ada isinya, jadi harus di update
              // tanpa menghapus foto di vs code jadi update aja nama filenya
              // tapi kalau ga ada alias null or string kosong, maka uploud foto ke db dan vs code
              if (results[0].profile_picture === '' || results[0].profile_picture === null) {
                if (imagePath === null) {
                  data.profile_picture = results[0].profile_picture;
                } else {
                  // results[0].profile_picture = data.profile_picture
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

              // if(imagePath) {
              //     fs.unlinkSync('' + results[0].profile_picture);
              // }

              queryHasil = `SELECT * from user where id = ${id}`;
              db.query(queryHasil, id, (err4, results4) => {
                console.log('ini err4', err4);
                console.log('ini  results4', results4);
                if (err4) {
                  return res.status(500).json({ message: 'Server Error', error: err.message });
                }

                return res.status(200).send(results4);
              });
            });
          } catch (err) {
            console.log(err.message);
            return res.status(500).json({ message: 'Server Error', error: err.message });
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
    console.log(email);

    db.query('SELECT * FROM user WHERE email = ?', email, (err, result) => {
      try {
        if (err) throw err;

        console.log('ini error', err);
        console.log('ini result', result);
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
                      from: 'myUniverse@mail.com',
                      to: email,
                      subject: 'Reset Password',
                      html: `http://localhost:3000/resetpassword/${token}`,
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
    console.log(password);
    let id = req.dataToken.id;
    console.log(id);
    let hashPassword = crypto.createHmac('sha256', 'abc123').update(password).digest('hex');
    console.log(hashPassword);

    db.query('SELECT * FROM user WHERE id = ?', id, (err, result) => {
      try {
        if (err) throw err;
        console.log('atas', result);

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
                    console.log('ini err2', err2);
                    console.log('result2', result2);

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
              console.log(error);
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
};
