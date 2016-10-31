/* global wushApp */
wushApp.controller("profileController", function($scope, $http, $location, $uibModal, $sce, getServer, setCurrentUser, getCurrentUser) {
    var self = this;
    
    this.username = "";
    
    // List of the user's characters
    this.characters = null;
    
    // List of new poses
    this.newPoses = null;

    this._motdTemplate = "motd.html";

    this.getUserInfo = function() {
        var user = getCurrentUser();

        if (user) {
            this.username = user.name;
            this.characters = user.characters;
        } else {

            // Request profile info
            getServer("users/info", {}).then(
                
                // Success
                function(response) {
                    if (response.success) {
                        
                        $scope.$apply(function() {
                            self.username = response.name;
                            self.characters = response.characters;
                            
                            /* global app */
                            //$scope.app.setUserInfo({name: response.name, id: response.id, characters: self.characters});
                            setCurrentUser({name: response.name, id: response.id, characters: self.characters});
                            $scope.app.setUserInfo(user);

                            self.getLastSeenPoses();
                        });
                    } else {
                        console.log("data error");
                        
                        if (!response.authenticated) {
                            $location.path("/login");
                        }
                    }
                },
                
                // Error
                function(response) {
                    console.log("server error");
                }
            );
        }
    }

    this.getLastSeenPoses = function() {
        // Last poses
        getServer("character/lastseen", {id: getCurrentUser().id}).then(
            
            // Success
            function (response) {
                if (response.success) {
                    $scope.$apply(function() {
                        self.newPoses = response.poses;
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
    }
    
    this.jumpToRoom = function(roomId) {
        $location.path("/room/" + roomId);
    }
    
    this.jumpToCharacter = function(charId) {
        $location.path("/character/" + charId);
    }
    
    // Opens the create character modal
    this.openCreateCharacter = function() {
        var modalInstance = $uibModal.open({
              animation: $scope.animationsEnabled,
              templateUrl: 'pages/createCharacterModal.html',
              controller: 'createCharacterController as createChar',
              resolve: {
                app: function () {
                  return $scope.app;
                }
              }
            });
    }

    this.getMotd = function() {
        return $scope.app.getMotd();
    }

    this.getUserInfo();
});

wushApp.controller("createCharacterController", function($scope, $http, $uibModalInstance, $location, app, postServer, getCurrentUser, addCharacter) {
    var self = this;
    
    this.characterName = "";
    this.errorMessage = "";
    
    // Submit the character using a given user name
    this.submit = function() {
        if (this.characterName.length == 0) {
            this.errorMessage = "You must enter a name.";
        } else {
            postServer("character/create", {name: this.characterName, owner: getCurrentUser().id}).then(
                function(response) {
                    if (response.data.success) {
                        $location.path("/character/" + response.data.id);
                        $uibModalInstance.close();
                        addCharacter(response.data.character);
                    } else {
                        self.errorMessage = response.data.error;
                    }
                },
                
                function(response) {
                    self.errorMessage = response.data;   
                }
            );
        }
    }
    
    this.cancel = function() {
        $uibModalInstance.close();   
    }
});