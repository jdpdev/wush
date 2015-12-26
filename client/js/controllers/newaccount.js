// Login controller
/* global wushApp */
wushApp.controller("accountController", function($scope, $http, $location) {
    this.info = {
        username: "",
        password: "",
        email: ""
    }
    
    this.submit = function() {
        $http.post("/api/users/create", this.info, {withCredentials: true}).then(
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