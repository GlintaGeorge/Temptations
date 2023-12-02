const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'glintageorge21@gmail.com', 
    pass: 'rdxe rtsl arli maml'
  }
});
module.exports = transporter;
