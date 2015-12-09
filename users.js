var Users = function() {
    
}

Users.prototype.list = function(db, res) {
    db.query('SELECT id, name FROM users', function(err, rows, fields) {
        if (err) throw err;
        
        var users = [];
        
        for (index in rows) {
            users.push(rows[index]);
        }
        
        res.send(JSON.stringify(users));
    });
}

Users.prototype.create = function(db, req, res) {
    var passwordHash = require('password-hash');
    var hashedPassword = passwordHash.generate(req.query.password);
    
    var query = "INSERT INTO users SET ?";
    var inputs = {name: req.query.name, password: hashedPassword, email: req.query.email};
    
    var request = db.query(query, inputs, function(err, rows, fields) {
        if (err) throw err;
        
        res.send("User " + req.query.name + " created");
    });
}

// verify(err, user)
Users.prototype.findByName = function(db, name, verify) {
    var query = "SELECT * FROM users WHERE ?";
    var inputs = {name: name};
    
    var request = db.query(query, inputs, function(err, rows, fields) {
        if (err || rows.length != 1) {
            verify(err, null);   
        }
        
        /* global User */
        var user = new Users();
        user.populate(rows[0]);
        verify(err, user);
    });
}

Users.prototype.findById = function(db, id, verify) {
    var query = "SELECT * FROM users WHERE ?";
    var inputs = {id: id};
    
    var request = db.query(query, inputs, function(err, rows, fields) {
        if (err || rows.length != 1) {
            verify(err, null);   
        }
        
        /* global User */
        var user = new Users();
        user.populate(rows[0]);
        verify(err, user);
    });
}

// Returns if a password matches a hased password
Users.prototype.verifyPassword = function(password) {
    var passwordHash = require('password-hash');
    return passwordHash.verify(password, this.password);
}

Users.prototype.populate = function(row) {
    this.id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.password = row.password;
}

module.exports = Users;