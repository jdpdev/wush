// Login controller
/* global wushApp */
wushApp.controller("accountController", function($scope, $http, $location, postServer) {
    this.info = {
        username: "",
        password: "",
        email: ""
    }
    
    this.submit = function() {
        postServer("users/create", this.info).then(
            function(response) {
                if (response.data.success) {
                    $location.path("/login");
                } else {
                    alert("Cannot create the account. Your username or email may already be used.");
                }  
            },
            
            function(response) {
                alert("Cannot create the account. Your username or email may already be used.");
            }
        );
    }
});