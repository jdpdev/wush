/* global wushApp */
wushApp.controller("placeListController", function($scope, $http) {
    var self = this;
    
    this.worlds = {};
    
    // Get dump of info about the character
    $http.get("/api/world/list", {withCredentials: true}).then(
        
        // Success
        function (response) {
            if (response.data.success) {
                self.worlds = response.data.worlds;
            }
        },
        
        // Error
        function (response) {
            console.log(response.data.error);
        }
    );
});