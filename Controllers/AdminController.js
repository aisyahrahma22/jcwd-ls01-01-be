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


    
}
