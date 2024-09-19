const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'georgeglinta@gmail.com', 
    pass: 'xqra cvmk efgd pqnr'
  }
});
module.exports = transporter;
