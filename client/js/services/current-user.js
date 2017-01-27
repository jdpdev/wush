var _currentUser = null;

// Returns if the user is logged in
wushApp.factory("isLoggedIn", [function() {
	return function() {
		return _currentUser != null;
	}
}]);

wushApp.factory("loadUser", ["getServer", "setCurrentUser", function(getServer, setCurrentUser) {
	return function() {
		return new Promise(
			function (resolve, reject) {
				// Request profile info
	            getServer("users/info", {}).then(
	                
	                // Success
	                function(response) {
	                    if (response.success) {
	                    	setCurrentUser({name: response.name, id: response.id, characters: response.characters});
	                    	resolve(_currentUser);
	                    } else {
	                        console.log("data error");
	                        reject();
	                    }
	                },
	                
	                // Error
	                function(response) {
	                    console.log("server error");
	                    reject();
	                }
	            );
			}
		);
	}
}]);

wushApp.factory("getCurrentUser", [function() {
	return function() {
		return _currentUser;
	}
}]);

wushApp.factory("setCurrentUser", ["$cookies", function($cookies) {
	return function(userInfo) {
		_currentUser = userInfo;
		$cookies.putObject("wushUserInfo", userInfo);
	}
}]);

wushApp.factory("hasCharacters", [function() {
	return function() {
		if (!_currentUser || (_currentUser.characters && _currentUser.characters.length > 0)) {
			return true;
		} else {
			return false;
		}
	}
}]);

wushApp.factory("addCharacter", [function() {
	return function(character) {
		return new Promise(
			function (resolve, reject) {
				if (_currentUser) {
					if (!_currentUser.characters) {
						_currentUser.characters = [];
					}

					_currentUser.characters.push(character);
					resolve();
				} else {
					reject();
				}
			}
		)
	}
}]);

wushApp.factory("logoutUser", ["$http", function($http) {
	return function(character) {
		return new Promise(
			function (resolve, reject) {
				$http.get("/api/logout", {withCredentials: true}).then(
		            function(response) {
		            	_currentUser = null;
		                resolve();
		            },

		            // Error
		            function(response) {
		                console.error(response);
		                reject();
		            }
		        );
			}
		)
	}
}]);