/* global wushApp */
wushApp.controller("worldController", function($scope, $http, $routeParams, getServer, postServer) {
    var self = this;
    
    this.info = null;
    this.rooms = null;

    this.newInfo = {
        name: "",
        description: "",
        color: ""
    }

    this.pendingEdit = false;
    this.editError = null;
    
    // Get dump of info about the character
    getServer("world", {id: $routeParams.id}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.info = response.world;
                    self.rooms = response.rooms;

                    self.newInfo = {
                        name: self.info.name,
                        description: self.info.description,
                        color: "#" + self.info.color
                    };
                });
            }
        },
        
        // Error
        function (response) {
            console.log(response.error);
        }
    );

    this.submitEdit = function() {
        this.pendingEdit = true;
        this.editError = null;

        var params = {
            id: $routeParams.id, 
            name: this.newInfo.name,
            description: this.newInfo.description,
            color: this.newInfo.color.replace("#", "")
        };

        postServer("world", params).then(
            function(response) {
                $scope.$apply(function() {
                    self.pendingEdit = false;

                    if (response.success) {
                        self.info = params;
                    } else {
                        self.editError = response.error;
                    }
                });
            },

            function(error) {
                console.error(error);

                $scope.$apply(function() {
                    self.editError = error;
                    self.pendingEdit = false;
                });
            }
        );
    }
});