var User = function(row) {
    if (row == undefined || row == null) {
        return;
    }
    
    this.id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.password = row.password;
    this.characters = [];
}

User.prototype.verifyPassword = function(password) {
    /*global Users*/
    return Users.verifyPassword(this.password, password);
}

/**
 * Attempt to log the user in with a password
 * @param  {string} password The unhashed password
 * @return {boolean}         Whether login was successful
 */
User.prototype.login = function(password, db) {
	if (this.verifyPassword(password)) {
		var query = "UPDATE users SET lastlogin=NOW() WHERE ?";
        var params = {id: this.id};
        
        var dbquery = db.query(query, params, function(err, result) {
            if (err) {
                //reject(err);
            } else {
                //resolve(result.insertId);
            }
        });

		return true;
	}

	return false;
}

module.exports = User;