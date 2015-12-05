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

module.exports = Users;