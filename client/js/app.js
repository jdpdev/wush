/* global angular */
var wushApp = angular.module("wushApp", ["ngRoute", 'ui.bootstrap', "ngCookies", "angular-page-visibility"]);

// configure our routes
wushApp.config(function($routeProvider, $locationProvider) {
    $routeProvider

    // route for the home page
    .when('/', {
        templateUrl : 'pages/profile.html',
        controller  : 'profileController as profile'
    })

    // route for the about page
    .when('/login', {
        templateUrl : 'pages/login.html',
        controller  : 'loginController as login'
    })

    // route for the contact page
    .when('/room/:id', {
        templateUrl : 'pages/room.html',
        controller  : 'roomController as room'
    })

    // route for the contact page
    .when('/places', {
        templateUrl : 'pages/places.html',
        controller  : 'placeListController as places'
    })

    // route for the contact page
    .when('/places/:id', {
        templateUrl : 'pages/place.html',
        controller  : 'placeController as place'
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
        redirectTo: '/'
    });
    
    //$locationProvider.html5Mode(true);
});

// Main app controller
wushApp.controller("wushController", function($scope, $rootScope, $cookies, $controller, $route, $pageVisibility) {
    var self = this;

    this.userInfo = null;
    this.socket = null;
    this._hasFocus = true;

    this._baseTitle = "WUSHapp";

    this._unseenQueue = {};
    this._queueSize = 0;
    
    this.getContrastColor = function(hex) {
        return hexToLuminosity(hex) >= 0.5 ? "#000" : "#fff";
    }
    
    // Sets the information of the current user
    this.setUserInfo = function(user) {
        this.userInfo = user;
        $cookies.putObject("wushUserInfo", this.userInfo);
        
        if (this.socket == null) {
            this.setupSocket();
        }
    }
    
    this.getUserInfo = function() {
        if (this.userInfo == null) {
            this.userInfo = $cookies.getObject("wushUserInfo");
        }
        
        return this.userInfo;
    }
    
    this.getSocket = function() {
        return this.socket;
    }
    
    this.setupSocket = function() {
        // Set up the socket connection
        /* global io */
        this.socket = io.connect("", {query: "user=" + this.userInfo.id});
        
        // Connection successful
        this.socket.on('connect', function () {
            console.log("socket connection");
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
    }

    this.hasFocus = function() {
        return this._hasFocus;
    }

    /**
     * If app is not focus, flash the tab
     * @return {[type]} [description]
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

    document.title = this._baseTitle;

    document.addEventListener("visibilitychange", function() { 
        self._hasFocus = !document.hidden;

        if (self._hasFocus) {
            document.title = self._baseTitle;
            self.clearQueue();
        }
    });

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

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToLuminosity(hex) {
    var rgb = hexToRgb(hex);
    
    if (rgb == null) {
        return 0;
    } else {
        return (rgb.r * 0.2 + rgb.g * 0.6 + rgb.b * 0.1) / 255;
    }
}