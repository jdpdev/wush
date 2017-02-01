/* global wushApp */
wushApp.controller("editRoomController", function($scope, $http, $route, $routeParams, $location, getServer, postServer, getCurrentUser) {
    var self = this;

    this.fatalError = null;
    
    this.info = {id: $routeParams.id};
    this.world = {color: "#cccccc"};
    this.newInfo = {name: "", description: ""};

    this.pendingEdit = false;
    this.editError = null;
    this.editSuccess = false;
    
    // Get the initial dump of room info
    // ...room info
    if ($routeParams.id > 0) {
        getServer("room/info", {id: $routeParams.id}).then(
            
            // Success
            function (response) {
                if (response.success) {
                    $scope.$apply(function() {
                        self.info = response.room;
                        self.world = response.world;
                        self.newInfo.name = self.info.name;
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
    } else {

    }

    this.isEditing = function() {
        return $routeParams.id > 0;
    }
    
    this.editRoom = function() {
        var room = {
            id: $routeParams.id > 0 ? $routeParams.id : 0,
            name: this.newInfo.name,
            description: this.newInfo.description
        };

        if (this.isEditing()) {
            room.worldId = this.world.id;
        } else {
            room.worldId = $routeParams.worldId;
        }

        this.pendingEdit = true;
        this.editSuccess = false;
        this.editError = null;

        postServer("room", room).then(
            function(response) {
                $scope.$apply(function() {
                    self.pendingEdit = false;

                    if (self.isEditing()) {
                        if (response.success) {
                            self.info.name = room.name;
                            self.info.description = room.description;
                            self.editSuccess = true;
                        } else {
                            self.editError = response.error;
                        }
                    } else {
                        $location.path("/room/" + response.id);
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