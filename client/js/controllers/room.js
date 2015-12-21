/* global wushApp */
wushApp.controller("roomController", function($http, $route, $routeParams, $location) {
    var self = this;
    
    this.info = {};
    this.world = {color: "#cccccc"};
    this.characters = [];
    this.poses = [];
    
    // Get the initial dump of room info
    // ...room info
    $http.get("/api/room/info", {withCredentials: true, params: {id: $routeParams.id}}).then(
        
        // Success
        function (response) {
            if (response.data.success) {
                self.info = response.data.room;
                self.world = response.data.world;
            } else {
                console.log(response);    
                
                if (!response.data.authenticated) {
                    $location.path("/login");
                }
            }
        },
        
        // Error
        function (response) {
            console.log(response);
        }
    );
    
    // ...room members
    $http.get("/api/room/members", {withCredentials: true, params: {id: $routeParams.id}}).then(
        
        // Success
        function (response) {
            if (response.data.success) {
                self.characters = response.data.characters;
            } else {
                console.log(response);
            }
        },
        
        // Error
        function (response) {
            console.log(response);
        }
    );
    
    // ...recent poses
    $http.get("/api/room/poses", {withCredentials: true, params: {id: $routeParams.id}}).then(
        
        // Success
        function (response) {
            console.log(response);
            
            if (response.data.success) {
                self.poses = response.data.poses;
            } else {
                console.log(response);
            }
        },
        
        // Error
        function (response) {
            console.log(response);
        }
    );
});