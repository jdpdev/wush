/* global wushApp */
wushApp.controller("characterController", function($scope, $http, $route, $routeParams, getServer, postServer) {
    var self = this;
    
    this.id = $routeParams.id;
    this.info = {
        name: "Loading",
        description: ""
    };
    
    this.newDescription = "";
    
    // Get dump of info about the character
    getServer("character/info", {id: this.id}).then(
        
        // Success
        function (response) {
            $scope.$apply(function() {
                self.info = response.character;
            });
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
        
        postServer("character/description", {id: this.id, description: this.newDescription}).then(
            function (response) {
                if (response.success) {
                    $scope.$apply(function() {
                        self.info.description = self.newDescription;
                        self.newDescription = "";
                    });
                } else {
                    alert(response.error);
                }
            },
            
            function (response) {
                alert(response.error);
            }
        );
    }
});