var World = require("./world");

function WorldManager() {
    this.worldCache = {};
}

WorldManager.prototype.initialize = function(app, ensureAuthenticated, db) {
    var self = this;
    
    app.get("/api/world/list", ensureAuthenticated, function(req, res) {
      self.sendWorldList(req, res, db);
    });

    console.log("Loading Worlds...");

    return new Promise(function(resolve, reject) {
        self.loadAllWorlds(db)
        .then(function(success) {
            console.log("Worlds loaded");
            resolve(success);
        })
        .catch(function(error) {
            console.log(error);
            reject(error);
        });
    });
}

WorldManager.prototype.worldCache = {};

WorldManager.prototype.loadAllWorlds = function(db) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT * " + 
                    "FROM world";
        var inputs = {};
        
        db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            else {
                for (var i = 0; i < rows.length; i++) {
                    var world = new World(rows[i]);
                    self.worldCache[rows[i].id] = world;
                }

                resolve();
            }
        });
    });
}

/**
 * Loads information about a world
 * @param db Database connection
 * @param id Id of the world to load
 * @return Promise that sends the world as a parameter on success
 */
WorldManager.prototype.loadWorld = function(db, id) {
    this.loadCachedWorld();
}

WorldManager.prototype.getWorld = function(id) {
    if (this.worldCache[id]) {
        return this.worldCache[id];
    } else {
        return null;
    }
}

WorldManager.prototype.sendWorldList = function(req, res, db) {
    this.getWorldList(db)
    .then(function(worlds) {
        res.json({success: true, authenticated: true, worlds: worlds});
    })
    .catch(function(error) {
       res.json({success: false, authenticated: true, error: error}); 
    });
}

WorldManager.prototype.getWorldList = function(db) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT w.*, r.id rid, r.name rname, r.description rdescription " + 
                    "FROM world w " +
                    "LEFT JOIN room r " +
                    "   ON r.world = w.id";
        
        db.query(query, {}, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            else {
                var worlds = {};
                
                for (var i = 0; i < rows.length; i++) {
                    if (worlds[rows[i].id] == undefined) {
                        worlds[rows[i].id] = new World(rows[i]);
                    }
                    
                    worlds[rows[i].id].addRoom(rows[i]);
                }
                
                resolve(worlds);
            }
        });
    });
}

var _instance = null;

if (!_instance) {
    _instance = new WorldManager();
}

module.exports = _instance;