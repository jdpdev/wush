/* global angular */
var wushApp = angular.module("wushApp", ["ngRoute", 'ui.bootstrap', "ngCookies", "angular-page-visibility", 'hc.marked', "colorpicker.module"]);

// configure our routes
wushApp.config(function($routeProvider, $locationProvider) {
    $routeProvider

    // server home page
    .when('/', {
        templateUrl : 'pages/home.html',
        controller  : 'homeController as home'
    })

    // server home page
    .when('/home', {
        templateUrl : 'pages/home.html',
        controller  : 'homeController as home'
    })

    // route for the user's profile
    .when('/profile', {
        templateUrl : 'pages/profile.html',
        controller  : 'profileController as profile'
    })

    // route for the about page
    .when('/login/:newaccount?', {
        templateUrl : 'pages/login.html',
        controller  : 'loginController as login'
    })

    // route for the contact page
    .when('/room/add/:worldId', {
        templateUrl : 'pages/editRoom.html',
        controller  : 'editRoomController as room'
    })

    // route for the contact page
    .when('/room/:id', {
        templateUrl : 'pages/room.html',
        controller  : 'roomController as room'
    })

    // route for the contact page
    .when('/room/:id/edit', {
        templateUrl : 'pages/editRoom.html',
        controller  : 'editRoomController as room'
    })

    // route for the contact page
    .when('/places', {
        templateUrl : 'pages/places.html',
        controller  : 'placeListController as places'
    })

    // route for the contact page
    .when('/world/:id', {
        templateUrl : 'pages/world.html',
        controller  : 'worldController as world'
    })

    // route for the contact page
    .when('/character/:id', {
        templateUrl : 'pages/character.html',
        controller  : 'characterController as character'
    })

    // route for the contact page
    .when('/newaccount', {
        templateUrl : 'pages/newaccount.html',
        controller  : 'accountController as account'
    })
    
    .otherwise({
        redirectTo: '/home'
    });
    
    //$locationProvider.html5Mode(true);
});

wushApp.run(function($rootScope, $location, $anchorScroll, $routeParams, getCurrentUser) {
    
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        //console.log("routeChangeStart >> " + getCurrentUser() + " (" + current + " >> " + next + ")");
        /*if (!$rootScope.isLoggedIn) {
            $location.path( "/home" );
        }*/

        if (getCurrentUser() == null) {
            switch (next.$$route.originalPath) {
                case "/room/add":
                case "/room/:id":
                case "/room/:id/edit":
                case "/character/:id":
                case "/places/:id":
                case "/places":
                case "/world/:id":
                case "/profile":
                    $location.path( "/home" );
                    break;
            }
        }
    });
});

