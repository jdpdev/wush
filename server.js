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

// Set up database connection
var db = mysql.createConnection({
  host: "localhost",
  user: "dupersaurus",
  password: "vfr4esz.",
  database: "c9"
});

db.connect(function(err){
  if(err){
    console.log(err.stack);
    return;
  }
  console.log('Connection established');
});

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

app.get('/users', function (req, res) {
  Users.list(db, res);
});

app.get('/users/create', function (req, res) {
  Users.create(db, req, res);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    return res.json({ success: false, error: "Not authenticated" }); 
}

app.get("/users/info", ensureAuthenticated, function(req, res) {
  console.log("/users/info (" + req.isAuthenticated() + ")");
  
  if (req.isAuthenticated()) {
    return res.json({ success: true, id: req.user.id, name: req.user.name }); 
  } else {
    return res.json({ success: false, error: "Not authenticated" }); 
  }
});

app.post('/login',
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