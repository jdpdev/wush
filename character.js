var Character = function(row) {
    this.id = row.id;
    this.owner = row.owner;
    this.name = row.name;
    this.description = row.description;
}

module.exports = Character;