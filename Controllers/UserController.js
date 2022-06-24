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

      // Step4.3. Store ke Db
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
  getOldPassword: async (req, res) => {
    try {
      const id = req.dataToken.id;
      let oldPassword = req.body.oldPassword;

      const hmac = crypto.createHmac('sha256', 'abc123');
      hmac.update(oldPassword);
      const passwordHashed = hmac.digest('hex');
      oldPassword = passwordHashed;

      let query1 = 'SELECT * FROM user WHERE password = ? AND id = ?';
      const findPassword = await query(query1, [oldPassword, id]);
      if (findPassword.length == 0) {
        throw { message: 'Incorrect old password' };
      } else {
        res.status(201).send({
          status: 201,
          error: false,
          message: 'Correct password',
        });
      }
    } catch (error) {
      res.status(500).send({
        error: true,
        message: error.message,
      });
    }
  },
  changePassword: async (req, res) => {
    try {
      const id = req.body.id;
      let newPassword = req.body.newPassword;

      const hmac = crypto.createHmac('sha256', 'abc123');
      await hmac.update(newPassword);
      const passwordHashed = await hmac.digest('hex');
      newPassword = passwordHashed;

      await query('UPDATE user SET password = ? WHERE id = ?', [newPassword, id]);
      res.status(200).send({
        error: false,
        message: 'Your password has been changed.',
      });
    } catch (error) {
      res.status(500).send({
        error: true,
        message: error.message,
      });
    }
  },
};
