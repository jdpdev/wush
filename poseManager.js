var escapeHtml = require('escape-html');
var Pose = require("./pose");

var _instance = null;

var PoseManager = function() {
    
}

PoseManager.prototype.io = null;

PoseManager.prototype.initialize = function(app, ensureAuthenticated, db) {
    var self = this;
    this.io = null;
 
    // Params: character, room, pose
    app.post("/api/pose/add", ensureAuthenticated, function(req, res) {
      // TODO authenticate user to characters, and characters to room
      
      self.sendNewPose(req, res, db);
    });   

    return new Promise(function(resolve, reject) {
        resolve(true);
    });
}

PoseManager.prototype.setSocket = function(io) {
    this.io = io;
}

/**
 * Loads a list of all poses made since a given timestamp
 * @param db Database connection
 * @param timestamp Time to get all poses after, in MySQL "Y-m-d H:i:s"
 * @return Promise that sends a map of poses to room ids
 */
PoseManager.prototype.loadAllSince = function(db, timestamp) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT p.*, c.id as characterId, c.name as characterName, c.owner as ownerId, c.lastseen " + 
                    "FROM poses p " +
                    "LEFT JOIN characters c " +
                    "   ON c.id = p.character " +
                    "WHERE p.timestamp >= " + db.escape(timestamp) + " " +
                    "ORDER BY p.timestamp DESC";

        db.query(query, {}, function(err, rows, fields) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                var poses = {};
                
                for (var i = 0; i < rows.length; i++) {
                    if (!poses[rows[i].room]) {
                        poses[rows[i].room] = [];
                    }

                    poses[rows[i].room].push(new Pose(rows[i]));
                }
                
                resolve(poses);
            }
        });
    });
}

/**
 * Loads a list of recent poses from a room since a certain time
 * @param db Database connection
 * @param id Id of the room to get the poses from
 * @param timestamp Time to get all poses after
 * @param character Id of the character the poses are being pulled for
 * @return Promise that sends an array of poses
 */
PoseManager.prototype.loadFromRoomSince = function(db, id, timestamp, character) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT p.*, c.id as characterId, c.name as characterName " + 
                    "FROM poses p " +
                    "LEFT JOIN characters c " +
                    "   ON c.id = p.character " +
                    "WHERE p.room = " + db.escapeId(id) + " " +
                    "   AND p.timestamp >= '" + db.escape(timestamp) + "' " +
                    "ORDER BY p.timestamp DESC";
        
        db.query(query, {}, function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                var poses = [];
                
                for (var i = 0; i < rows.length; i++) {
                    poses.push(new Pose(rows[i]));
                }
                
                resolve(poses);
                
                self.updateLastSeen(db, character);
            }
        });
    });
}

/**
 * Loads a list of recent poses from a room
 * @param db Database connection
 * @param id Id of the room to get the poses from
 * @param count The max number of poses to get
 * @param user Id of the user the poses are being pulled for
 * @return Promise that sends an array of poses
 */
PoseManager.prototype.loadFromRoom = function(db, id, count, user) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT p.*, c.id as characterId, c.name as characterName " + 
                    "FROM poses p " +
                    "LEFT JOIN characters c " +
                    "   ON c.id = p.character " +
                    "WHERE p.room = " + parseInt(id) + " " +
                    "ORDER BY p.timestamp DESC " + 
                    "LIMIT 0," + db.escape(count);
        
        db.query(query, {}, function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                var poses = [];
                
                for (var i = 0; i < rows.length; i++) {
                    poses.push(new Pose(rows[i]));
                }
                
                resolve(poses);
                
                self.updateOwnerLastSeen(db, user, id);
            }
        });
    });
}

// Params: character, room, pose
PoseManager.prototype.sendNewPose = function(req, res, db) {
    this.addPose(db, req.body.character, req.body.room, req.body.pose)
    .then(function(poseId) {
        res.json({success: true, authenticated: true, id: poseId});
    })
    .catch(function(error) {
        res.json({success: false, authenticated: true, error: error});
    });
}

PoseManager.prototype.addPose = function(db, character, room, text) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "INSERT INTO poses SET timestamp=NOW(), ?";
        var params = {room: room, character: character, text: text};
        
        var dbquery = db.query(query, params, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result.insertId);
                
                // Update the last seen date
                //self.updateCharacterLastSeen(db, character);
                var poseQuery = "SELECT p.*, c.id as characterId, c.name as characterName " + 
                                "FROM poses p " +
                                "LEFT JOIN characters c " +
                                "   ON c.id = p.character " +
                                "WHERE p.id = " + result.insertId;
                                
                db.query(poseQuery, {}, function(err, rows, fields) {
                    if (!err) {
                        self.broadcastPose(room, rows[0].characterId, rows[0].characterName, rows[0].id, rows[0].text, rows[0].timestamp);
                    }
                });
            }
        });
    });
}

PoseManager.prototype.broadcastPose = function(room, charId, character, id, pose, time) {
    this.io.sockets["in"](room).emit("newpose", {character: charId, characterName: character, id: id, text: pose, timestamp: time});
}

// Updates the lastseen time for characters owned by a user in a room
PoseManager.prototype.updateOwnerLastSeen = function(db, owner, room) {
    var self = this;
    var query = "SELECT l.character " + 
                "FROM locations l " + 
                "LEFT JOIN characters c ON l.character = c.id " + 
                "WHERE l.exittime is null and l.room=" + db.escape(parseInt(room)) + " and c.owner=" + db.escape(owner);
    var params = {"l.room": room, "c.owner": owner};
    
    var request = db.query(query, {}, function(err, rows, fields) {
        if (err) {
            console.log(err.message);
        } else {
            var ids = [];
            
            for (var i = 0; i < rows.length; i++) {
                ids.push(rows[i].character);
            }
            
            if (ids.length > 0) {
                var query = "UPDATE characters SET lastseen=NOW() where id in(" + ids.join() + ")";
                
                db.query(query, {}, function(err, result) {
                    if (err) {
                        
                    } else {
                        
                    }
                });
            }
        }
    });
}

// Update the lastseen time for the character 
PoseManager.prototype.updateCharacterLastSeen = function(db, character) {
    var query = "UPDATE characters SET lastseen=NOW() where ?";
    var params = {id: character};
    
    db.query(query, params, function(err, result) {
        if (err) {
            
        } else {
            
        }
    });
}

if (!_instance) {
    _instance = new PoseManager();
}

module.exports = _instance;