/* global wushApp */
wushApp.controller("placeListController", function($scope, $http, $location, getServer, postServer, getCurrentUser) {
    var self = this;
    
    this.worlds = {};

    this.newWorld = {
        name: "",
        description: "",
        color: "#000000"
    };

    this.createWorldError = null;
    this.pendingCreate = false;

    this.createWorld = function() {
        this.pendingCreate = true;
        this.createWorldError = null;

        var params = {
            name: this.newWorld.name,
            description: this.newWorld.description,
            color: this.newWorld.color.replace("#", "")
        };        

        postServer("world", params).then(
            function(response) {
                $scope.$apply(function() {
                    if (response.success) {
                        $location.path("/world/" + response.id);
                    } else {
                        self.pendingCreate = false;
                        self.createWorldError = result.error;
                        console.error(result);
                    }
                });
            },

            function(error) {
                $scope.$apply(function() {
                    self.pendingCreate = false;
                    self.createWorldError = error.error;
                    console.error(error);
                });
            }
        );
    }

    /**
     * Returns if the current user is the owner of the world
     * @param  {World}  world    The world to check
     * @return {Boolean}         [description]
     */
    this.isWorldOwner = function(world) {
        // TODO permissions
        return getCurrentUser() != null && getCurrentUser().id == world.creator;
    }

    this.editWorld = function(world) {
        if (!this.isWorldOwner(world)) {
            return;
        }

        $location.path("/world/" + world.id);
    }

    this.editRoom = function(id) {
        $location.path("/room/" + id + "/edit");   
    }
    
    // Get dump of info about the character
    getServer("world/list", {}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.worlds = response.worlds;
                });
            }
        },
        
        // Error
        function (response) {
            console.log(response.error);
        }
    );
});