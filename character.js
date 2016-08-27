var Character = function(row) {
    this.id = row.id;
    this.owner = row.owner;
    this.name = row.name;
    this.description = row.description;
    this.lastseen = new Date(row.lastseen);
}

Character.prototype.updateDescription = function(db, description) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var query = "UPDATE characters SET description='" + description + "' WHERE id = " + self.id;
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