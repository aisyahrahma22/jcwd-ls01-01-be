const db = require('../Connection/Connection');
const util = require('util')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')
const validator = require('validator')
const crypto = require('crypto')
const transporter = require('../Helpers/Transporter')
const fs = require('fs')
const handlebars = require('handlebars')
const jwt = require('jsonwebtoken')
import API_URL from "../Helpers/API_URL.js"

module.exports = {
    verification: (req, res) => {
        const id = req.dataToken.id 

        db.query('SELECT * FROM user WHERE id = ? AND verified = 0', id, (err, result) => {
            try {
                if(err) throw err 

                if(result.length === 0){
                    res.status(400).send({
                        error: true, 
                        message: 'Id Not Found or Account Already Active'
                    })
                }else{
                      db.query('SELECT token FROM user WHERE token = ?', req.headers.authorization, (err, result) => {
                        try {
                            if(err) throw err 

                            if(result.length === 0){
                                res.status(400).send({
                                    error: true, 
                                    message: 'Token Deactived'
                                })
                            }else{
                                db.query('UPDATE user SET verified = 1 WHERE id = ?', id, (err1, result1) => {
                                    try {
                                        if(err) throw err 

                                        res.status(200).send({
                                            error: false, 
                                            message: 'Your Account Active!'
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
                            console.log(error)
                        }
                    })
                
                }
            } catch (error) {
                res.status(500).send({
                    error: true, 
                    message: error.message
                })
            }
        })

    
    },
    checkUserVerify: (req, res) => {
        let id = req.dataToken.id
        
        db.query('SELECT * FROM user WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err 

                console.log( result)
                
                res.status(200).send({
                    error: false, 
                    id: result[0].id,
                    username: result[0].username,
                    verified: result[0].verified
                })
            } catch (error) {
                res.status(500).send({
                    error: true, 
                    message: error.message
                })
            }
        })
    },
    resend: (req, res) => {
        let id = req.dataToken.id 
        db.query('SELECT * FROM user WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err
               
                if(result.length === 1){
                    let email = result[0].email
                    jwt.sign({id: id}, '123abc', (err, token) => {
                        try {
                            if(err) throw err

                            let query3 = 'UPDATE user SET token = ? WHERE id = ?'
                            db.query(query3, [token, id], (err1, result1) => {
                                try {
                                    if(err1) throw err1
                                    
                                    fs.readFile('C:/My Project/jcwd-ls01-01-be/Public/Template/index.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
                                    
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({bebas: email, link:`${API_URL}/verification/${token}`})
        
                                            transporter.sendMail({
                                                from: 'apotakecare@mail.com',  
                                                to: email,
                                                subject: 'Email Verification',
                                                html: newTemplateResult
                                            })
                                            .then((response) => {
                                                res.status(200).send({
                                                    error: false, 
                                                    message: 'Please Check Email to Verify Your Account!'
                                                })
                                            })
                                            .catch((error) => {
                                                res.status(500).send({
                                                    error: false, 
                                                    message: error.message
                                                })
                                            })
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } catch (error) {
                            res.status(500).send({
                                error: true, 
                                message: error.message
                            })
                        }
                    })
                }else{
                    res.status(500).send({
                        error: true, 
                        message: 'Account Not Found'
                    })
                }
            } catch (error) {
                console.log(error)                
            }
        })
    },
  
    
}
