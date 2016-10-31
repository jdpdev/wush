var _currentUser = null;

// Returns if the user is logged in
wushApp.factory("isLoggedIn", [function() {
	return function() {
		return new Promise(
			function (resolve, reject) {
				resolve(_currentUser != null);
			}
		)
	}
}]);

wushApp.factory("getCurrentUser", [function() {
	return function() {
		return _currentUser;
	}
}]);

wushApp.factory("setCurrentUser", ["$cookies", function($cookies) {
	return function(userInfo) {
		return new Promise(
			function (resolve, reject) {
				_currentUser = userInfo;
				$cookies.putObject("wushUserInfo", userInfo);
				resolve();
			}
		)
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