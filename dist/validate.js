

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

                    	var instance = {form: form,
                                        reset: reset,
                                      	validate: validate,
                                       	update: update };

                        form.$submitting = false;
                        form.$submited = false;
                        form.instance = instance;
						$scope.form = form;
                        $scope.models = {};
                        $scope.instance = instance;

                        var element = angular.element(element);
                        element.on('submit', function(event) {

                            var promises = [];
                            form.$submitting = true;
                           	form.$submitted = true;
                            angular.forEach(form,function(controller,key) {

                                if(controller && controller.element) {

                                    if(visible(controller.element)) {

                                        controller.$validate();

                                        if(!fsUtil.isEmpty(controller.$asyncValidators)) {

	                                        //HACK: Detects when the asyncValidators promises have completed.
	                                        //This is because angular validate doesn't expose the async promises
	                                        promises.push($q(function(resolve) {
	                                        	var watch = $scope.$watch(function() {
	                                        		if(controller.$pending===undefined) {
	                                        			resolve();
	                                        			watch();
	                                        		}
	                                        	});
	                                        }));
	                                    }

                                    } else {

                                    	//If there are any unaccounted for controllers (no element attached) then mark it as valid
                                        angular.forEach(controller.$validators,function(value,name) {
                                            controller.$setValidity(name,true);
                                        });
                                    }
                                }
                            });

                            $q.all(promises)
                            .then(function() {

                            	$q(function(resolve) {

	                                if(form.$valid) {

	                                	var result = null;
	                                    if($scope.onsubmit) {
	                                        result = $scope.$parent.$eval($scope.onsubmit);

	                                        if(angular.isObject(result) && result.then) {
	                                            result.then(resolve);
	                                        }
	                                    }

	                                    if(!result) {
	                                    	resolve();
	                                    }

	                                } else {
	                                    var el = angular.element(element[0].querySelector('.ng-invalid'))[0];

	                                    if(el) {;
	                                        el.focus();
	                                    }

	                                    fsAlert.error('Changes not saved.  Please review errors highlighted in red.',{ mode: 'toast' });
	                                    resolve();
	                                }

	                            }).then(function() {

	                            	var submits = angular.element(element[0].querySelectorAll('button[type="submit"]'));
	                            	submits.removeAttr('disabled');

	                            	$timeout(function() {
                                        submits.removeAttr('disabled');
                                    },500);

	                            	form.$submitting = false;
	                            });
                            });

                        }).attr('novalidate','novalidate');

                        if($scope.autocomplete===undefined) {
                            element.attr('autocomplete','off');
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

                        function reset(name) {

                        	if(name) {
                        		var model = form[name];
                        		if(model) {
		                            model.$setPristine();
		                            model.$setUntouched();
		                        }
	                        } else {
	                        	form.$setPristine();
	                            form.$setUntouched();
	                        }
                        }

						function validate(name) {

                            angular.forEach(form.$error, function(error,field) {
                                angular.forEach(error, function(field) {
                                	if(!name || field.$name==name) {
	                                    field.$validate();
	                                }
                                });
                            });

                            return form.$valid;
                        }

                        function attr(el, name) {
                        	return el[0].attributes[name] ? el[0].attributes[name].value : undefined;
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
                                var scope = input.data('scope') ? input.data('scope') : $scope.$parent;

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

                                if(attr(input,'required')!==undefined) {

                                    var message = attr(input,'required-message') || 'Required';

                                    validators.required = angular.bind(this, function(value) {

                                    												var required = attr(input,'ng-required') ? attr(input,'ng-required') : attr(input,'required');

                                    												if(required && !scope.$eval(required)) {
                                    													return true;
                                    												}

                                                                                    return !!fsUtil.string(value).length;
                                                                                });

                                    messages.push('<ng-message when="required">' + message + '</ng-message>');
                                }

                                if(attr(input,'minlength')!==undefined) {

                                    var message = attr(input,'minlength-message') || 'The value must be at least {{minlength}} characters';

                                    message = $interpolate(message)({ minlength: attr(input,'minlength') });

                                    validators.minlength = angular.bind(this, function(length, value) {
                                                                                    return !fsUtil.string(value).length || String(value).length>=parseInt(length);
                                                                                },attr(input,'minlength'));

                                    messages.push('<ng-message when="minlength">' + message + '</ng-message>');
                                }

                                if(attr(input,'maxlength')!==undefined) {

                                    var message = attr(input,'maxlength-message') || 'The value exceeds {{maxlength}} characters';

                                    message = $interpolate(message)({ maxlength: attr(input,'maxlength') });

                                    validators.maxlength = angular.bind(this, function(length, value) {
                                                                                return !fsUtil.string(value).length || String(value).length<=parseInt(length);
                                                                            },attr(input,'maxlength'));

                                    input.attr('maxlength',null);
                                    messages.push('<ng-message when="maxlength">' + message + '</ng-message>');
                                }

                                if(attr(input,'range')!==undefined) {

                                    var message = attr(input,'range-message') || 'Enter a value between {{min}} and {{max}}';

                                    message = $interpolate(message)({ min: attr(input,'min'), max: attr(input,'max') });

                                    validators.max = null;
                                    validators.min = null;

                                    validators.range = angular.bind(this, function(min, max, value) {
                                                                                return !fsUtil.string(value).length || (value>=min && value<=max);
                                                                            },attr(input,'min'),attr(input,'max'));

                                    messages.push('<ng-message when="range">' + message + '</ng-message>');
                                }

                                if(attr(input,'phone')!==undefined || attr(input,'type')=='tel') {

                                    var message = attr(input,'tel-message') || 'Enter a valid phone number';

                                    messages.push('<ng-message when="tel">' + message + '</ng-message>');

                                    validators.tel = function(value) {

										if(attr(input,'phone') && !$scope.$parent.$eval(attr(input,'phone'))) {
                                    		return true;
										}

                                    	return !fsUtil.string(value).length || fsValidate.phone(value);
                                    }
                                }

                                if(attr(input,'email')!==undefined) {

                                    var message = attr(input,'email-message') || 'Enter a valid email';

                                    messages.push('<ng-message when="email">' + message + '</ng-message>');

                                    validators.email = function(value) {

                                    	if(attr(input,'email') && !$scope.$parent.$eval(attr(input,'email'))) {
                                    		return true;
                                    	}

                                    	return !fsUtil.string(value).length || fsValidate.email(value);
                                    }
                                }

                                if(attr(input,'min')!==undefined) {

                                    var message = attr(input,'min-message') || 'Enter a number greater then or equal to {{min}}';

                                    message = $interpolate(message)({ min: attr(input,'min') });

                                    validators.min = angular.bind(this, function(min, value) {
                                                                                return !fsUtil.string(value).length || value>=min;
                                                                            },attr(input,'min'));

                                    messages.push('<ng-message when="min">' + message + '</ng-message>');
                                }

                                if(attr(input,'max')!==undefined) {

                                    var message = attr(input,'max-message') || 'Enter a number less then or equal to {{max}}';

                                    message = $interpolate(message)({ max: attr(input,'max') });

                                    validators.max = angular.bind(this, function(max, value) {
                                                                                return !fsUtil.string(value).length || value<max;
                                                                            },attr(input,'max'));

                                    messages.push('<ng-message when="max">' + message + '</ng-message>');
                                }

                                if(attr(input,'numeric')!==undefined) {

                                    var message = attr(input,'numeric-message') || 'Invalid number';

                                    validators.numeric = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isNumeric(value);
                                                                            });

                                    messages.push('<ng-message when="numeric">' + message + '</ng-message>');
                                }


                                if(attr(input,'integer')!==undefined) {

                                    var message = attr(input,'integer-message') || 'Invalid whole number';

                                    validators.integer = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isInt(value);
                                                                            });

                                    messages.push('<ng-message when="integer">' + message + '</ng-message>');
                                }

                                if(attr(input,'currency')!==undefined) {

                                    var message = attr(input,'currency-message') || 'Invalid format';

                                    validators.currency = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isNumeric(value);
                                                                            });

                                    messages.push('<ng-message when="currency">' + message + '</ng-message>');
                                }

                                if(attr(input,'compare')!==undefined) {
                                    var message = attr(input,'compare-message') || 'Mismatched value';

                                    $scope.$parent.$watch(attr(input,'compare'),angular.bind(this, function(controller, password) {
                                        controller.$validate();
                                    },controller));

                                    validators.compare = angular.bind(this, function(compareto, value) {
                                                                                var compare = $scope.$parent.$eval(compareto);
                                                                                return compare===value;
                                                                            },attr(input,'compare'));

                                    messages.push('<ng-message when="compare">' + message + '</ng-message>');
                                }



                                angular.forEach(['custom','custom-submit'],function(type) {

                                    if(attr(input,type)===undefined) {
                                        return;
                                    }

                                    messages.push('<ng-message when="' + type + '">' + (attr(input,'custom-message') || '') + '</ng-message>');

                                    if(type=='custom') {
                                        input.on('blur',function() {
                                            controller.$validate();
                                        });
                                    }

                                    var custom = angular.bind(this,
                                        function(input, element, form, type, value, oldValue) {

                                            if(attr(input,'type')=='num') {
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
                                                if(type=='custom-submit' && !form.$submitting) {
                                                    return resolve();
                                                }

                                                var result = scope.$eval(attr(input,type));

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
                                                       angular.element(element[0].querySelector('ng-messages[name="' + attr(input,'name') + '"] ng-message[when="' + type + '"]'))
                                                        .text(message);
                                                    });
                                                }
                                                return $q.reject(message);
                                            });

                                            return promise;
                                    },input, element, $scope.form, type);

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
                                    validators.required = angular.bind(this, function(checkboxes, form, container) {

                                        var valid = false, dirty = false;
                                        angular.forEach(checkboxes,function(checkbox) {
                                            var name = angular.element(checkbox).attr('name');
                                            var item = form[name];
                                            if(item) {
                                            	if(item.$viewValue) {
                                                	valid = true;
                                                }

                                                if(item.$dirty) {
                                                	dirty = true;
                                                }
                                            }
                                        });

                                        if(dirty) {
                                        	container.$setTouched();
                                        }

                                        return valid;

                                    },checkboxes, $scope.form, $scope.form[name]);
                                }

                                if(angular.element(container).attr('required')!==undefined) {
                                    var message = angular.element(container).attr('required-message') || 'Required';
                                    messages.push('<ng-message when="required">' + message + '</ng-message>');
                                }

                                //Prevalidate the form. Avoid required $error.required = true
                                controller.$validate();

                                if(messages.length)  {

                                    var ngmessages = angular.element('<ng-messages ' +
                                                                        'name="' + name + '" ' +
                                                                        'md-auto-hide="false" ' +
                                                                        'ng-class="{ submitted: form.$submitted, touched: form[\'' + attr(input,'name') + '\'].$touched }" ' +
                                                                        'for="form[\'' + attr(input,'name') + '\'].$error">' + messages.join('') + '</ng-messages>');

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

