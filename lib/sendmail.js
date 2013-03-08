var nodemailer = require("nodemailer")
  , fs = require('fs')
  , config = require( __dirname + '/config' )
  , version = require( __dirname + '/version' );

function deliver( options, callback ){
  var smtpTransport = nodemailer.createTransport("SMTP", config.mailerSettings );

  console.log('sending mail to: ', options.to );
  console.log(options.html || options.text);
  var mailOptions = {
      from: config.mailerFrom,
      to: options.to,
      subject: options.subject,
      headers: {
        'X-Mailer': 'ioco sendmail (by TASTENWERK) v'+version
      }
  }
  if( options.html )
    mailOptions.html = options.html;
  if( options.text )
    mailOptions.text = options.text;
  else
    mailOptions.generateTextFromHTML = true;
  if( options.bcc )
    mailOptions.bcc = options.bcc;

  smtpTransport.sendMail(mailOptions, function(err, response){
      smtpTransport.close();
      callback( err, response );
  });
}

module.exports = exports = { deliver: deliver };