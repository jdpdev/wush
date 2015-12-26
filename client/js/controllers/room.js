/* global wushApp */
wushApp.controller("roomController", function($scope, $http, $route, $routeParams, $location) {
    var self = this;
    
    this.info = {};
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
                
                if (self.characters.length > 0) {
                    self.poseData.character = self.characters[0].id;
                    self.poseData.characterName = self.characters[0].name;
                }
                
                // Find the user's characters in the room
                // Needs to happen even if nobody is in the room
                var userChars = $scope.app.getUserInfo().characters;
                
                for (var i = 0; i < userChars.length; i++) {
                    var bFound = false;
                    
                    for (var j = 0; j < self.characters.length; j++) {
                        if (self.characters[j].id == userChars[i].id) {
                            self.playerCharacters.push(self.characters[j]);
                            bFound = true;
                            break;
                        }
                    }   
                    
                    if (!bFound) {
                        self.missingCharacters.push(userChars[i]);
                    }
                }
                
                // Auto-select for posing
                if (self.playerCharacters.length > 0) {
                    self.selectedCharacter = self.playerCharacters[0];
                }
                
                console.log(self.missingCharacters);
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
    
    // Send a new pose to the server
    this.sendPose = function() {
        var self = this;
        
        this.poseData.character = this.selectedCharacter.id;
        this.poseData.characterName = this.selectedCharacter.name;
        
        $http.post("/api/pose/add", this.poseData, {withCredentials: true}).then(
            
            // Success
            function (response) {
                
                if (!response.data.success) {
                    console.log(response);
                } else {
                    var pose = {
                        id: response.data.id,
                        room: self.info.name,
                        timestamp: new Date().toLocaleString(),
                        text: self.poseData.pose,
                        character: self.poseData.character,
                        characterName: self.poseData.characterName
                    };
                    
                    self.poses.unshift(pose);
                    
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
        
        $http.post("/api/room/relocate", {character: this.characterToMove.id, room: this.info.id}, {withCredentials: true}).then(
            function(response) {
                if (response.data.success) {
                    self.characters.push(self.characterToMove);
                    self.playerCharacters.push(self.characterToMove);
                    
                    var index = self.missingCharacters.indexOf(self.characterToMove);
                    self.missingCharacters.splice(index, 1);
                } else {
                    console.log(response);
                }
            },
            
            function(response) {
                console.log(response);
            }
        );
    }
});