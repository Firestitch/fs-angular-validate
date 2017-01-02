

(function () {
    'use strict';


	/**
	 * @ngdoc directive
	 * @name rfx.directive:rAutogrow
	 * @element textarea
	 * @function
	 *
	 * @description
	 * Resize textarea automatically to the size of its text content.
	 *
	 * **Note:** ie<9 needs pollyfill for window.getComputedStyle
	 *
	 * @example
	   <example module="rfx">
	     <file name="index.html">
	         <textarea ng-model="text" r-autogrow class="input-block-level"></textarea>
	         <pre>{{text}}</pre>
	     </file>
	   </example>
	 */


    angular.module('fs-angular-validate',['ngMessages','fs-angular-util','fs-angular-alert'])
    .directive('fsValidate', function($parse, $compile, $q, $timeout, fsUtil, fsAlert, fsValidate, $interpolate) {
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

                angular.forEach(tElem[0].querySelectorAll('md-input-container,md-checkbox-container,md-datepicker-container'),function(container) {

                    var inputs = container.querySelectorAll('input,textarea,select,md-select,md-checkbox,md-datepicker');

                    // Go through and find any inputs and if there is no name add one. This is so they will be
                    // initialized in the form controller
                    angular.forEach(inputs,function(input) {
                        var input = angular.element(input);
                        if(!input.attr('name')) {
                            input.attr('name','input_' + fsUtil.guid());
                        }
                    });

                    // For the checkbox container fake a model view controller so that it will be
                    // initialized in the form controller
                    if(container.nodeName.toLowerCase()==='md-checkbox-container') {
                        var name = 'container_' + fsUtil.guid();
                        angular.element(container).attr('name',name);
                        angular.element(container).attr('ng-model','models[' + name + ']');
                        angular.element(inputs).attr('container-name',name);
                    }
                });

                return {

                    pre: function($scope, element, attrs, form) {

                        $scope.form = form;
                        $scope.models = {};
                        $scope.$parent.submitting = false;
                        $scope.instance = { form: form,
                                            reset: reset,
                                           	validate: validate,
                                           	update: update };

                        var element = angular.element(element);
                        element.on('submit', function(event) {

                            var validations = [];
                            angular.forEach(form,function(controller,key) {

                                if(controller && controller.element) {

                                    if(visible(controller.element)) {

                                        if(controller.$asyncValidators && controller.$asyncValidators['custom-submit']) {

                                            var validator = controller.$asyncValidators['custom-submit'];

                                            validations.push(validator(controller.$viewValue,controller.$viewValue,true)
                                                                .then(function() {
                                                                    controller.$setValidity('custom-submit', true);
                                                                },function() {
                                                                    controller.$setValidity('custom-submit', false);
                                                                }));
                                        } else {
                                            controller.$validate();
                                        }

                                    } else {
                                        angular.forEach(controller.$validators,function(value,name) {
                                            controller.$setValidity(name,true);
                                        });
                                    }
                                }
                            });

                            $q.all(validations)
                            .then(function() {
                                $scope.$parent.submitting = true;

                                var submits = angular.element(element[0].querySelectorAll('button[type="submit"]'));

                                if(form.$valid) {
                                    submits.attr('disabled','disabled');

                                    var submitted = function() {
                                        $timeout(function() {
                                            $scope.$parent.submitting = false;
                                            submits.removeAttr('disabled');
                                        },500);
                                    }

                                    if($scope.onsubmit) {
                                        var result = $scope.$parent.$eval($scope.onsubmit);

                                        if(angular.isObject(result) && result.then) {
                                            result.then(function() {
                                                submitted();
                                            });
                                        } else {
                                            submitted();
                                        }
                                    }

                                } else {
                                    var el = angular.element(element[0].querySelector('.ng-invalid'))[0];

                                    if(el) {
                                        el.focus();
                                    }

                                    fsAlert.error('Changes not saved.  Please review errors highlighted in red.',{ mode: 'toast' });
                                }
                            });

                        }).attr('novalidate','novalidate');

                        if($scope.autocomplete===undefined) {
                            element.attr('autocomplete','off');
                        }

                        $scope.$watch('form.$submitted',function(value) {
                            $scope.submitted = value;
                        },true);

                        $scope.$error = function(objects) {
                            var error = {};

                            angular.forEach(objects,function(object) {
                                angular.forEach(object.$error,function(value, key) {
                                    error[key] = value;
                                });
                            });

                            return error;
                        }

                        function visible(el) {
                            try {

                                var style = window.getComputedStyle(el,null);
                                if(style && (style.visibility=='hidden' || style.opacity=='0' || style.display=='none')) {
                                    return false;
                                }

                            } catch(e) {}

                            if(el.parentNode) {
                                return visible(el.parentNode);
                            }

                            return true;
                        }

                        function reset() {
                            form.$setPristine();
                            form.$setUntouched();
                            $scope.submitted = false;
                        }

						function validate() {
                            angular.forEach(form.$error, function(error) {
                                angular.forEach(error, function(field) {
                                    field.$setDirty();
                                    field.$setTouched();
                                });
                            });

                            return form.$valid;
                        }

                        function update() {

							angular.forEach(element[0].querySelectorAll('md-input-container,md-checkbox-container,md-datepicker-container'),function(container) {

                                var messages = [];
                                var containerName = container.nodeName.toLowerCase();
                                var input;

                                if(containerName==='md-datepicker-container') {
                                    input = container.querySelector('md-datepicker');

                                } else if(containerName==='md-checkbox-container') {
                                    input = container;

                                } else {
                                    input = container.querySelector('input,textarea,select,md-select');
                                }

                                var input = angular.element(input);
                                var name = input.attr('name');
                                var controller = $scope.form[name];

                                if(!controller || input.data('fs-validate')) {
                              		return;
                                }

                                var validators = controller.$validators;

                                input.data('fs-validate',true);

                                if(containerName==='md-datepicker-container' || containerName==='md-checkbox-container') {
                                    controller.element = container;
                                } else {
                                    controller.element = input[0];
                                }

                                if(!name) {
                                    name = 'input_' + fsUtil.guid();
                                    input.attr('name',name);
                                }

                                if(input.attr('required')!==undefined) {

                                    var message = input.attr('required-message') || 'Required';

                                    validators.required = angular.bind(this, function(value) {
                                                                                    return !!fsUtil.string(value).length;
                                                                                });

                                    messages.push('<ng-message when="required">' + message + '</ng-message>');
                                }

                                if(input.attr('minlength')!==undefined) {

                                    var message = input.attr('minlength-message') || 'The value must be at least {{minlength}} characters';

                                    message = $interpolate(message)({ minlength: input.attr('minlength') });

                                    validators.minlength = angular.bind(this, function(length, value) {
                                                                                    return fsUtil.isEmpty(value) || String(value).length>=parseInt(length);
                                                                                },input.attr('minlength'));

                                    messages.push('<ng-message when="minlength">' + message + '</ng-message>');
                                }

                                if(input.attr('maxlength')!==undefined) {

                                    var message = input.attr('maxlength-message') || 'The value exceeds {{maxlength}} characters';

                                    message = $interpolate(message)({ maxlength: input.attr('maxlength') });

                                    validators.maxlength = angular.bind(this, function(length, value) {
                                                                                return fsUtil.isEmpty(value) || String(value).length<=parseInt(length);
                                                                            },input.attr('maxlength'));

                                    input.attr('maxlength',null);
                                    messages.push('<ng-message when="maxlength">' + message + '</ng-message>');
                                }

                                if(input.attr('range')!==undefined) {

                                    var message = input.attr('range-message') || 'Enter a value between {{min}} and {{max}}';

                                    message = $interpolate(message)({ min: input.attr('min'), max: input.attr('max') });

                                    validators.max = null;
                                    validators.min = null;

                                    validators.range = angular.bind(this, function(min, max, value) {
                                                                                return fsUtil.isEmpty(value) || (value>=min && value<=max);
                                                                            },input.attr('min'),input.attr('max'));

                                    messages.push('<ng-message when="range">' + message + '</ng-message>');
                                }

                                if(input.attr('phone')!==undefined || input.attr('type')=='tel') {

                                    var message = input.attr('tel-message') || 'Enter a valid phone number';

                                    messages.push('<ng-message when="tel">' + message + '</ng-message>');

                                    validators.tel = function(value) {
                                    	return fsValidate.phone(value);
                                    }
                                }

                                if(input.attr('email')!==undefined) {

                                    var message = input.attr('email-message') || 'Enter a valid email';

                                    messages.push('<ng-message when="email">' + message + '</ng-message>');

                                    validators.email = function(value) {
                                    	return fsValidate.email(value);
                                    }
                                }

                                if(input.attr('min')!==undefined) {

                                    var message = input.attr('min-message') || 'Enter a number greater then or equal to {{min}}';

                                    message = $interpolate(message)({ max: input.attr('min') });

                                    validators.min = angular.bind(this, function(min, value) {
                                                                                return fsUtil.isEmpty(value) || value>=min;
                                                                            },input.attr('min'));

                                    messages.push('<ng-message when="min">' + message + '</ng-message>');
                                }

                                if(input.attr('max')!==undefined) {

                                    var message = input.attr('max-message') || 'Enter a number less then or equal to {{max}}';

                                    message = $interpolate(message)({ max: input.attr('max') });

                                    validators.max = angular.bind(this, function(max, value) {
                                                                                return fsUtil.isEmpty(value) || value<max;
                                                                            },input.attr('max'));

                                    messages.push('<ng-message when="max">' + message + '</ng-message>');
                                }

                                if(input.attr('numeric')!==undefined) {

                                    var message = input.attr('numeric-message') || 'Invalid number';

                                    validators.numeric = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isNumeric(value);
                                                                            });

                                    messages.push('<ng-message when="numeric">' + message + '</ng-message>');
                                }


                                if(input.attr('integer')!==undefined) {

                                    var message = input.attr('integer-message') || 'Invalid whole number';

                                    validators.integer = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isInt(value);
                                                                            });

                                    messages.push('<ng-message when="integer">' + message + '</ng-message>');
                                }

                                if(input.attr('currency')!==undefined) {

                                    var message = input.attr('currency-message') || 'Invalid format';

                                    validators.currency = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isNumeric(value);
                                                                            });

                                    messages.push('<ng-message when="currency">' + message + '</ng-message>');
                                }

                                if(input.attr('compare')!==undefined) {
                                    var message = input.attr('compare-message') || 'Mismatched value';

                                    $scope.$parent.$watch(input.attr('compare'),angular.bind(this, function(controller, password) {
                                        controller.$validate();
                                    },controller));

                                    validators.compare = angular.bind(this, function(compareto, value) {
                                                                                var compare = $scope.$parent.$eval(compareto);
                                                                                return compare===value;
                                                                            },input.attr('compare'));

                                    messages.push('<ng-message when="compare">' + message + '</ng-message>');
                                }



                                angular.forEach(['custom','custom-submit'],function(type) {

                                    if(input.attr(type)===undefined) {
                                        return;
                                    }

                                    messages.push('<ng-message when="' + type + '">' + (input.attr('custom-message') || '') + '</ng-message>');

                                     if(type=='custom') {
                                        input.on('blur',function() {
                                            controller.$validate();
                                        });
                                    }

                                    var custom = angular.bind(this,
                                        function(input, element, $scope, type, value, oldValue, submitting) {

                                            if(input.attr('type')=='num') {
                                                if(value===undefined) {
                                                    value = null;
                                                }
                                            } else {
                                                if(value===undefined || value===null) {
                                                    value = '';
                                                }
                                            }

                                            var promise = $q(function(resolve,reject) {

                                                 // Only process a custom-submit validator when called from on('submit')
                                                if(type=='custom-submit' && !submitting) {
                                                    return resolve();
                                                }

                                                var scope = input.data('scope') ? input.data('scope') : $scope.$parent;
                                                var result = scope.$eval(input.attr(type));

                                                try {

	                                                if(angular.isFunction(result)) {
	                                                    result = result(value);
	                                                }

	                                                if(angular.isObject(result) && result.catch) {

	                                                    result
	                                                    .then(function() {
	                                                        resolve();
	                                                    })
	                                                    .catch(function(message) {
	                                                        reject(message);
	                                                    });

	                                                } else {
	                                                   if(result===true) {
	                                                        resolve();
	                                                   } else {
	                                                        reject(result);
	                                                   }
	                                                }

	                                            } catch(e) {
	                                            	reject(e);
	                                            }
                                            });

                                            promise
                                            .then(function(message) {
                                                return message;
                                            },function(message) {
                                                if(message) {
                                                    $timeout(function() {
                                                       angular.element(element[0].querySelector('ng-messages[name="' + input.attr('name') + '"] ng-message[when="' + type + '"]'))
                                                        .text(message);
                                                    });
                                                }
                                                return $q.reject(message);
                                            });

                                            return promise;
                                    },input, element, $scope, type);

                                    $scope.form[name].$asyncValidators[type] = custom;
                                });

                                if(angular.element(container).attr('required')!==undefined) {

                                    var checkboxes = container.querySelectorAll('md-checkbox');

                                    angular.forEach(checkboxes,function(checkbox) {
                                        var name = angular.element(checkbox).attr('name');

                                        $scope.$watch('form.' + name + '.$viewValue',function(value) {
                                            controller.$validate();
                                        });
                                    });

                                    controller.$setValidity('required', false);
                                    validators.required = angular.bind(this, function(checkboxes, form) {

                                        var valid = false;

                                        angular.forEach(checkboxes,function(checkbox) {
                                            var name = angular.element(checkbox).attr('name');
                                            if(form[name].$viewValue) {
                                                valid = true;
                                            }
                                        });

                                        return valid;

                                    },checkboxes, $scope.form);
                                }

                                if(angular.element(container).attr('required')!==undefined) {
                                    var message = angular.element(container).attr('required-message') || 'Required';
                                    messages.push('<ng-message when="required">' + message + '</ng-message>');
                                }

                                if(messages.length)  {

                                    var ngmessages = angular.element('<ng-messages ' +
                                                                        'name="' + name + '" ' +
                                                                        'md-auto-hide="false" ' +
                                                                        'ng-show="(submitted || form[\'' + input.attr('name') + '\'].$touched)" ' +
                                                                        'for="form[\'' + input.attr('name') + '\'].$error">' + messages.join('') + '</ng-messages>');

                                    angular.element(container).append(ngmessages);
                                    $compile(ngmessages)($scope);
                                }
                            });
                        }

						//HACK: In order to listen for new controls the code below has to override then
						//      do some function switching and reseting.
						function addControl(control) {

							if(!control.$name) {
								return;
							}

							try {
								$scope.form.$addControl = $addControl;
								$scope.form.$addControl(control);
								$timeout(update);
							} catch(e) {}

							$scope.form.$addControl = addControl;
						}

						var $addControl = $scope.form.$addControl;
						$scope.form.$addControl = addControl;

	                    $timeout(update);
                    }
                }
            }
        };
    });
})();
(function () {
    'use strict';

	/**
     * @ngdoc service
     * @name fs.services:fsValidate
     */
     angular.module('fs-angular-validate')
    .factory('fsValidate', function(fsUtil) {

        return {
        	phone: phone,
        	email: email
        };

		/**
	     * @ngdoc method
	     * @name phone
	     * @methodOf fs.services:fsValidate
	     * @param {string} value The phone number to test
	     * @returns {boolean} The result of the validation
	     */
        function phone(value) {
	        var valid = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value);
	        return valid || !String(value).length;
        }

		/**
	     * @ngdoc method
	     * @name email
	     * @methodOf fs.services:fsValidate
	     * @param {string} value The email to test
	     * @returns {boolean} The result of the validation
	     */
        function email(value) {
			return !!fsUtil.string(value).match(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i);
        }
    });

})();

