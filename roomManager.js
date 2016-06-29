var Room = require("./room");
var Character = require("./character");
var PoseManager = require("./poseManager");
PoseManager = new PoseManager();

module.exports = RoomManager;

function RoomManager(universe) {
    this.roomCache = {};
    this.io = null;
    this._universe = universe;
    this._worldManager = universe.getWorldManager();
}

// Initialize all routing calls handled by the mananger
RoomManager.prototype.initialize = function(app, ensureAuthenticated, db) {
    var self = this;
    
    app.get("/api/room/info", ensureAuthenticated, function(req, res) {
      self.sendRoomInfo(req, res, db);
    });
    
    app.get("/api/room/members", ensureAuthenticated, function(req, res) {
      self.loadRoomMembers(req, res, db);
    });
    
    app.get("/api/room/poses", ensureAuthenticated, function(req, res) {
      self.loadRoomPoses(req, res, db);
    });
    
    app.post("/api/room/relocate", ensureAuthenticated, function(req, res) {
      self.relocateCharacter(req, res, db);
    });

    console.log("Loading rooms...");

    return new Promise(function(resolve, reject) {
        self.loadAllRooms(db)
        .then(function(success) {
            console.log("Rooms loaded");
            resolve(success);
        })
        .catch(function(error) {
            reject(error);
        });
    });
}

RoomManager.prototype.setSocket = function(io) {
    this.io = io;
}

/**
 * Handle a request for room info.
 * @param {req} req The request
 * @param {res} res The response
 * @param {mysql} db Database connection
 */
RoomManager.prototype.sendRoomInfo = function(req, res, db) {
    this.loadRoom(db, req.query.id)
    .then(function(info) {
        res.json({success: true, authenticated: true, room: info.room, world: info.world});
    })
    .catch(function(error) {
        res.json({success: false, authenticated: true, error: error});
    });
}

/**
 * Loads information about a room
 * @param db Database connection
 * @param id Id of the room to load
 * @return Promise that sends the room as a parameter on success
 */
RoomManager.prototype.loadRoom = function(db, id) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        if (self.roomCache[id] != undefined) {
            //resolve({room: self.roomCache[id], world: });
            var room = self.roomCache[id];
            
            resolve({room: room, world: self._worldManager.getWorld(room.worldId)});
            return;
        }    
        
        var query = "SELECT * " + 
                    "FROM room " +
                    "WHERE ?";
        var inputs = {"id": id};
        
        db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            else if (rows.length != 1) {
                reject("Unable to load room.");
            }
            
            // Load the room and its associated world
            else {
                var room = new Room(rows[0]);
                self.roomCache[id] = room;
                
                self._worldManager.loadWorld(db, room.worldId)
                .then(function(world) {
                    resolve({room: room, world: world});  
                })
                .catch(function(error) {
                    resolve({room: room, error: error}); 
                });
            }
        });
    });
}

/**
 * Load and cache all of the rooms
 * @param db Database connection
 * @return Promise that sends the room as a parameter on success
 */
RoomManager.prototype.loadAllRooms = function(db) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "SELECT * " + 
                    "FROM room ";
        var inputs = {};
        
        db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            // Load the room and its associated world
            else {
                for (var i = 0 ; i < rows.length; i++) {
                    var room = new Room(rows[i]);
                    self.roomCache[room.id] = room;
                }

                resolve(true);
            }
        });
    });
}

/**
 * Directly load a room from the cache
 * @param  {number} id The id of the room to load
 * @return {Room}    The room, or null on error
 */
RoomManager.prototype.loadCachedRoom = function(id) {
    if (!this.roomCache[id]) {
        return null;
    } else {
        return {room: this.roomCache[id], world: this._worldManager.getWorld(this.roomCache[id].worldId)};
    }
}

RoomManager.prototype.loadRoomMembers = function(req, res, db) {
    this.loadRoom(db, req.query.id)
    .then(function(info) {
        //res.json({success: true, authenticated: true, characters: info});
        
        info.room.getMembers(db)
            .then(function(chars) {
                res.json({success: true, authenticated: true, characters: chars});
            })
            .catch(function(error) {
                res.json({success: false, authenticated: true, error: error});       
            });
    })
    .catch(function(error) {
        res.json({success: false, authenticated: true, error: error});
    });
};

/**
 * Load the members for a set of rooms
 * @param  {[type]} db      The database pool
 * @param  {Array} roomIds  Array of room ids to get the members of
 * @return {Object}         Promise that returns object with arrays of characters mapped to room ids
 */
RoomManager.prototype.loadRoomMembersBatch = function(db, roomIds) {
    var query = "SELECT c.*, l.room FROM locations l LEFT JOIN characters c on c.ID = l.character WHERE l.room in (" + roomIds.join(",") + ") and l.exittime is null";

    return new Promise(function(resolve, reject) {
        db.query(query, {}, function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                var rooms = {};

                for (var i = 0; i < rows.length; i++) {
                    if (!rooms[rows[i].room]) {
                        rooms[rows[i].room] = [];
                    }

                    rooms[rows[i].room].push(new Character(rows[i]));
                }

                resolve(rooms);
            }
        })
    });
};

RoomManager.prototype.loadRoomPoses = function(req, res, db) {
    
    // Get poses since a date
    if (req.query.timestamp != undefined) {
        PoseManager.loadFromRoomSince(db, req.query.id, req.query.timestamp, req.user.id)
        .then(function(poses) {
            res.json({success: true, authenticated: true, poses: poses});
        })
        .catch(function(error) {
            res.json({success: true, authenticated: true, error: error});
        });   
    }
    
    // Get the last X poses
    else {
        PoseManager.loadFromRoom(db, req.query.id, 10, req.user.id)
        .then(function(poses) {
            res.json({success: true, authenticated: true, poses: poses});
        })
        .catch(function(error) {
            res.json({success: true, authenticated: true, error: error});
        }); 
    }
};

// Relocate a character into this room
RoomManager.prototype.relocateCharacter = function(req, res, db) {
    // TODO authenticate user to character
    var self = this;
    
    //return new Promise(function(resolve, reject) {
        var update = "UPDATE locations SET exittime=NOW() where exittime IS NULL AND ?";
        var updateInput = {"character": req.body.character};
        
        db.query(update, updateInput, function(err, result) {
            
            if (err) {
                res.json({success: false, authenticated: true, error: err});
                return;
            }
          
            var query = "INSERT INTO locations SET entertime=NOW(), ?";
            var inputs = {"character": req.body.character, "room": req.body.room};
            
            db.query(query, inputs, function(err2, result2) {
               if (err2) {
                   res.json({success: false, authenticated: true, error: err2});
               } else {
                   res.json({success: true, authenticated: true});
               }
            });
        });
    //});
};