//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var mysql = require("mysql");
var users = require("./users");
var email = require("./email");

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var Users = new users();

var RoomManagerConstructor = require("./roomManager");
var RoomManager = new RoomManagerConstructor();

var WorldManagerConstructor = require("./worldManager");
var WorldManager = new WorldManagerConstructor();

var PoseManagerConstructor = require("./poseManager");
var PoseManager = new PoseManagerConstructor();

var CharacterManagerConstructor = require("./characterManager");
var CharacterManager = new CharacterManagerConstructor();

var _currentMotd = null;

// Load database settings
var fs = require("fs");
var contents = fs.readFileSync("config/server-config.json");
var serverConfig = JSON.parse(contents);

var EmailManager = new email(serverConfig.email);
var PoseNotifier = require("./pose-notifier");

// Set up database connection
var db = mysql.createPool({
  connectionLimit: 10,
  host: serverConfig.db.host,
  user: serverConfig.db.user,
  password: serverConfig.db.password,
  database: serverConfig.db.name
});

var _poseNotifier = new PoseNotifier(EmailManager, PoseManager, RoomManager, db);
_poseNotifier.start();

// set up passport
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
  
passport.use(new LocalStrategy(
  function(username, password, done) {
    Users.findByName(db, username, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false);
      }
      if (!user.login(password, db)) {
        return done(null, false);
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Users.findById(db, id, function(err, user) {
    done(err, user);
  });
});

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

app.configure(function() {
  app.use(express.static(path.resolve(__dirname, 'client')));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'nograbass' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

/*app.get("/", function(req, res) {
  console.log("get root (" + req.isAuthenticated() + ")");
  
  if (req.isAuthenticated()) {
    res.sendfile("client/profile.html");
  } else {
    res.sendfile("client/login.html");
  }
});*/

app.get('/api/users', function (req, res) {
  Users.list(db, res);
});

app.post('/api/users/create', function (req, res) {
  Users.create(db, req, res);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    return res.json({ success: false, authenticated: false, error: "Not authenticated" }); 
}

app.get("/api/users/info", ensureAuthenticated, function(req, res) {
  //console.log("/users/info (" + req.isAuthenticated() + ")");
  
  if (req.isAuthenticated()) {
    req.user.getProfileDetails(db, function(err, info) {
      if (err) {
        return res.json({ success: false, authenticated: true, error: "Cannot load profile" });
      } else {
        return res.json({ success: true, authenticated: true, id: req.user.id, name: req.user.name, characters: info });
      }
    }); 
  } else {
    return res.json({ success: false, authenticated: true, error: "Not authenticated" }); 
  }
});

app.post('/api/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login.html?error=Login failed',
                                   failureFlash: true })
);

app.get("/api/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

// Set up the socket
var sockets = [];

io.on('connection', function (socket) {
  sockets.push(socket);

  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  socket.on('enterroom', function (room) {
    socket.join(room); 
  });

  socket.on('leaveroom', function (room) {
    socket.leave(room); 
  });

  socket.on('update last seen', function (params) {
    PoseManager.updateOwnerLastSeen(db, params.owner, params.room);
  });
  
  if (socket.handshake.query != undefined) {
    Users.findById(db, socket.handshake.query.user, function(err, user) {
      if (!err) {
        socket.user = user;

        // TODO handle this in a manager
        if (_currentMotd) {
          socket.emit("motd", {message: _currentMotd});
        } else {
          var request = db.query("select message from motd order by date desc limit 0,1", {}, function(err, rows, fields) {
            if (!err || rows.length > 0) {
              _currentMotd = rows[0].message;
              socket.emit("motd", {message: rows[0].message});
            }
          });
        }
      }
    });
  }
});

function getSocketForUserId(id) {
  for (var i = 0; i < sockets.length; i++) {
    if (sockets[i].user && sockets[i].user.id == id) {
      return sockets[i];
    }
    
    return null;
  }
}

server.listen(serverConfig.socket.port || 3000, serverConfig.socket.ip || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

// Set up the managers
RoomManager.initialize(app, ensureAuthenticated, db, io)
.then(function(success) {
    CharacterManager.initialize(app, ensureAuthenticated, db);
    PoseManager.initialize(app, ensureAuthenticated, db, io);
    WorldManager.initialize(app, ensureAuthenticated, db);
})
.catch(function(error) {
    console.error(error);
});