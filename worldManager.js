var escapeHtml = require('escape-html');
var World = require("./world");

function WorldManager() {
    this.worldCache = {};
}

WorldManager.prototype.initialize = function(universe, app, ensureAuthenticated, db) {
    var self = this;
    
    this.universe = universe;

    app.get("/api/world/list", ensureAuthenticated, function(req, res) {
      self.sendWorldList(req, res, db);
    });
    
    app.get("/api/world", ensureAuthenticated, function(req, res) {
      self.sendWorldInfo(req, res, db);
    });
    
    app.post("/api/world", ensureAuthenticated, function(req, res) {
      self.sendCreateWorld(req, res, db);
    });
    
    app.post("/api/world/edit", ensureAuthenticated, function(req, res) {
      self.sendEditWorld(req, res, db);
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

WorldManager.prototype.cacheWorld = function(id, name, description, color) {
    var world = new World({id: id, name: name, description: description, color: color});
    this.worldCache[id] = world;
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

WorldManager.prototype.sendWorldInfo = function(req, res, db) {
    this.getWorldDetails(req.query.id)
    .then(function(info) {
        res.json({success: true, authenticated: true, world: info.world, rooms: info.rooms});
    })
    .catch(function(error) {
        console.error(error);
       res.json({success: false, authenticated: true, error: error}); 
    });
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

WorldManager.prototype.sendCreateWorld = function(req, res, db) {
    // Actually an edit
    if (req.body.id) {
        this.sendEditWorld(req, res, db);
    } else {
        this.createWorld(db, req.body.creator, req.body.name, req.body.description, req.body.color)
            .then(function(id) {
                res.json({success: true, authenticated: true, id: id});
            })
            .catch(function(error) {
               res.json({success: false, authenticated: true, error: error}); 
            });
    }
}

WorldManager.prototype.sendEditWorld = function(req, res, db) {
    this.editWorld(db, req.user.id, req.body.id, req.body.name, req.body.description, req.body.color)
    .then(function(id) {
        res.json({success: true, authenticated: true});
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

WorldManager.prototype.getWorldDetails = function(id) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var world = self.getWorld(id);

        if (world == null) {
            console.error("World " + id + " does not exist!");
            reject("World does not exist");
            return;
        }

        // Get the rooms for the world
        var rooms = self.universe.getRoomManager().getRoomsInWorld(id);
        resolve({world: world, rooms: rooms});
    });
}

WorldManager.prototype.createWorld = function(db, creator, name, description, color) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        // TODO Permissions
    
        var query = "INSERT INTO world SET ?";
        var params = {creator: creator, name: escapeHtml(name), description: escapeHtml(description), color: color};
        
        db.query(query, params, function(err, result) {
            console.log(query);
            if (err) {
                reject(err);
            } else {
                self.cacheWorld(result.insertId, name, description, color);
                resolve(result.insertId);
            }
        });
    });
}

WorldManager.prototype.editWorld = function(db, userId, id, name, description, color) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "UPDATE world SET ? where id = " + id;
        var params = {name: escapeHtml(name), description: escapeHtml(description), color: color};

        // TODO Permissions
        var world = self.getWorld(id);

        if (world.creator != userId) {
            reject("You do not have permission to edit this world.");
            return;
        }

        db.query(query, params, function(err, result) {
            if (err) {
                reject(err);
            } else {
                for (var worldId in self.worldCache) {
                    if (worldId == id) {
                        self.worldCache[worldId].update(name, description, color);
                        resolve(true);
                        return;
                    }
                }

                reject("No world to update.");
            }
        });
    });
}

var _instance = null;

if (!_instance) {
    _instance = new WorldManager();
}

module.exports = _instance;