var nodemailer = require('nodemailer');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'enayetflweb@gmail.com',
    pass: 'gjfd lwpw exjn kagq'
  }
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'enayetflweb@gmail.com',
    to,
    subject,
    text
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendEmail }