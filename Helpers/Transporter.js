const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ichajust2@gmail.com',
        pass: 'wjzwtogkjqxkngyh' 
    },
    tls: {
        rejectUnauthorized: false
    }
})

module.exports = transporter