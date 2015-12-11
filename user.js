var User = function(row) {
    if (row == undefined || row == null) {
        return;
    }
    
    this.id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.password = row.password;
}

User.prototype.verifyPassword = function(password) {
    /*global Users*/
    return Users.verifyPassword(this.password, password);
}

module.exports = User;