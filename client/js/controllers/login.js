// Login controller
/* global wushApp */
wushApp.controller("loginController", function($scope, $http, $rootScope, $location, getServer, postServer) {
    var self = this;
    this.username = "";
    this.password = "";
    this.allowLogin = false;
    this.loginError = false;
    this.pendingLogin = false;
    
    this.submit = function() {
        this.loginError = false;
        this.pendingLogin = true;

        postServer("login", {username: this.username, password: this.password}).then(
            function(response) {
                $scope.$apply(function() {
                    $rootScope.isLoggedIn = true;
                    $location.path( "/" );
                });
            },
            
            function(response) {
                $scope.$apply(function() {
                    self.loginError = true;
                    self.pendingLogin = false;
                });
            }
        );
    }

    // Check if already logged in
    if ($rootScope.isLoggedIn) {
        $location.path("/");
    } else {
        getServer("authenticated", {}).then(
            function(response) {
                if (response.authenticated) {
                    $scope.$apply(function() {
                        $rootScope.isLoggedIn = true;
                        $location.path( "/" );
                    });
                } else {
                    $scope.$apply(function() {
                        self.allowLogin = true;
                    });
                }
            },

            function(response) {
                $scope.$apply(function() {
                    self.allowLogin = true;
                });
            }
        )
    }
});