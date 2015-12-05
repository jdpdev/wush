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
    
    console.log(request.sql);
}

module.exports = Users;