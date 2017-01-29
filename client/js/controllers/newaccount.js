// Login controller
/* global wushApp */
wushApp.controller("accountController", function($scope, $http, $location, postServer) {
    var self = this;

    this.info = {
        username: "",
        password: "",
        email: ""
    }

    this.errorMsg = null;
    
    this.submit = function() {
        postServer("users/create", this.info).then(
            function(response) {
                if (response.success) {
                    $scope.$apply(function() {
                        $location.path("/login/newaccount");
                    });
                } else {
                    $scope.$apply(function() {
                        self.errorMsg = "An error has occurred. Please try again.";
                    });
                }  
            },
            
            function(response) {
                $scope.$apply(function() {
                    switch (response.error.errno) {
                        
                        // Duplicate data
                        case 1062:
                            self.errorMsg = "The username or email has already been registered."
                            break;

                        default:
                            self.errorMsg = "An error has occurred. Please try again.";
                            break;
                    }
                });
            }
        );
    }
});