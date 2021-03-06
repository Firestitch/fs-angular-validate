'use strict';


angular.module('app')
  .controller('DemoCtrl', function ($scope, $q, dummyService, $timeout) {

    $scope.user = { phone: '', fsphone: '' };
    $scope.formInstance = {};
    $scope.checkboxes = [{ name: 'Checkbox 1' },{ name: 'Checkbox 2' }];
    $scope.requiredCondition = true;
   	$scope.validateEmail = false;
    $scope.submitButton = 'Submit';
    $scope.select = 1;

    $scope.reset = function() {
    	$scope.submitButton = 'Submit';
        $scope.formInstance.reset();
    }

    $scope.changeDuration = function() {
    	var x = $scope.form.$valid;
    	debugger;
    }

    $scope.change = function() {
    	var valid = $scope.form.$valid;
    	debugger;
    }

    $scope.listerConf = {

        debug: false,

        //persist: 'lister',

       inline: true,

        rowClick: function(data) {
           // alert("Row Click: " + JSON.stringify(data));
        },
        data: function(query, cb) {

            //return setTimeout(function() { cb([]); }, 2000);
            query.count = 3;

            var url = 'https://service.firestitch.com/api/';

            dummyService.gets(query,{ url: url })
            .then(function(result) {
                cb(result.objects,result.paging);
            });


            //var data = [{ guid: '87asdfyg234rwas', name: '1111111111111' },{ guid: '974ruysdag32419', name: '222222222222222' }];

            //cb(data,{ pages: 1, records: 2, page: 1 });
        },
        load: true,
        paging: {
            infinite: true,
            limit: 5
        },
        actions: [

            {
                label: 'Edit',
                icon: 'edit',
                click: function(data, event, helper) {
                    helper.reload();
                    //alert("Edit Action Click: " + JSON.stringify(data));
                }
            },

            {
                label: 'Delete',
                show: function() { return true },
                delete:  {
                            content: 'Are you sure you would like to remove this?',
                            ok: function(data) {
                                alert("Delete Action Click: " + JSON.stringify(data));

                                var deferred = $q.defer();
                                deferred.resolve();
                                return deferred.promise;
                            }
                        }
            }

        ],

        columns: [
            {   title: 'Name' ,
                order: { name: 'name', default: true },
                value: function(data) {
                    return '{{data.name}}';
                }
            },
            {   title: 'Input' ,
                value: function(data) {
                    return '<md-input-container>\
                    			<input ng-model="model" name="input_{{data.guid}}" aria-label="label" numeric>\
                    		</md-input-container>';
                }
            }
        ],

        selection: {
            actions: [{
                icon: 'delete',
                label: 'Delete',
                click: function(selected, $event, helper) {
                    //alert("delete");
                }
            },
            {
                icon: 'forward',
                label: 'Move to Somewhere',
                click: function(selected, $event) {
                    fsModal
                    .show(  function($scope, modal) {
                                $scope.move = function() {
                                    fsModal.hide();
                                }

                                $scope.cancel = function() {
                                    fsModal.hide();
                                }
                            },
                            'views/modal.html',
                            { resolve : {
                                modal: function() {
                                    return $scope.modal;
                                }
                            }})
                    .then(function() {
                        $scope.modal();
                    });
                }
            }]
        },

       /* filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Search',
                param: 'search'
            },
            {
                name: 'state',
                type: 'select',
                label: 'State',
                values: {
                    __all: 'All',
                    active: 'Active',
                    deleted: 'Deleted'
                },
                multiple: false,
                default: 'active'
            },
            {
                name: 'multiple',
                type: 'select',
                label: 'Multiple',
                values: {
                    pear: 'Pear',
                    orange: 'Orange',
                    banana: 'Banana',
                    apple: 'Apple',
                },
                multiple: true
            },
            //{
            //    type: 'newline'
            //},
            {
                name: 'date',
                type: 'date',
                label: 'Date'
            },
            {
                name: 'range',
                type: 'range',
                label: 'Numbered range',
                placeholders: ['Min', 'Max']
            }
        ]*/
    };


    $scope.submit = function(event) {

    	$scope.submitButton = 'Submitting...';

		console.log("Submit");

        return $q(function(resolve) {

        	$timeout(function() {
        		resolve();

        		$scope.submitButton = 'Submit';
        	},2000);
        });
    }

    $scope.validator = function(value,user) {

        if(value==="" || String(value)=="hello") {
            return true;
        } else {
        	throw 'The valid value is "hello"';
            //return 'The valid value is "hello"';
        }
    }

    $scope.asyncValidator = function(value) {

       	return $q(function(resolve,reject) {
            if(value==="" || String(value)=="hello") {
                resolve();
            } else {
                reject('Async Custom message. The valid value is "hello"');
            }
       });
    }

    $scope.syncCustom = $scope.validator;
    $scope.asyncCustomSubmit = $scope.asyncValidator;

});
