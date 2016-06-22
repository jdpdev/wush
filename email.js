var nodemailer = require('nodemailer');

/**
 * Gateway for sending emails to universe participants.
 * @param {Object} serverConfig SMTP server configuration
 */
var EmailManager = function(serverConfig) {
	// create reusable transporter object using the default SMTP transport
	this.transporter = nodemailer.createTransport({
		pool: true,
	    host: serverConfig.host,
	    port: serverConfig.port,
	    secure: true, // use SSL
	    auth: {
	        user: serverConfig.user,
	        pass: serverConfig.password
	    }
	});
}

module.exports = EmailManager;