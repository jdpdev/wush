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
		WorldManager.initialize(app, ensureAuthenticated, db)
			.then(function(success) {

	// Load rooms
				RoomManager.initialize(this, app, ensureAuthenticated, db)
				.then(function(success) {

	// Load Characters
					CharacterManager.initialize(app, ensureAuthenticated, db)
					.then(function(success) {

	// Load poses
						PoseManager.initialize(app, ensureAuthenticated, db)
						.then(function(success) {

	// Pose notifier
							self._poseNotifier = new PoseNotifier(db, self._config);
    						self._poseNotifier.start();

							resolve(true);
						}).catch(function(error) {
							console.error(error);
							reject(error);
						});
					});	
				});
			});/*
			.catch(function(error) {
				reject(error);
			});*/
	});
}

UniverseManager.prototype.getPoseManager = function() {
	return PoseManager;
}

UniverseManager.prototype.setSocket = function(io) {
	RoomManager.setSocket(io);
	PoseManager.setSocket(io);
}

// **** Exporting *****************************************************************

if (!_instance) {
	console.log("Creating new UniverseManager");
	_instance = new UniverseManager();
}

console.log("Importing UniverseManager");
module.exports = _instance;
