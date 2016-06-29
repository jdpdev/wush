var users = require("./users");
var UserManager = new users();

var _PoseNotifier = null;

/**
 * The PoseNotifier gathers new poses at a certain interval, and sends notification emails
 * to users that new poses have occurred in rooms they have characters in.
 * @param {EmailManager} emailManager 	The email gateway
 * @param {PoseManager} poseManager 	The pose manager
 */
var PoseNotifier = function(emailManager, poseManager, roomManager, db) {
	_PoseNotifier = this;

	this._db = db;
	this._emailManager = emailManager;
	this._poseManager = poseManager;
	this._roomManager = roomManager;
}

PoseNotifier.prototype.start = function() {
	var self = this;
	this._lastUpdate = new Date();

	//console.log("start pose notifier loop");
	setInterval(function() { self.emailInterval(); }, 10000/*3600000*/);
}

/**
 * The loop. First step: find all poses made since the last run.
 */
PoseNotifier.prototype.emailInterval = function() {
	var self = this;
	var timestamp = this._lastUpdate.getFullYear() + "-" + (this._lastUpdate.getMonth() + 1) + "-" + this._lastUpdate.getDate() + " " +
					this._lastUpdate.getHours() + ":" + this._lastUpdate.getMinutes() + ":" + this._lastUpdate.getSeconds();
	this._lastUpdate = new Date();
	
	//console.log("emailInterval @ " + this._lastUpdate.toLocaleString() + " (" + timestamp + ")");

	this._poseManager.loadAllSince(this._db, timestamp)
	.then(function(poses) {

		// Have a map of poses indexed to the room they belong to.
		self.loadCharacters(poses);
	})
	.catch(function(error) {
		console.error("emailInterval >> " + error);
	});

    
}

/**
 * Determine what characters have unread poses
 * @param  {Object} poses Arrays of poses mapped to room ids
 */
PoseNotifier.prototype.loadCharacters = function(poses) {
	//console.log(poses.length + " rooms with poses since last digest");

	if (poses.length == 0) {
		return;
	}

	var self = this;
	var roomIds = [];

	for (var key in poses) {
		roomIds.push(key);
		//console.log(poses[key].length + " poses in room " + key);

		this._roomManager.loadRoomMembersBatch(this._db, roomIds)
		.then(function(roomChars) {

			// Now have a map of poses per room (poses), and a map of characters per room (roomChars)
			// Now associate poses to characters
			var charPoses = {};

			for (var room in roomChars) {
				//console.log("- Chars in room " + room);

				// loop through characters in a room
				for (var i = 0; i < roomChars[room].length; i++) {
					//console.log("-- Char " + roomChars[room]);

					var roomPoses = poses[room];
					var poseList = [];

					// Loop through poses in the room
					// Only include poses after the character's last seen
					for (var j = 0; j < roomPoses.length; j++) {
						//console.log("--- Pose: " + roomPoses[j].timestamp + ", lastseen: " + roomChars[room][i].lastseen);

						if (roomPoses[j].timestamp > roomChars[room][i].lastseen) {
							poseList.push(roomPoses[j]);
						}
					}
					
					// Store poses to send by character owner
					if (poseList.length > 0) {
						if (!charPoses[roomChars[room][i].owner]) {
							charPoses[roomChars[room][i].owner] = poseList;
						} else {
							charPoses[roomChars[room][i].owner] = charPoses[roomChars[room][i].owner].concat(poseList);
						}
					}
				}
			}

			// Now know what users need to be sent the email
			//console.log(JSON.stringify(charPoses));

			self.sendPoses(charPoses);
		})
		.catch(function(error) {
			console.error("loadCharacters >> " + error);
		})
	}
}

/**
 * Alert the given user that they have missed poses
 * @param  {object} poseList An object of pose arrays mapped to user ids
 */
PoseNotifier.prototype.sendPoses = function(poseList) {
	var self = this;

	for (var userId in poseList) {

		UserManager.findById(this._db, userId, function(err, user) {
			if (err) {
				console.error(err);
				return;
			}

			// Organize poses by room
			var roomPoses = {};

			for (var i = 0; i < poseList[userId].length; i++) {
				if (!roomPoses[poseList[userId][i].room]) {
					roomPoses[poseList[userId][i].room] = [];
				}

				roomPoses[poseList[userId][i].room].push(poseList[userId][i]);
			}

			// Construct the email
			var content = "<div><h3>While you were away...</h3></div>";

			for (var roomId in roomPoses) {
				var room = self._roomManager.loadCachedRoom(roomId);
				var text = "";

				if (!room || !room.world) {
					continue;
				}

				text = "<div style='padding: 5px; width: 100%; color:#" + self.getContrastColor(room.world.color) + "; background-color:#" + room.world.color + "'>" + room.room.name + " (" + room.world.name + ")</div>"

				for (var i = 0; i < roomPoses[roomId].length; i++) {
					text += "<div><b>" + roomPoses[roomId][i].characterName + "</b> " + roomPoses[roomId][i].text +  "</div>";
				}

				content += text;
			}

			self._emailManager.sendMessage(user.email, "New WUSH Activity", content);
		});
	}
}

PoseNotifier.prototype.getContrastColor = function(bg) {
	if (hexToLuminosity(bg) >= 0.5) {
		return "000";
	} else {
		return "fff";
	}
}

/**
 * Returns a hex color code to rbg values
 * @param  {string} hex The hex color
 * @return {Object}     The color as an object with members r, g, and b normalized to [0,255]
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Converts a hex color code to an approximate luminosity value
 * @param  {string} hex The hex color
 * @return {number}     An approximate luminosity value normalized to [0,1]
 */
function hexToLuminosity(hex) {
    var rgb = hexToRgb(hex);
    
    if (rgb == null) {
        return 0;
    } else {
        return (rgb.r * 0.2 + rgb.g * 0.6 + rgb.b * 0.1) / 255;
    }
}

module.exports = PoseNotifier;