/* global wushApp */
wushApp.controller("profileController", function($scope, $http) {
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
            } else {
                console.log("data error");
            }
        },
        
        // Error
        function(response) {
            console.log("server error");
        }
    )
});