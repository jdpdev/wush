var World = require("./world");

module.exports = WorldManager;

function WorldManager() {
    //this.worldCache = {};
}

WorldManager.prototype.worldCache = {};

/**
 * Loads information about a world
 * @param db Database connection
 * @param id Id of the world to load
 * @return Promise that sends the world as a parameter on success
 */
WorldManager.prototype.loadWorld = function(db, id) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        if (self.worldCache[id] != undefined) {
            resolve(self.worldCache[id]);
            return;
        }    
        
        var query = "SELECT * " + 
                    "FROM world r " +
                    "WHERE ?";
        var inputs = {"id": id};
        
        db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            else if (rows.length != 1) {
                reject("Unable to load world.");
            }
            
            else {
                var world = new World(rows[0]);
                self.worldCache[id] = world;
                resolve(world);
            }
        });
    });
}