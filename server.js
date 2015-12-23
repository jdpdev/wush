//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var mysql = require("mysql");
var users = require("./users");

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

// Set up database connection
var db = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "dupersaurus",
  password: "vfr4esz.",
  database: "c9"
});

/*db.connect(function(err){
  if(err){
    console.log(err.stack);
    return;
  }
  console.log('Connection established');
});*/

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
      if (!user.verifyPassword(password)) {
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

app.get('/api/users/create', function (req, res) {
  Users.create(db, req, res);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    return res.json({ success: false, authenticated: false, error: "Not authenticated" }); 
}

app.get("/api/users/info", ensureAuthenticated, function(req, res) {
  console.log("/users/info (" + req.isAuthenticated() + ")");
  
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

app.get("/api/room/info", ensureAuthenticated, function(req, res) {
  RoomManager.sendRoomInfo(req, res, db);
});

app.get("/api/room/members", ensureAuthenticated, function(req, res) {
  RoomManager.loadRoomMembers(req, res, db);
});

app.get("/api/room/poses", ensureAuthenticated, function(req, res) {
  RoomManager.loadRoomPoses(req, res, db);
});

app.get("/api/character/info", ensureAuthenticated, function(req, res) {
  CharacterManager.sendCharacterInfo(req, res, db);
});

app.post("/api/character/description", ensureAuthenticated, function(req, res) {
  CharacterManager.changeDescription(req, res, db);
});

// Params: character, room, pose
app.post("/api/pose/add", ensureAuthenticated, function(req, res) {
  // TODO authenticate user to characters, and characters to room
  
  PoseManager.sendNewPose(req, res, db);
});

app.post('/api/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login.html?error=Login failed',
                                   failureFlash: true })
);

/*
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}*/

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
