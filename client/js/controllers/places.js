/* global wushApp */
wushApp.controller("placeListController", function($scope, $http, getServer) {
    var self = this;
    
    this.worlds = {};
    
    // Get dump of info about the character
    getServer("world/list", {}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.worlds = response.worlds;
                });
            }
        },
        
        // Error
        function (response) {
            console.log(response.error);
        }
    );
});