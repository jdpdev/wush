/* global wushApp */
wushApp.controller("characterController", function($scope, $http, $route, $routeParams) {
    var self = this;
    
    this.id = $routeParams.id;
    this.info = {
        name: "Loading",
        description: ""
    };
    
    this.newDescription = "";
    
    // Get dump of info about the character
    $http.get("/api/character/info", {withCredentials: true, params: {id: this.id}}).then(
        
        // Success
        function (response) {
            self.info = response.data.character;
        },
        
        // Error
        function (response) {
            self.info.name = "Error loading character";
        }
    );
    
    this.changeDescription = function() {
        if (this.newDescription.length == 0) {
            alert("You must enter a description!");
            return;
        }
        
        $http.post("/api/character/description", {id: this.id, description: this.newDescription}, {withCredentials: true}).then(
            function (response) {
                if (response.data.success) {
                    self.info.description = self.newDescription;
                    self.newDescription = "";
                } else {
                    alert(response.data.error);
                }
            },
            
            function (response) {
                alert(response.data.error);
            }
        );
    }
});