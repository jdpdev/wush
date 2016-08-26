var Character = require("./character");

function CharacterManager() {
    this._cache = {};
}

// Initialize all routing calls handled by the mananger
CharacterManager.prototype.initialize = function(app, ensureAuthenticated, db) {
    var self = this;
    
    app.get("/api/character/info", ensureAuthenticated, function(req, res) {
      self.sendCharacterInfo(req, res, db);
    });
    
    app.get("/api/character/lastseen", ensureAuthenticated, function(req, res) {
      self.sendLastSeenMessages(req, res, db);
    });
    
    app.post("/api/character/description", ensureAuthenticated, function(req, res) {
      self.changeDescription(req, res, db);
    });
    
    app.post("/api/character/create", ensureAuthenticated, function(req, res) {
      self.createCharacter(req, res, db);
    });   

    console.log("Loading characters...");

    return new Promise(function(resolve, reject) {
        self.loadCharacters(db)
        .then(function(success) {
            console.log("Characters loaded");
            resolve(true);
        })
        .catch(function(error) {
            reject(error);
        });
    });
}

CharacterManager.prototype.cache = {};

CharacterManager.prototype.createCharacter = function(req, res, db) {
    var query = "INSERT INTO `characters` SET ?";
    var inputs = {"name": req.body.name, "owner": req.body.owner};
    
    db.query(query, inputs, function(err, result) {
        if (err) {
            res.json({success: false, authenticated: true, error: err});
        } else {
            res.json({success: true, authenticated: true, id: result.insertId});
        }
    });
}

CharacterManager.prototype.sendLastSeenMessages = function(req, res, db) {
    this.getLastSeenMessages(db, req.query.id)
    .then(function(poses) {
        res.json({success: true, authenticated: true, poses: poses});
    })
    .catch(function(error) {
        res.json({success: false, authenticated: true, error: error});
    });
}

// Get the last seen messages for a user
// id The id of the user
CharacterManager.prototype.getLastSeenMessages = function(db, id) {
    return new Promise(function(resolve, reject) {
        var charquery = "SELECT c.id, c.lastseen, l.room FROM characters c LEFT JOIN locations l on l.character=c.id WHERE l.exittime is null and c.owner=" + db.escape(id);
       
        db.query(charquery, {}, function(err, rows, fields) {
            if (err) {
                reject(err);
            } else {
                var characters = [];
                
                if (rows.length == 0) {
                    resolve([]);
                }

                for (var i = 0; i < rows.length; i++) {
                    characters.push("(p.room = " + db.escape(rows[i].room) + " and p.timestamp >= " + db.escape(rows[i].lastseen) + ")");
                }
                
                var params = characters.join(" or ");
                var query = "SELECT p.*, c.name as characterName, r.name as roomName, w.color " +
                            "FROM poses p " +
                            "LEFT JOIN characters c ON c.id = p.character " +
                            "LEFT JOIN room r ON r.id = p.room " +
                            "LEFT JOIN world w ON w.id = r.world " +
                            "WHERE " + params + " " +
                            "ORDER BY timestamp desc";
                
                db.query(query, {}, function(err, poses, fields) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(poses);
                    }
                });
            }
        });
    });
}

/**
 * Send information about a given character
 */
CharacterManager.prototype.sendCharacterInfo = function(req, res, db) {
    this.loadCharacter(db, req.query.id)
    .then(function(info) {
        res.json({success: true, authenticated: true, character: info.character});
    })
    .catch(function(error) {
        res.json({success: false, authenticated: true, error: error});
    });
}

CharacterManager.prototype.loadCharacters = function(db) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        self._cache = {};

        var query = "SELECT * " + 
                    "FROM characters ";
        var inputs = {};
        
        db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            // Load the room and its associated world
            else {
                for (var i = 0; i < rows.length; i++) {
                    var char = new Character(rows[i]);
                    self._cache[rows[i].id] = char;
                }

                resolve(true);
            }
        });
    });
}

CharacterManager.prototype.loadCharacter = function(db, id) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
       resolve({character: self.getCharacter(id)});
    });
}

CharacterManager.prototype.getCharacter = function(id) {
    if (this._cache && this._cache[id]) {
        return this._cache[id];
    } else {
        return null;
    }
}

/**
 * Change the description of a character.
 */
CharacterManager.prototype.changeDescription = function(req, res, db) {
    var self = this;
    this.loadCharacter(db, req.body.id)
        .then(function(character) {
            character = character.character;
            
            // Confirm user has permissions for the character
            if (character.owner == req.user.id) {
                character.updateDescription(db, req.body.description)
                    .then(function(response) {
                        self.cache[character.id] = character;
                        res.json({success: true, authenticated: true});
                    })
                    .catch(function(error) {
                        res.json({success: false, authenticated: true, error: error});
                    });
                
            } else {
                res.json({success: false, authenticated: true, error: "You are not authorized to change this character's description."});
            }
        })
        .catch(function(error) {
            res.json({success: false, authenticated: true, error: "Unable to load character."});
        });
}

/**
 * Updates the record of a character in the cache
 */
CharacterManager.prototype.updateCharacterInCache = function(character) {
    this.cache[character.id] = character;
}

var _instance = null;

if (!_instance) {
    _instance = new CharacterManager();
}

module.exports = _instance;