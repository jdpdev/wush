/* global angular */
var wushApp = angular.module("wushApp", ["ngRoute"]);

// configure our routes
wushApp.config(function($routeProvider) {
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
    
    .otherwise({
        redirectTo: '/'
    });
});

// Main app controller
wushApp.controller("wushController", function($scope) {
    this.getContrastColor = function(hex) {
        return hexToLuminosity(hex) >= 0.5 ? "#000" : "#fff";
    }
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