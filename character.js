var escapeHtml = require('escape-html');

var Character = function(row) {
    this.id = row ? row.id : null;
    this.owner = row ? row.owner : null;
    this.name = row ? row.name : null;
    this.description = row ? row.description : null;
    this.lastseen = row ? new Date(row.lastseen) : null;
}

Character.prototype.createNew = function(id, name, owner) {
    this.id = id;
    this.owner = owner;
    this.name = name;
    this.description = "";
}

Character.prototype.updateDescription = function(db, description) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var query = "UPDATE characters SET description='" + escapeHtml(description) + "' WHERE id = " + parseInt(self.id);
        var inputs = {};
        
        var request = db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                self.description = description;
                //CharacterManager.updateCharacterInCache(self);
                resolve({});
            }
        });
    });
}

module.exports = Character;