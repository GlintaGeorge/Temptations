const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'georgeglinta@gmail.com', 
    pass: 'nxcu vvum hiyl jmoz'
  }
});
module.exports = transporter;
