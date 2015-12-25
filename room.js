var Character = require("./character");
var PoseManager = require("./poseManager");
PoseManager = new PoseManager();

/**
 *  Create a new room object from the database.
 * @param row Row from the database
 * @return A new Room object
 */
var Room = function(row) {
    this.id = row.id;
    this.name = row.name;
    this.description = row.description;
    this.worldId = row.world;
}

/**
 * Returns a list of players in a room
 * @param db The database to call
 * @return A promise
 */
Room.prototype.getMembers = function(db) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT c.*, l.entertime " + 
                    "FROM locations l " +
                    "LEFT JOIN characters c " +
                    "ON c.id = l.character " +
                    "WHERE ? and l.exittime is null " +
                    "ORDER BY l.entertime desc";
        var inputs = {"l.room": self.id};
        
        var test = db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            // Load character objects
            else {
                var chars = [];
                
                for (var i = 0; i < rows.length; i++) {
                    chars.push(new Character(rows[i]));
                }
                
                resolve(chars);
            }
        }); 
        
        console.log(test.sql);
    });
}

module.exports = Room;