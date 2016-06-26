var User = require("./user");

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
    //var passwordHash = require('password-hash');
    var hashedPassword; //= passwordHash.generate(req.body.password);
    
    var bcrypt = require('bcrypt');
    bcrypt.hash(req.body.password, 8, function(err, hash) {
        if (err) {
            res.json({success: false, authenticated: false, error: err});
            return;
        }
        
        var query = "INSERT INTO users SET ?";
        var inputs = {name: req.body.username, password: hash, email: req.body.email};
        
        var request = db.query(query, inputs, function(err, rows, fields) {
            if (err) {
                res.json({success: false, authenticated: false, error: err});
            } else {
                res.json({success: true, authenticated: false});
            }
            
            // 1062 duplicate errno
        });
    });
}

// verify(err, user)
Users.prototype.findByName = function(db, name, verify) {
    var query = "SELECT * FROM users WHERE ?";
    var inputs = {name: name};
    
    var request = db.query(query, inputs, function(err, rows, fields) {
        if (err || rows.length != 1) {
            verify(err, null);   
            return;
        }
        
        /* global User */
        var user = new Users();
        user.populate(rows[0]);
        //var user = new User(rows[0]);
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

Users.prototype.login = function(password, db) {
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

// Returns if a password matches a hased password
Users.prototype.verifyPassword = function(password) {
    //var passwordHash = require('password-hash');
    //return passwordHash.verify(password, this.password);
    
    var bcrypt = require('bcrypt');
    return bcrypt.compareSync(password, this.password);
}

Users.prototype.populate = function(row) {
    this.id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.password = row.password;
    this.characters = [];
}

Users.prototype.getProfileDetails = function(db, verify) {
    var query = "select * from (SELECT c.id, c.name cname, l.entertime, r.id rid, r.name rname, r.description, w.id wid, w.name wname, w.color " +
                    "from characters c " +
                    "left join locations l " +
                    "	on l.character = c.id " +
                    "left join room r " +
                    "	on r.id = l.room " +
                    "left join world w " +
                    "	on w.id = r.world " +
                    "WHERE ? " +
                    "ORDER BY l.entertime desc) blah " +
                    "GROUP BY id";
    var inputs = {"c.owner": this.id};
    
    var request = db.query(query, inputs, function(err, rows, fields) {
        if (err) {
            verify(err, null);   
        }
        
        if (this.characters == undefined) {
            this.characters = [];
        }
        
        for (var i in rows) {
            this.characters.push({
                    id: rows[i].id,
                    name: rows[i].cname,
                    room: rows[i].rid,
                    roomName: rows[i].rname,
                    roomDesc: rows[i].rdescription,
                    world: rows[i].wid,
                    worldName: rows[i].wname,
                    worldColor: rows[i].color
                });
        }
        
        verify(err, this.characters);
    });
}

module.exports = Users;