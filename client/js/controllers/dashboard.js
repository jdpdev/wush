/* global wushApp */
wushApp.controller("profileController", function($scope, $http, $location) {
    var self = this;
    
    this.username = "";
    
    // List of the user's characters
    this.characters = [];
    
    // List of new poses
    this.newPoses = [];
    
    // Request profile info
    $http.get("/api/users/info", {withCredentials: true}).then(
        
        // Success
        function(response) {
            if (response.data.success) {
                console.log("success");  
                self.username = response.data.name;
                self.characters = response.data.characters;
                
                /* global app */
                $scope.app.setUserInfo({name: response.data.name, id: response.data.id, characters: self.characters});
            } else {
                console.log("data error");
                
                if (!response.data.authenticated) {
                    $location.path("/login");
                }
            }
        },
        
        // Error
        function(response) {
            console.log("server error");
        }
    )
    
    this.jumpToRoom = function(roomId) {
        $location.path("/room/" + roomId);
    }
    
    this.jumpToCharacter = function(charId) {
        $location.path("/character/" + charId);
    }
});