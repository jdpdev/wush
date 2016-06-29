var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;

var SMTPEmail = function() {
	console.log("using SMTPEmail");

	var fs = require("fs");
	var contents = fs.readFileSync("config/smtp-config.json");
	var config = JSON.parse(contents);

	this._transporter = nodemailer.createTransport({
		pool: true,
	    host: config.host,
	    port: config.port,
	    secure: config.secure, // use SSL
	    auth: {
	        user: config.user,
	        pass: config.password
	    },
	    authMethod: "password"
	});

	this._transporter.use('compile', htmlToText());
}

SMTPEmail.prototype.sendMessage = function(to, from, subject, html) {
	return new Promise(function(resolve, reject) {
		this._transport.sendMail(
			{
				from: from,
				to: to,
				subject: subject,
				html: html,
			}, 
			function (err, info) {
				if (err) {
					reject(err);
				}
				else {
					resolve(info);
				}
			}
		);
	};
}

module.exports = MailgunEmail;