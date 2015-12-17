/**
 *  Create a new world object from the database.
 * @param row Row from the database
 * @return A new World object
 */
var World = function(row) {
    this.id = row.id;
    this.name = row.name;
    this.description = row.description;
    this.color = row.color;
}

module.exports = World;