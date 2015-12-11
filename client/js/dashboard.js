/* global angular */
angular.module("wushDashboard", [])

.controller("DashboardController", ["$http", function($http) {
    var self = this;
    
    // Request user info
    $http.get("/users/info", {withCredentials: true}).then(
        
        // Success
        function(response) {
            console.log("success");  
        },
        
        // Error
        function(response) {
            console.log("error");
        }
    )
}]);