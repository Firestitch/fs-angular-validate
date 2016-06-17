'use strict';


angular.module('app')
  .controller('DemoCtrl', function ($scope, $q) {

    $scope.user = { phone: '' };

    $scope.asyncCustomSubmit = function() {
        var defer = $q.defer();

        if($scope.user.asynccustomsubmit=='123123')
            defer.resolve();
        else
            defer.reject("The the value for Asynchronous Custom Submit is not equal to 123123");

        return defer.promise;
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

            query.count = 22;

            var data = [{ name: '1111111111111' },{ name: '222222222222222' }];

            cb(data);

        },

        load: true,

        
        paging: {

            infinite: true,
            limit: 5
        },
        
        //paging: false,
        /*
        action:
        {   
            click: function(data, event) {

                if(this.delete) {
                   
                }                
            },
            delete: {
                title: 'Attention',
                content: 'Please confirm',
                ok: function(data) {
                    alert('OK!');
                }

            }
        },
        */

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
                    return "<b>" + data['name'] + "</b>";
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
        
        filters: [
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
        ]
    };
    
    
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
