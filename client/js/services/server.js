var config = null;

/*$http.get("config.json")
    .success(function(data) {
        config = data;

        //apiurl
    })
    .error(function(data, status, headers, config) {
        console.error(data);
    });*/

config = { apiurl: "http://localhost:3000" };

wushApp.factory("getServer", ["$http", function($http) {
	return function(endpoint, params) {
		return new Promise(
			function(resolve, reject) {
				$http.get(config.apiurl + "/api/" + endpoint, {withCredentials: true, params: params}).then(
	        
			        // Success
			        function (response) {
			            resolve(response.data);
			        },
			        
			        // Error
			        function (response) {
			            reject("Error loading character");
			        }
			    );
			}
		);
	}
}]);

wushApp.factory("postServer", ["$http", function($http) {
	return function(endpoint, params) {
		return new Promise(
			function(resolve, reject) {
				$http.post(config.apiurl + "/api/" + endpoint, params, {withCredentials: true}).then(
		            function (response) {
		                if (response.data.success) {
		                    resolve(response.data);
		                } else {
		                    reject(response.data.error);
		                }
		            },
		            
		            function (response) {
		                reject(response.data.error);
		            }
		        );
			}
		);
	}
}]);