

(function () {
    'use strict';
    angular.module('fs-angular-validate',['ngMessages'])
    .directive('fsValidate', function($parse, $compile, $q, $timeout) {
        return {
            require: 'form',
            restrict: 'A',
            replace: false,
            scope: {
                onsubmit: '@?fsValidate',
                autocomplete: '@',
                instance: '=?fsInstance'
            },  

           compile: function(tElem, tAttrs) {

                function guid()
                {
                    return 'xxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                        return v.toString(16);
                    });
                }

                angular.forEach(tElem[0].querySelectorAll('md-input-container'),function(container) {
                   
                    var input = angular.element(container.querySelectorAll('input,textarea,select,md-select'));

                    if(!input.attr('name')) {
                        input.attr('name','input_' + guid());
                    }
                });

                angular.forEach(tElem[0].querySelectorAll('md-datepicker-container md-datepicker'),function(input) {
                    var input = angular.element(input);

                    if(!input.attr('name')) {
                        input.attr('name','input_' + guid());
                    }
                });

                return {

                    pre: function($scope, element, attrs, form) {
                   
                        $scope.form = form;
                        $scope.instance = { form: form,
                                            validate: function() {

                                                angular.forEach(form.$error, function(error) {
                                                    angular.forEach(error, function(field) {
                                                        field.$setDirty();
                                                        field.$setTouched();
                                                    });
                                                });

                                                return form.$valid;

                                            }};

                        var element = angular.element(element);
                        element.on("submit", function(event) {

                            var validations = [];
                            angular.forEach(form,function(controller) {

                                if(controller && controller.$asyncValidators && controller.$asyncValidators['custom-submit']) {
                                
                                    angular.forEach(controller.$asyncValidators,function(validator) {
                                        validations.push(validator(controller.$viewValue,controller.$viewValue,true)
                                                            .then(function() {                                                                
                                                                controller.$setValidity('custom-submit', true);
                                                            },function() {
                                                                controller.$setValidity('custom-submit', false);
                                                            }));
                                    });
                                }
                            });

                            $q.all(validations)
                            .then(function() {

                                if(form.$valid) {
                                    if($scope.onsubmit) {
                                         $scope.$parent.$eval($scope.onsubmit);
                                    }
                                } else {
                                    
                                    var el = angular.element(element[0].querySelector('.ng-invalid'))[0];

                                    if(el) {
                                        el.focus();
                                    }                                    
                                }
                            });

                        }).attr('novalidate','novalidate');

                        if($scope.autocomplete===undefined) {
                            element.attr('autocomplete','off');
                        }
                        
                        $scope.$watch('form.$submitted',function(value) {
                            $scope.submitted = value;
                        },true);

                        var isEmpty = function(value) {
                            return value===undefined || value===null || value==="";
                        }

                        $timeout(function() {

                            $scope.inputs = {};
                            angular.forEach(element[0].querySelectorAll('md-input-container,md-datepicker-container'),function(container) {
 
                                var input = [];
                              
                                if(container.nodeName.toLowerCase()==='md-datepicker-container') {
                                    input = angular.element(container.querySelectorAll('md-datepicker'));                                 
                                } else {
                                    input = angular.element(container.querySelectorAll('input,textarea,select,md-select'));
                                }

                                if(input.length) {

                                    var name = input.attr('name');
                                    var messages = [];

                                    if(!name) {
                                        name = 'input_' + guid();
                                        input.attr('name',name);                                    
                                    }

                                    var controller = $scope.form[name];

                                    if(!controller) {
                                        return;
                                    }

                                    var validators = controller.$validators;

                                    if(input.attr('required')!==undefined) {

                                        var message = input.attr('required-message') || 'Please enter a value';

                                        messages.push('<ng-message when="required">' + message + '</ng-message>');
                                    }

                                    if(input.attr('minlength')!==undefined) {

                                        var message = input.attr('minlength-message') || 'The value must be at least ' + input.attr('minlength') + ' charaters';

                                        validators.minlength = angular.bind(this, function(length, value) {
                                                                                        return isEmpty(value) || String(value).length>=parseInt(length);
                                                                                    },input.attr('minlength'));

                                        messages.push('<ng-message when="minlength">' + message + '</ng-message>');
                                    }

                                    if(input.attr('maxlength')!==undefined) {

                                        var message = input.attr('maxlength-message') || 'The value exceeds ' + input.attr('maxlength') + ' charaters';
                                        
                                        validators.maxlength = angular.bind(this, function(length, value) {
                                                                                    return isEmpty(value) || String(value).length<parseInt(length);
                                                                                },input.attr('maxlength'));            
                                        
                                        input.attr('maxlength',null);
                                        messages.push('<ng-message when="maxlength">' + message + '</ng-message>');
                                    }

                                    if(input.attr('range')!==undefined) {

                                        var message = input.attr('range-message') || 'Enter a value between ' + input.attr('min') + ' and ' + input.attr('max');
                                        
                                        validators.max = null;
                                        validators.min = null;

                                        validators.range = angular.bind(this, function(min, max, value) {
                                                                                    return isEmpty(value) || (value>=min && value<=max);
                                                                                },input.attr('min'),input.attr('max'));            

                                        messages.push('<ng-message when="range">' + message + '</ng-message>');
                                    }

                                    if(input.attr('type')=='tel') {
                                         
                                        var message = input.attr('tel-message') || 'Please enter a valid phone number';

                                        messages.push('<ng-message when="tel">' + message + '</ng-message>');

                                        validators.tel = function(value) {
                                            var valid = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value);
                                            return valid || !String(value).length;
                                        }
                                    }

                                    if(input.attr('email')!==undefined) {
                                        
                                        var message = input.attr('email-message') || 'Please enter a valid email';

                                        messages.push('<ng-message when="email">' + message + '</ng-message>');

                                        validators.email = function(value) {
                                            
                                            var valid = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);

                                            return isEmpty(value) || !String(value).length || valid
                                        }
                                    }
                                        
                                    angular.forEach(['custom','custom-submit'],function(type) {

                                        if(input.attr(type)===undefined) {
                                            return;
                                        }

                                        messages.push('<ng-message when="' + type + '"></ng-message>');

                                        var custom = angular.bind(this,
                                            function(input, element, $scope, type, value, oldValue, submitting) {                                                

                                                var updateMessage = function(message) {
                                                    setTimeout(function() {
                                                        message = message || input.attr('custom-message');
                                                        var el = angular.element(element[0].querySelector('ng-messages[name=\'' + input.attr('name') + '\'] ng-message[when=\'' + type + '\']'));
                                                        el.text(message);
                                                    });
                                                }

                                                if(input.attr('type')=='num') {
                                                    if(value===undefined) {
                                                        value = null;
                                                    }
                                                } else {
                                                    if(value===undefined || value===null) {
                                                        value = '';
                                                    }
                                                }

                                                var defer = $q.defer();

                                                if(type=='custom-submit' && !submitting) {
                                                    defer.resolve();
                                                    return defer.promise;
                                                }

                                                var result = $scope.$parent.$eval(input.attr(type));

                                                if(angular.isFunction(result)) {
                                                    result = result(value);
                                                }

                                                if(angular.isObject(result) && result.catch) {

                                                    result
                                                    .then(function() {
                                                        defer.resolve();
                                                    })
                                                    .catch(function(message) {

                                                        defer.reject();
                                                        updateMessage(message);

                                                    });
                                                } else {
                                                   if(result===true) {
                                                        defer.resolve();
                                                   } else {
                                                        defer.reject(result);
                                                        updateMessage(result);
                                                   }
                                                }

                                                return defer.promise;
                                        },input, element, $scope, type);
                                 
                                        $scope.form[name].$asyncValidators[type] = custom;
                                    });


                                    if(input.attr('min')!==undefined) {

                                        var message = input.attr('min-message') || 'Please enter a number greater then or equal to ' + String(input.attr('min'));

                                        validators.min = angular.bind(this, function(min, value) {
                                                                                    return isEmpty(value) || value>=min;
                                                                                },input.attr('min'));

                                        messages.push('<ng-message when="min">' + message + '</ng-message>');
                                    }

                                    if(input.attr('max')!==undefined) {
                                        
                                        var message = input.attr('max-message') || 'Please enter a number less then or equal to ' + String(input.attr('max'));

                                        validators.max = angular.bind(this, function(max, value) {
                                                                                    return isEmpty(value) || value<max;
                                                                                },input.attr('max'));

                                        messages.push('<ng-message when="max">' + message + '</ng-message>');
                                    }
                                    
                                    if(input.attr('compare')!==undefined) {
                                        var message = input.attr('compare-message') || 'Mismatched value';

                                        validators.compare = angular.bind(this, function(compareto, value) {
                                                                                    var compare = $scope.$parent.$eval(compareto);
                                                                                    return compare===value;
                                                                                },input.attr('compare'));

                                        messages.push('<ng-message when="compare">' + message + '</ng-message>');
                                    }
                                    
                                    if(messages.length)  {

                                        $scope.$watch('form.' + name,function(value) {
                                            $scope.inputs[name] = value;
                                        },true);

                                        var ngmessages = angular.element('<ng-messages name="' + name + '" md-auto-hide="false" ng-show="submitted || inputs[\'' + name + '\'].$touched" for="inputs[\'' + name + '\'].$error">' + messages.join('') + '</ng-messages>');

                                        angular.element(container).append(ngmessages);
                                        $compile(ngmessages)($scope);
                                    }
                                }
                            });
                        });
                    }
                }
            }  
        };
    });
})();




