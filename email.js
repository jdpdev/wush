
/**
 * Gateway for sending emails to universe participants.
 * @param {Object} serverConfig Email configuration
 */
var EmailManager = function() {
	
}

EmailManager.prototype.config = function(serverConfig) {
	this._sendEmails = serverConfig.send;
	this._serverConfig = serverConfig;

	var emailVersion = require("./" + serverConfig.module);
	this._emailModule = new emailVersion();
}

EmailManager.prototype.sendMessage = function(to, subject, html) {
	if (!this._sendEmails) {
		return;
	}

	//this.mailgunSendMessage(to, subject, html);
	this._emailModule.sendMessage(to, this._serverConfig.from, subject, html);/*
	.then(function(response) {

	})
	.catch(function(error) {
		console.error("EmailManager::sendMessage error >> " + JSON.stringify(error));
	});*/
}

var _instance = null;

if (!_instance) {
	_instance = new EmailManager();
}

module.exports = _instance;