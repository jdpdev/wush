var Room = require("./room");
var Character = require("./character");
var PoseManager = require("./poseManager");
var WorldManager = require("./worldManager");
var CharacterManager = require("./characterManager");
//PoseManager = new PoseManager();

function RoomManager() {
    this.roomCache = {};
    this.io = null;
}

// Initialize all routing calls handled by the mananger
RoomManager.prototype.initialize = function(universe, app, ensureAuthenticated, db) {
    var self = this;
    this._universe = universe;
    this._worldManager = WorldManager;
    
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
    
    app.post("/api/room", ensureAuthenticated, function(req, res) {
      self.sendCreateRoom(req, res, db);
    });

    console.log("Loading rooms...");

    return new Promise(function(resolve, reject) {
        self.loadAllRooms(db)
        .then(function(success) {
            console.log("Rooms loaded");
            resolve(success);
        })
        .catch(function(error) {
            console.log(error);
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

RoomManager.prototype.sendCreateRoom = function(req, res, db) {
    // Edit
    if (req.body.id) {
        this.editRoom(db, req.body.userId, req.body.id, req.body.name, req.body.description, req.body.worldId)
            .then(function(info) {
                res.json({success: true, authenticated: true});
            })
            .catch(function(error) {
                console.error(error);
                res.json({success: false, authenticated: true, error: error});
            });
    }

    // Create
    else {
        this.createRoom(db, req.body.creator, req.body.name, req.body.description, req.body.worldId)
            .then(function(info) {
                res.json({success: true, authenticated: true, id: info});
            })
            .catch(function(error) {
                console.error(error);
                res.json({success: false, authenticated: true, error: error});
            });
    }
}

/**
 * Loads information about a room
 * @param db Database connection
 * @param id Id of the room to load
 * @return Promise that sends the room as a parameter on success
 */
RoomManager.prototype.loadRoom = function(db, id) {
    var self = this;

    if (id == undefined) {
        return;
    }
    
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
                    console.log("Loaded room id " + room.id);
                }

                resolve(true);
            }
        });
    });
}

RoomManager.prototype.cacheRoom = function(id, name, description, world, creator) {
    var room = new Room(
            {
                id: id,
                name: name,
                description: description,
                worldId: world,
                creator: creator,
                createdTime: createdTime
            }
        );

    self.roomCache[id] = room;
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

RoomManager.prototype.createRoom = function(db, creator, name, description, worldid) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        // TODO Permissions
    
        var query = "INSERT INTO room SET ?";
        var params = {creator: creator, name: name, description: description, world: worldid};
        
        db.query(query, params, function(err, result) {
            if (err) {
                reject(err);
            } else {
                self.cacheRoom(result.insertId, name, description, world, creator);
                resolve(result.insertId);
            }
        });
    });
}

RoomManager.prototype.editRoom = function(db, userId, id, name, description, worldid) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var query = "UPDATE room SET ? where id = " + id;
        var params = {name: name, description: description, world: worldid};

        // TODO Permissions
        var room = self.loadCachedRoom(id);

        if (room.creator != userId) {
            reject("You do not have permission to edit this room.");
            return;
        }

        db.query(query, params, function(err, result) {
            if (err) {
                reject(err);
            } else {
                for (var roomId in self.roomCache) {
                    if (roomId == id) {
                        self.roomCache[roomId].update(name, description, worldid);
                        resolve(true);
                        return;
                    }
                }

                reject("No room to update.");
            }
        });
    });
}

/**
 * Returns a list of rooms in a world
 * @param  {number} worldId The id of the world
 * @return {Room[]}         The member rooms
 */
RoomManager.prototype.getRoomsInWorld = function(worldId) {
    var rooms = [];

    for (var id in this.roomCache) {
        if (this.roomCache[id].worldId == worldId) {
            rooms.push(this.roomCache[id]);
        }
    }

    return rooms;
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

            self.broadcastRoomLeave(req.body.room, req.body.character);
          
            var query = "INSERT INTO locations SET entertime=NOW(), ?";
            var inputs = {"character": req.body.character, "room": req.body.room};
            
            db.query(query, inputs, function(err2, result2) {
               if (err2) {
                   res.json({success: false, authenticated: true, error: err2});
               } else {
                    res.json({success: true, authenticated: true});
                    self.broadcastRoomEnter(req.body.room, req.body.character);
               }
            });
        });
    //});
};

RoomManager.prototype.broadcastRoomEnter = function(room, charid) {
    var character = CharacterManager.getCharacter(charid);
    this.io.sockets["in"](room).emit("characterenter", {character: character});
}

RoomManager.prototype.broadcastRoomLeave = function(room, charid) {
    this.io.sockets["in"](room).emit("characterleave", {characterid: charid});
}

var _instance = null;

if (!_instance) {
    _instance = new RoomManager();
}

module.exports = _instance;