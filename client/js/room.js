/* global angular */
angular.module("wushRoom", [])

.controller("RoomController", ["$http", function($http) {
    var self = this;
    
    this.name = "";
    this.description = "";
    this.characters = [];
    this.poses = [];
    
    // Get the initial dump of room info
    $http.get("/room/info", {withCredentials: true}).then(
        
        // Success
        function (response) {
            if (response.data.success) {
                
            } else {
                
            }
        },
        
        // Error
        function (response) {
            
        }
    );
}]);