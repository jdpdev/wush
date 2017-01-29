/* global wushApp */
wushApp.controller("roomController", function($scope, $http, $route, $routeParams, $location, getServer, postServer, getCurrentUser) {
    var self = this;

    this.fatalError = null;
    
    this.info = {id: $routeParams.id};
    this.world = {color: "#cccccc"};
    this.characters = [];
    this.poses = [];
    
    // Characters in the room owned by the user
    this.playerCharacters = [];
    
    // List of user's characters not in the room
    this.missingCharacters = [];
    
    this.bShowWritePose = false;
    
    this.selectedCharacter = null;
    this.characterToMove = null;
    
    this.poseData = {
        room: $routeParams.id,
        character: 0,
        pose: ""
    };
    
    // Get the initial dump of room info
    // ...room info
    getServer("room/info", {id: $routeParams.id}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.info = response.room;
                    self.world = response.world;
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
    
    // ...room members
    getServer("room/members", {id: $routeParams.id}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.characters = [];

                    for (var i = 0; i < response.characters.length; i++) {
                        self.addCharacterToRoom(response.characters[i]);   
                    }

                    self.processMissingCharacters();
                    
                    /*if (self.characters.length > 0) {
                        self.poseData.character = self.characters[0].id;
                        self.poseData.characterName = self.characters[0].name;
                    }*/
                });
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
    getServer("room/poses", {id: $routeParams.id}).then(
        
        // Success
        function (response) {
            if (response.success) {
                $scope.$apply(function() {
                    self.poses = response.poses;
                });
            } else {
                console.log(response);
            }
        },
        
        // Error
        function (response) {
            console.log(response);
        }
    );
    
    $scope.$on("$destroy", function() {
       self.leaveRoom();
    });
    
    this.enterRoom = function() {
        if ($scope.app.isSocketReady()) {
            $scope.app.getSocket().emit("enterroom", this.info.id);
        } else {
            setTimeout(this.enterRoom, 1000);
        }
    }
    
    this.leaveRoom = function() {
        $scope.app.getSocket().emit("leaveroom", this.info.id);
    }

    this.enterNewCharacter = function(character) {
        $scope.$apply(function() {
            self.addCharacterToRoom(character);
            self.processMissingCharacters();
        });
    }

    this.addCharacterToRoom = function(character) {
        this.characters.push(character);

        // Find the user's characters in the room
        // Needs to happen even if nobody is in the room
        var userChars = getCurrentUser().characters;
        
        for (var i = 0; i < userChars.length; i++) {
            var bFound = false;

            if (userChars[i].id == character.id) {
                this.registerPlayerCharacter(character);
                break;
            }
        }

        if (this.playerCharacters.length == 1) {
            this.selectedCharacter = this.playerCharacters[0];
        }
    }

    this.registerPlayerCharacter = function(character) {
        for (var i = 0; i < this.playerCharacters.length; i++) {
            if (this.playerCharacters[i].id == character.id) {
                return;
            }
        }

        this.playerCharacters.push(character);
    }

    this.processMissingCharacters = function() {
        this.missingCharacters = [];
        var userChars = getCurrentUser().characters;
        
        if (this.playerCharacters.length == 0) {
            for (var i = 0; i < userChars.length; i++) {
                this.missingCharacters.push(userChars[i]);
            }
        } else {
            for (var i = 0; i < userChars.length; i++) {
                var bFound = false;

                for (var j = 0; j < this.playerCharacters.length; j++) {
                    if (this.playerCharacters[j].id == userChars[i].id) {
                        bFound = true;
                    }

                    if (!bFound) {
                        this.missingCharacters.push(userChars[i]);
                    }
                }
            }
        }

        if (this.missingCharacters.length > 0) {
            this.characterToMove = this.missingCharacters[0];
        }
    }

    this.removeCharacter = function(characterid) {
        var index = -1;

        for (var i = 0; i < this.characters.length; i++) {
            if (this.characters[i].id == characterid) {
                index = i;
                break;
            }
        }

        if (index != -1) {
            this.characters.splice(index, 1);
        }
    }
    
    // New pose received from a live connection
    this.receiveNewPose = function(pose) {
        //$scope.room.poses.unshift(pose);
        $scope.$apply(function() {
            self.poses.unshift(pose);  
        });
        
        $scope.app.getSocket().emit("update last seen", {owner: getCurrentUser().id, room: self.info.id});
    }
    
    // Send a new pose to the server
    this.sendPose = function() {
        var self = this;
        
        this.poseData.character = this.selectedCharacter.id;
        this.poseData.characterName = this.selectedCharacter.name;
        
        postServer("pose/add", this.poseData).then(
            
            // Success
            function (response) {
                
                if (!response.success) {
                    console.log(response);
                } else {
                    var pose = {
                        id: response.id,
                        room: self.info.name,
                        timestamp: new Date().toLocaleString(),
                        text: self.poseData.pose,
                        character: self.poseData.character,
                        characterName: self.poseData.characterName
                    };
                    
                    //self.poses.unshift(pose);
                    
                    self.poseData.pose = "";
                }
            },
            
            // Error
            function (response) {
                console.log(response);
            }
        );
    }
    
    this.relocateCharacter = function() {
        var self = this;
        
        postServer("room/relocate", {character: this.characterToMove.id, room: this.info.id}).then(
            function(response) {
                if (response.success) {
                    /*$scope.$apply(function() {
                        //self.characters.push(self.characterToMove);
                        //self.playerCharacters.push(self.characterToMove);
                        
                        var index = self.missingCharacters.indexOf(self.characterToMove);
                        self.missingCharacters.splice(index, 1);
                    });*/
                } else {
                    console.log(response);
                }
            },
            
            function(response) {
                console.log(response);
            }
        );
    }

    this.isUserCharacter = function(char) {
        return getCurrentUser().id == char.owner;
    }
    
    this.enterRoom();
});