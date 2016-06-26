var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;

/**
 * Gateway for sending emails to universe participants.
 * @param {Object} serverConfig SMTP server configuration
 */
var EmailManager = function(serverConfig) {
	this._sendEmails = serverConfig.send;

	// create reusable transporter object using the default SMTP transport
	this._transporter = nodemailer.createTransport({
		pool: true,
	    host: serverConfig.host,
	    port: serverConfig.port,
	    secure: true, // use SSL
	    auth: {
	        user: serverConfig.user,
	        pass: serverConfig.password
	    }
	});

	this._transporter.use('compile', htmlToText());
}

EmailManager.prototype.sendMessage = function(to, subject, html) {
	if (!this._sendEmails) {
		return;
	}

	//console.log("sendMessage " + to + " >> (" + subject + ") " + html);

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