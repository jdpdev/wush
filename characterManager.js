var Character = require("./character");

function CharacterManager() {
    
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

CharacterManager.prototype.loadCharacter = function(db, id) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        if (self.cache[id] != undefined) {
            var char = self.cache[id];
            resolve({character: char});  
            return;
        }    
        
        var query = "SELECT * " + 
                    "FROM characters " +
                    "WHERE ?";
        var inputs = {"id": id};
        
        db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                reject(err);
            }
            
            else if (rows.length != 1) {
                reject("Unable to load character.");
            }
            
            // Load the room and its associated world
            else {
                var char = new Character(rows[0]);
                self.cache[id] = char;
                resolve({character: char});
            }
        });
    });
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

module.exports = CharacterManager;