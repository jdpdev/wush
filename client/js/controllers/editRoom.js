/* global wushApp */
wushApp.controller("editRoomController", function($scope, $http, $route, $routeParams, $location, getServer, postServer, getCurrentUser) {
    var self = this;

    this.fatalError = null;
    
    this.info = {id: $routeParams.id};
    this.world = {color: "#cccccc"};
    this.newInfo = {description: ""};

    this.pendingEdit = false;
    this.editError = null;
    
    // Get the initial dump of room info
    // ...room info
    getServer("room/info", {id: $routeParams.id}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.info = response.room;
                    self.world = response.world;
                    self.newInfo.description = self.info.description;
                });
            } else {
                console.log(response.error);    
                
                if (!response.authenticated) {
                    $location.path("/login");
                } else {
                    self.fatalError = response;
                }
            }
        },
        
        // Error
        function (response) {
            console.log(response);
            self.fatalError = error;
        }
    );
    
    this.editRoom = function() {
        var room = {
            id: $routeParams.id,
            name: this.info.name,
            description: this.newInfo.description,
            worldId: this.world.id
        };

        postServer("room", room).then(
            function(response) {
                $scope.$apply(function() {
                    self.pendingEdit = false;

                    if (response.success) {
                        self.info.description = room.description;
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

    this.goBack = function() {
        $location.path("/room/" + $routeParams.id);
    }
});