// Main app controller
wushApp.controller("wushController", function($http, $scope, $rootScope, $cookies, $controller, $route, $pageVisibility, $location, $sce, hasCharacters, getCurrentUser, isLoggedIn, logoutUser, loadUser) {
    var self = this;

    this.userInfo = null;
    this.socket = null;
    this._socketUrl = "";
    this._socketReady = false;
    this._hasFocus = true;

    this._baseTitle = "WUSHapp";

    this._unseenQueue = {};
    this._queueSize = 0;

    this._motd = null;

    this._isReady = false;

    $rootScope.isLoggedIn = false;

    this.getMotd = function() {
        return this._motd;
    }

    this.setMotd = function(motd) {
        this._motd = motd;
    }
    
    this.getContrastColor = function(hex) {
        return hexToLuminosity(hex) >= 0.5 ? "#000" : "#fff";
    }

    this.login = function() {
        $location.path("/login");
    }

    /**
     * Log out the current user
     */
    this.logout = function() {

        logoutUser().then(
            function(response) {
                self.socket.disconnect();
                $location.path("/home");
            },

            // Error
            function(response) {
                console.error(response);
            }
        );
    }

    this.loginComplete = function() {
        loadUser().then(
                
            // Success
            function(response) {
                self.setupSocket();
                $rootScope.isLoggedIn = true;
                $location.path( "/profile" );
            },
            
            // Error
            function(response) {
                console.log("server error");
            }
        );
    }
    
    /**
     * Sers information about the current user. Expected information received from the server:
     *     id - the id of the user
     *     username - the login name of the user
     *     characters - array of the user's characters
     * @param {Object} user [description]
     */
    this.setUserInfo = function(user) {
        if (this.socket == null) {
            this.setupSocket();
        }
    }
    
    /**
     * Returns the user info object
     * @return {Object} [description]
     */
    /*this.getUserInfo = function() {
        if (this.userInfo == null) {
            this.userInfo = $cookies.getObject("wushUserInfo");
        }
        
        return this.userInfo;
    }*/

    this.hasLoggedIn = function() {
        return isLoggedIn();
    }

    /**
     * Returns if the user has characters
     * @return {Boolean} Whether the user has characters
     */
    this.doesHaveCharacters = function() {
        return hasCharacters();
    }

    /*this.addCharacter = function(character) {
        var user = getCurrentUser();

        if (user == null) {
            return true;
        }

        user.characters.push(character);
    }*/
    
    /**
     * Returns the active socket connection to the server
     * @return {[type]} [description]
     */
    this.getSocket = function() {
        return this.socket;
    }
    
    /**
     * Setup socket connection with the server
     */
    this.setupSocket = function() {
        if (!getCurrentUser()) {
            return;
        }

        // Set up the socket connection
        /* global io */
        this.socket = io.connect(this._socketUrl, {query: "user=" + getCurrentUser().id});
        
        // Connection successful
        this.socket.on('connect', function () {
            console.log("socket connection");
            self._socketReady = true;
        });
        
        // Notification of a new pose in a room not being viewed
        this.socket.on('distancepose', function (info) {
            console.log("distancepose: " + info);
            self.queueActivity();
        });
        
        // Notification of new pose in the same room
        this.socket.on('newpose', function (pose) {
            //console.log(pose);
            $route.current.scope.room.receiveNewPose(pose);
            self.queueActivity();
        });   
        
        // Notification that a character has entered the room 
        this.socket.on('characterenter', function (character) {
            //console.log(pose);
            $route.current.scope.room.enterNewCharacter(character.character);
            self.queueActivity();
        });   
        
        // Notification that a character has left the room 
        this.socket.on('characterleave', function (character) {
            //console.log(pose);
            $scope.$apply(function() {
                console.log("characterleave >> " + character);
                $route.current.scope.room.removeCharacter(character.characterid);
                self.queueActivity();
            });
        });   

        this.socket.on("motd", function(motd) {
            //self._motd = motd.message;
            $scope.$apply(function() {
                self.setMotd(motd.message);
            });
        });
    }

    this.isSocketReady = function() {
        return this._socketReady;
    }

    /**
     * Returns whether the app has focus
     * @return {Boolean} [description]
     */
    this.hasFocus = function() {
        return this._hasFocus;
    }

    /**
     * If app is not focus, flash the tab
     */
    this.queueActivity = function(roomId) {
        if (!this.hasFocus()) {
            if (this._unseenQueue[roomId]) {
                this._unseenQueue[roomId]++;
            } else {
                this._unseenQueue[roomId] = 1;
            }

            this._queueSize = 0;

            for (var key in this._unseenQueue) {
                this._queueSize += parseInt(this._unseenQueue[key]);
            }

            document.title = "(" + this._queueSize + ") " + this._baseTitle;
        }
    }

    this.clearQueue = function() {
        this._unseenQueue = {};
        this._queueSize = 0;
    }

    this.getQueueSize = function() {
        return this._queueSize;
    }

    // Load app settings
    var self = this;

    $http.get("config.json")
        .success(function(data) {
            self._baseTitle = data.name;
            self._socketUrl = data.apiurl;
            document.title = data.name;

            self._isReady = true;
        })
        .error(function(data, status, headers, config) {
            console.error(data);
        });

    document.title = "Loading...";

    document.addEventListener("visibilitychange", function() { 
        self._hasFocus = !document.hidden;

        if (self._hasFocus) {
            document.title = self._baseTitle;
            self.clearQueue();
        }
    });

    // Get app settings

    // Initialization
    /*$pageVisibility.$on('pageFocused', function(){
        // page is focused
        console.log("pageFocused");
        this._hasFocus = true;
        document.title = this._baseTitle;
    });

    $pageVisibility.$on('pageBlurred', function(){
        // page is blurred
        console.log("pageBlurred");
        this._hasFocus = false;

        this.queueActivity();
    });*/
});

/**
 * Returns a hex color code to rbg values
 * @param  {string} hex The hex color
 * @return {Object}     The color as an object with members r, g, and b normalized to [0,255]
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Converts a hex color code to an approximate luminosity value
 * @param  {string} hex The hex color
 * @return {number}     An approximate luminosity value normalized to [0,1]
 */
function hexToLuminosity(hex) {
    var rgb = hexToRgb(hex);
    
    if (rgb == null) {
        return 0;
    } else {
        return (rgb.r * 0.2 + rgb.g * 0.6 + rgb.b * 0.1) / 255;
    }
}