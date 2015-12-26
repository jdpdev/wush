/* global wushApp */
wushApp.controller("profileController", function($scope, $http, $location, $uibModal) {
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
                
                /* global app */
                $scope.app.setUserInfo({name: response.data.name, id: response.data.id, characters: self.characters});
            } else {
                console.log("data error");
                
                if (!response.data.authenticated) {
                    $location.path("/login");
                }
            }
        },
        
        // Error
        function(response) {
            console.log("server error");
        }
    )
    
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
});

wushApp.controller("createCharacterController", function($scope, $http, $uibModalInstance, $location, app) {
    var self = this;
    
    this.characterName = "";
    this.errorMessage = "";
    
    // Submit the character using a given user name
    this.submit = function() {
        if (this.characterName.length == 0) {
            this.errorMessage = "You must enter a name.";
        } else {
            $http.post("/api/character/create", {name: this.characterName, owner: app.getUserInfo().id}, {withCredentials: true}).then(
                function(response) {
                    if (response.data.success) {
                        $location.path("/character/" + response.data.id);
                        $uibModalInstance.close();
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