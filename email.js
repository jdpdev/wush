
/**
 * Gateway for sending emails to universe participants.
 * @param {Object} serverConfig Email configuration
 */
var EmailManager = function() {
	
}

EmailManager.prototype.config = function(serverConfig) {
	this._sendEmails = serverConfig.send;
	this._serverConfig = serverConfig;
	this._emailModule = null;

	if (serverConfig.module) {
		var emailVersion = require("./" + serverConfig.module);
		this._emailModule = new emailVersion();
	} else {
		console.log("Not using email");
	}
}

EmailManager.prototype.sendMessage = function(to, subject, html) {
	if (!this._sendEmails || !this._emailModule) {
		return;
	}

	this._emailModule.sendMessage(to, this._serverConfig.from, subject, html);
}

var _instance = null;

if (!_instance) {
	_instance = new EmailManager();
}

module.exports = _instance;