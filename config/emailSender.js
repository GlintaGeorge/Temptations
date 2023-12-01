const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'georgeglinta@gmail.com', 
    pass: 'axbz tkwg dzvg zuwz'
  }
});
module.exports = transporter;
