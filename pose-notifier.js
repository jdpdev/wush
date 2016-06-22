var _PoseNotifier = null;


/**
 * The PoseNotifier gathers new poses at a certain interval, and sends notification emails
 * to users that new poses have occurred in rooms they have characters in.
 * @param {EmailManager} emailManager 	The email gateway
 * @param {PoseManager} poseManager 	The pose manager
 */
var PoseNotifier = function(emailManager, poseManager, roomManager, db) {
	_PoseNotifier = this;

	this._lastUpdate = new Date();
	this._db = db;
	this._poseManager = poseManager;
	this._roomManager = roomManager;
}

PoseNotifier.prototype.start = function() {
	var self = this;

	console.log("start pose notifier loop");
	setInterval(function() { self.emailInterval(); }, 10000/*3600000*/);
}

/**
 * The loop. First step: find all poses made since the last run.
 */
PoseNotifier.prototype.emailInterval = function() {
	var self = this;
	var timestamp = this._lastUpdate.getFullYear() + "-" + this._lastUpdate.getMonth() + "-" + this._lastUpdate.getDate() + " " +
					this._lastUpdate.getHours() + ":" + this._lastUpdate.getMinutes() + ":" + this._lastUpdate.getSeconds();
	
	console.log("emailInterval @ " + timestamp);

	this._poseManager.loadAllSince(this._db, timestamp)
	.then(function(poses) {

		// Have a map of poses indexed to the room they belong to.
		self.loadCharacters(poses);
	})
	.catch(function(error) {
		console.error(error);
	});

    this._lastUpdate = new Date();
}

/**
 * Determine what characters have unread poses
 * @param  {Object} poses Arrays of poses mapped to room ids
 */
PoseNotifier.prototype.loadCharacters = function(poses) {
	var roomIds = [];

	for (var key in poses) {
		roomIds.push(key);

		this._roomManager.loadRoomMembersBatch(db, roomIds)
		.then(function(roomChars) {

			// Now have a map of poses per room, and a map of characters per room
			// Now associate poses to characters
			var charPoses = {};

			for (var room in roomChars) {

				// loop through characters in a room
				for (var i = 0; i < roomChars[room].length; i++) {
					var roomPoses = poses[room];
					var poseList = [];

					// Loop through poses in the room
					// Only include poses after the character's last seen
					for (var j = 0; j < roomPoses.length; j++) {
						if (roomPoses[j].timestamp > roomChars[room][i].lastseen) {
							poseList.push(roomPoses[j]);
						}
					}
					
					charPoses[roomChars[room][i].id] = poseList;
				}
			}

			// Now know what characters need to be sent what poses
			// Convert to users
		})
		.catch(function(error) {
			console.error(error);
		})
	}
}

module.exports = PoseNotifier;