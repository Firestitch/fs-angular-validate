'use strict';


angular.module('app')
  .controller('DemoCtrl', function ($scope, $q) {

    	$scope.user = { phone: '' };

        $scope.submit = function() {
        	debugger;
        	$scope.submitted = true;
        }

        $scope.syncCustom = function(value) {
           
            if(value==="" || String(value)=="hello") {
                return true;
            } else {
                return false;
            }
        } 

        $scope.asyncCustom = function(value) {

            var deferred = $q.defer();
            
            if(value==="" || String(value)=="hello") {
                deferred.resolve();
            } else {
                deferred.reject('Async Custom message. The valid value is \'hello\'');
            }                                       
                                        
            return deferred.promise;
        }
});
