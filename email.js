var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;
var mg = require('nodemailer-mailgun-transport');

/**
 * Gateway for sending emails to universe participants.
 * @param {Object} serverConfig SMTP server configuration
 */
var EmailManager = function(serverConfig) {
	this._sendEmails = serverConfig.send;
	this._serverConfig = serverConfig;

	var emailVersion = require("./" + serverConfig.module);
	this._emailModule = new emailVersion();

	// create reusable transporter object using the default SMTP transport
	/*this._transporter = nodemailer.createTransport({
		pool: true,
	    host: serverConfig.host,
	    port: serverConfig.port,
	    secure: false, // use SSL
	    auth: {
	        user: serverConfig.user,
	        pass: serverConfig.password
	    },
	    authMethod: "password"
	});

	this._transporter.use('compile', htmlToText());*/
}

EmailManager.prototype.sendMessage = function(to, subject, html) {
	if (!this._sendEmails) {
		return;
	}

	//this.mailgunSendMessage(to, subject, html);
	this._emailModule.sendMessage(to, subject, html)
	.then(function(response) {

	})
	.catch(function(error) {
		console.error("EmailManager::sendMessage error >> " + JSON.stringify(error));
	});
}

EmailManager.prototype.smtpSendMessage = function(to, subject, html) {
	var options = {
		from: "",
		to: to,
		subject: subject,
		html: html
	};

	this._transporter.sendMail(options, function(error, info){
	    if(error){
	        return console.error(error);
	    }
	    console.log('Message sent: ' + info.response);
	});
}

module.exports = EmailManager;