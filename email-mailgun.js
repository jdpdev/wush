var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;
var mg = require('nodemailer-mailgun-transport');

var MailgunEmail = function() {
	console.log("using MailgunEmail");

	var fs = require("fs");
	var contents = fs.readFileSync("config/mailgun-config.json");
	var config = JSON.parse(contents);

	var auth = {
		auth: {
			api_key: config.auth.apikey,
			domain: config.auth.domain
		}
	}

	this._transport = nodemailer.createTransport(mg(auth));
	this._transport.use('compile', htmlToText());
}

MailgunEmail.prototype.sendMessage = function(to, from, subject, html) {

	//return new Promise(function(resolve, reject) {
		this._transport.sendMail(
			{
				from: from,
				to: to,
				subject: subject,
				html: html
			}, 
			function (err, info) {
				if (err) {
					console.log("mailgun error >> " + JSON.stringify(err));
					//reject(err);
				}
				else {
					//console.log("mailgun success >> " + info);
					//resolve(info);
				}
			}
		);
	//});
}

module.exports = MailgunEmail;