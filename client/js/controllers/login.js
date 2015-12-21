// Login controller
/* global wushApp */
wushApp.controller("loginController", function($scope, $http) {
    this.username = "";
    this.password = "";
    
    this.submit = function() {
        $http.get("/api/users/info", {withCredentials: true}).then(
            function(response) {
                
            },
            
            function(response) {
                
            }
        );
    }
});