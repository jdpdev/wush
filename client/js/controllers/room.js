/* global wushApp */
wushApp.controller("roomController", function($http, $route, $routeParams, $location) {
    var self = this;
    
    this.info = {};
    this.world = {color: "#cccccc"};
    this.characters = [];
    this.poses = [];
    
    // Get the initial dump of room info
    $http.get("/api/room/info", {withCredentials: true, params: {id: $routeParams.id}}).then(
        
        // Success
        function (response) {
            console.log(response);
            
            if (response.data.success) {
                self.info = response.data.room;
                self.world = response.data.world;
            } else {
                
            }
        },
        
        // Error
        function (response) {
            console.log(response);
        }
    );
});