wushApp.controller("homeController", function($scope, $http, $location, $uibModal, $sce, getServer, getCurrentUser) {
	this._motd = null;
	this._serverError = null;

	this.setup = function() {
		var self = this;
		var user = getCurrentUser();

		getServer("motd", {}).then(
            
            // Success
            function (response) {
                if (response.success) {
                    $scope.$apply(function() {
                        self._motd = response.motd;
                    });
                } else {
                    console.log(response);
                    this._serverError = true;
                }
            },
            
            // Error
            function (response) {
                console.log(response);
                this._serverError = true;
            }
        );
	}

	this.setup();
});