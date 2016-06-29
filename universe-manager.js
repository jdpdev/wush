var RoomManager = require("./roomManager");
var WorldManager = require("./worldManager");
var PoseManager = require("./poseManager");
var CharacterManager = require("./characterManager");
var PoseNotifier = require("./pose-notifier");

var _instance = null;

/**
 * The universe is the sum total of what makes up the game's setting: worlds, rooms, characters, and poses, and how
 * all of them interact. This class manages those objects and interactions.
 */
function UniverseManager() {
	this._worldManager = new WorldManager(this);
	this._roomManager = new RoomManager(this);
	this._characterManager = new CharacterManager(this);
	this._poseManager = new PoseManager(this);
	this._poseNotifier = null;
}

/**
 * 
 * @param {express} app                The express instance
 * @param {[type]} ensureAuthenticated Authentication check for all api calls
 * @param {[type]} db                  The database interface
 */
UniverseManager.prototype.initialize = function(app, ensureAuthenticated, db, email) {
	var self = this;

	// Universe configuration settings. These are shared with the client
	var fs = require("fs");
	var contents = fs.readFileSync("client/config.json");
	this._config = JSON.parse(contents);

	return new Promise(function(resolve, reject) {

	// Load worlds
		self._worldManager.initialize(app, ensureAuthenticated, db)
			.then(function(success) {

	// Load rooms
				self._roomManager.initialize(app, ensureAuthenticated, db)
				.then(function(success) {

	// Load Characters
					self._characterManager.initialize(app, ensureAuthenticated, db)
					.then(function(success) {

	// Load poses
						self._poseManager.initialize(app, ensureAuthenticated, db)
						.then(function(success) {

	// Pose notifier
							self._poseNotifier = new PoseNotifier(email, self._poseManager, self._roomMananger, db, self._config);
    						self._poseNotifier.start();

							resolve(true);
						})			
					});	
				});
			})
			.catch(function(error) {
				reject(error);
			});
	});
}

UniverseManager.prototype.setSocket = function(io) {
	this._roomManager.setSocket(io);
	this._poseManager.setSocket(io);
}

UniverseManager.prototype.getWorldManager = function() {
	return this._worldManager;
}

UniverseManager.prototype.getRoomManager = function() {
	return this._roomManager;
}

UniverseManager.prototype.getCharacterManager = function() {
	return this._characterManager;
}

UniverseManager.prototype.getPoseManager = function() {
	return this._poseManager;
}

// **** Exporting *****************************************************************

module.exports = UniverseManager;