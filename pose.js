var Pose = function(row) {
    this.id = row.id;
    this.room = row.room;
    this.character = row.character;
    this.characterName = row.characterName;
    this.timestamp = row.timestamp;
    this.text = row.text;
}

module.exports = Pose;