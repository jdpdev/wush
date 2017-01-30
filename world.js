var Room = require("./room");

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
    this.creator = row.creator;
    this.createdTime = row.createdTime;
    this.rooms = {};
}

World.prototype.update = function(name, description, color) {
	this.name = name;
	this.description = description;
	this.color = color;
}

World.prototype.addRoom = function(room) {
    if (this.rooms[room.rid] == undefined) {
        this.rooms[room.rid] = {id: room.rid, name: room.rname, description: room.rdescription};   
    }
}

module.exports = World;