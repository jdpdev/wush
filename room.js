/**
 *  Create a new room object from the database.
 * @param row Row from the database
 * @return A new Room object
 */
var Room = function(row) {
    this.id = row.id;
    this.name = row.name;
    this.description = row.description;
    this.worldId = row.world;
}

module.exports = Room;