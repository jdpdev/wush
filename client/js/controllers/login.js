// Login controller
/* global wushApp */
wushApp.controller("loginController", function($scope, $http, $rootScope, $location, getServer) {
    var self = this;
    this.username = "";
    this.password = "";
    this.allowLogin = false;
    
    this.submit = function() {
        $http.post("/api/login", {username: this.username, password: this.password}).then(
            function(response) {
                $rootScope.isLoggedIn = true;
                $location.path( "/" );
            },
            
            function(response) {
                
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