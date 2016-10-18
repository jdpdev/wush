var config = null;

wushApp.factory("appConfig", ["$http", function($http) {
	return function(path) {
		return new Promise(
			function (resolve, reject) {
				if (config) {
					resolve(config);
				} else {
					$http.get(path)
					    .success(function(data) {
					        config = data;
					        resolve(config);
					    })
					    .error(function(data, status, headers, config) {
					        console.error(data);
					        reject();
					    });
				}
			}
		)
	}
}]);

wushApp.factory("getServer", ["$http", "appConfig", function($http, appConfig) {
	return function(endpoint, params) {
		return new Promise(
			function(resolve, reject) {
				appConfig("config.json").then(
					function(config) {
						$http.get(config.apiurl + "/api/" + endpoint, {withCredentials: true, params: params}).then(
	        
					        // Success
					        function (response) {
					            resolve(response.data);
					        },
					        
					        // Error
					        function (response) {
					            reject(response);
					        }
					    );
					},

					function(error) {
						reject(error);
					}
				);
			}
		);
	}
}]);

wushApp.factory("postServer", ["$http", "appConfig", function($http, appConfig) {
	return function(endpoint, params) {
		return new Promise(
			function(resolve, reject) {
				appConfig("config.json").then(
					function(config) {
						$http.post(config.apiurl + "/api/" + endpoint, params, {withCredentials: true}).then(
				            function (response) {
				                if (response.data.success) {
				                    resolve(response.data);
				                } else {
				                	if (response.data.errror) {
					                    reject(response.data.error);
					                } else {
					                	reject(response.data);
					                }
				                }
				            },
				            
				            function (response) {
				                if (response.data.errror) {
				                    reject(response.data.error);
				                } else {
				                	reject(response.data);
				                }
				            }
				        );
					},

					function(error) {
						reject(error);
					}
				);
			}
		);
	}
}]);