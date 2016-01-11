var Room = require("./room");
var WorldManagerReq = require("./worldManager");
var WorldManager = new WorldManagerReq();
var PoseManager = require("./poseManager");
PoseManager = new PoseManager();

module.exports = RoomManager;

function RoomManager() {
    this.roomCache = {};
    this.io = null;
}

// Initialize all routing calls handled by the mananger
RoomManager.prototype.initialize = function(app, ensureAuthenticated, db, io) {
    var self = this;
    this.io = io;
    
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
            
            WorldManager.loadWorld(db, room.worldId)
            .then(function(world) {
                resolve({room: room, world: world});  
            })
            .catch(function(error) {
                resolve({room: room, error: error}); 
            });
            
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
                
                WorldManager.loadWorld(db, room.worldId)
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