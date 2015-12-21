var Pose = require("./pose");

var PoseManager = function() {
    
}

/**
 * Loads a list of recent poses from a room since a certain time
 * @param db Database connection
 * @param id Id of the room to get the poses from
 * @param timestamp Time to get all poses after
 * @return Promise that sends an array of poses
 */
PoseManager.prototype.loadFromRoomSince = function(db, id, timestamp) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT p.*, c.name as characterName " + 
                    "FROM poses p " +
                    "LEFT JOIN characters c " +
                    "   ON c.id = p.character " +
                    "WHERE p.room = " + db.escapeId(id) + " " +
                    "   AND p.timestamp >= " + db.escape(timestamp) + " " +
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
            }
        });
    });
}

/**
 * Loads a list of recent poses from a room
 * @param db Database connection
 * @param id Id of the room to get the poses from
 * @param count The max number of poses to get
 * @return Promise that sends an array of poses
 */
PoseManager.prototype.loadFromRoom = function(db, id, count) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT p.*, c.name as characterName " + 
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
            }
        });
    });
}

module.exports = PoseManager;