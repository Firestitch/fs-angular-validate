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
                instance: '=?fsInstance',
                message: '@fsMessage'
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
                                       	update: update,
                                       	registerButton: registerButton,
                                       	message: false },
                                       	submitButton = null;

						if($scope.message!=='false') {
                        	instance.message = $scope.message;
                       		if($scope.message===undefined) {
                        		instance.message = 'Changes not saved.  Please review errors highlighted in red.';
                        	}
                        }

                        form.$submitting = false;
                        form.$submited = false;
                        form.instance = instance;
						$scope.form = form;
                        $scope.models = {};
                        $scope.instance = instance;
                        angular.element(element).data('instance',instance);

                        var buttons = angular.element([]);
                        angular.forEach(element[0].querySelectorAll('button'),function(button) {
                        	registerButton(button);
                        });

                        function registerButton(button) {

                        	buttons.push(button);
                        	button = angular.element(button);


							if(button.attr('type')=='submit') {
		                        button.on('click',function() {
		                        	submitButton = angular.element(this);
		                        });
	                        }
	                    }

			            var element = angular.element(element);
                        element.on('submit', function(event) {

                        	if(form.$submitting) {
                        		return false;
                        	}


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

                        	if(form.$valid) {
                        		angular.element(buttons).attr('disabled','disabled');
                        		if(submitButton) {
		                        	angular.element(submitButton)
		                        	.append(angular.element('<div class="fs-validate-submit-loader"><div></div></div>'));
		                        }
                        	}

                        	submitButton = null;

                            $q.all(promises)
                            .then(function() {

                            	$q(function(resolve) {

	                                if(form.$valid) {

	                                	var result = null;
	                                    if($scope.onsubmit) {

	                                        result = $scope.$parent.$eval($scope.onsubmit);

	                                        if(angular.isObject(result) && result.then) {
	                                            result.finally(resolve);
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

	                                    if(instance.message) {
	                                    	fsAlert.error(instance.message,{ mode: 'toast' });
	                                    }

	                                    resolve();
	                                }

	                            }).finally(function() {

	                            	$timeout(function() {
                                        form.$submitting = false;
	                            		angular.element(buttons).removeAttr('disabled');
	                            		angular.forEach(buttons,function(button) {
	                            			angular.element(button.querySelector('.fs-validate-submit-loader')).remove();
	                            		});
                                    },500); //This is the default time for a double click to avoid multiple submits
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


                        function attr(el, name, value) {

                    		if(arguments.length==2) {
                    			var attr = el[0].attributes[name];
                    			return attr ? attr.value : undefined;
                    		}

                   			el[0].setAttribute(name,value);
                        }

                        function update() {

							angular.forEach(element[0].querySelectorAll('md-input-container,md-checkbox-container,md-datepicker-container'),function(container) {

                                var messages = {};
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
                                var parentScope = $scope.$parent;

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

                                if(attr(input,'required')!==undefined || attr(input,'required-condition')!==undefined) {

                               		var required = attr(input,'required')!==undefined;
                                    if(attr(input,'required-condition')) {

                                    	var scope = input.data('required-scope') ? input.data('required-scope') : parentScope;

                                    	var watchRequired = function(value) {

                                    		required = value;
                                    		controller.$validate();

                                    		if(required) {
                                    			angular.element(container.querySelector('label'))
                                    				.addClass('md-required');
                                    			angular.element(container.querySelector('md-select'))
                                    				.attr('required','required');
                                    		} else {
                                    			angular.element(container.querySelector('label'))
                                    				.removeClass('md-required');
                                    			angular.element(container.querySelector('md-select'))
                                    				.removeAttr('required');
                                    		}
                                    	}

                                    	var condition = attr(input,'required-condition');

                                    	//Observe the whole condition if the expression is a formula and not
                                    	//simply watching a scope variable
                                    	if(condition.match(/[!><=]+/)) {
	                                    	scope.$watch(function() {
	                                    		watchRequired(scope.$eval(condition));
	                                    	});
	                                    } else {
	                                    	scope.$watch(condition,watchRequired);
	                                    }
                                    }

                                    validators.required = angular.bind(this, function(value) {
                                                                                    return !required || !!fsUtil.string(value).length;
                                                                                });

                                    messages.required = attr(input,'required-message') || 'Required';
                                }

                                if(attr(input,'minlength')!==undefined) {

                                    var message = attr(input,'minlength-message') || 'Must be at least {{minlength}} characters';

                                    message = $interpolate(message)({ minlength: attr(input,'minlength') });

                                    validators.minlength = angular.bind(this, function(length, value) {
                                                                                    return !fsUtil.string(value).length || String(value).length>=parseInt(length);
                                                                                },attr(input,'minlength'));

                                    messages.minlength = message;
                                }

                                if(attr(input,'maxlength')!==undefined) {

                                    var message = attr(input,'maxlength-message') || 'Must be no greater than {{maxlength}} characters';

                                    message = $interpolate(message)({ maxlength: attr(input,'maxlength') });

                                    validators.maxlength = angular.bind(this, function(length, value) {
                                                                                return !fsUtil.string(value).length || String(value).length<=parseInt(length);
                                                                            },attr(input,'maxlength'));

                                    input.attr('maxlength',null);
                                    messages.maxlength = message;
                                }

                                if(attr(input,'equallength')!==undefined) {

                                    var message = attr(input,'equallength-message') || 'Must be {{equallength}} characters';

                                    message = $interpolate(message)({ equallength: attr(input,'equallength') });

                                    validators.equallength = angular.bind(this, function(length, value) {
                                                                                return !fsUtil.string(value).length || String(value).length==parseInt(length);
                                                                            },attr(input,'equallength'));

                                    messages.equallength = message;
                                }

                                if(attr(input,'range')!==undefined) {

                                    var message = attr(input,'range-message') || 'Must be a number between {{min}} and {{max}}';

                                    message = $interpolate(message)({ min: attr(input,'min'), max: attr(input,'max') });

                                    validators.max = null;
                                    validators.min = null;

                                    validators.range = angular.bind(this, function(min, max, value) {
                                                                                return !fsUtil.string(value).length || (value>=min && value<=max);
                                                                            },attr(input,'min'),attr(input,'max'));

                                    messages.range = message;
                                }

                                if(attr(input,'phone')!==undefined || attr(input,'type')=='tel') {

                                    messages.tel = attr(input,'tel-message') || 'Must be a valid phone number';

                                    validators.tel = function(value) {
                                    	return !fsUtil.string(value).length || fsValidate.phone(value);
                                    }
                                }

                                if(attr(input,'email')!==undefined) {

                                    messages.email = attr(input,'email-message') || 'Must be a valid email';

                                    validators.email = function(value) {
                                    	return !fsUtil.string(value).length || fsValidate.email(value);
                                    }
                                }

                                if(attr(input,'min')!==undefined) {

                                    var message = attr(input,'min-message') || 'Must be a number greater than or equal to {{min}}';

                                    message = $interpolate(message)({ min: attr(input,'min') });

                                    validators.min = angular.bind(this, function(min, value) {
                                                                                min = parseFloat(min);
                                                                                return !fsUtil.string(value).length || value>=min;
                                                                            },attr(input,'min'));

                                    messages.min = message;
                                }

                                if(attr(input,'max')!==undefined) {

                                    var message = attr(input,'max-message') || 'Must be a number less than or equal to {{max}}';

                                    message = $interpolate(message)({ max: attr(input,'max') });

                                    validators.max = angular.bind(this, function(max, value) {
                                                                                max = parseFloat(max);
                                                                                return !fsUtil.string(value).length || value<=max;
                                                                            },attr(input,'max'));

                                    messages.max = message;
                                }

                                if(attr(input,'numeric')!==undefined) {

                                    validators.numeric = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isNumeric(value);
                                                                            });

                                    messages.numeric = attr(input,'numeric-message') || 'Must be a valid number';
                                }


                                if(attr(input,'integer')!==undefined) {

                                    validators.integer = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isInt(value);
                                                                            });

                                    messages.integer = attr(input,'integer-message') || 'Must be a whole number';
                                }

                                if(attr(input,'currency')!==undefined) {

                                    validators.currency = angular.bind(this, function(value) {
                                                                                return !fsUtil.string(value).length || fsUtil.isNumeric(value);
                                                                            });

                                    messages.currency = attr(input,'currency-message') || 'Must be a valid currency';
                                }

                                if(attr(input,'compare')!==undefined) {

                                    parentScope.$watch(attr(input,'compare'),angular.bind(this, function(controller, password) {
                                        controller.$validate();
                                    },controller));

                                    validators.compare = angular.bind(this, function(compareto, value) {
                                                                                var compare = parentScope.$eval(compareto);
                                                                                return compare===value;
                                                                            },attr(input,'compare'));

                                    messages.compare = attr(input,'compare-message') || 'Mismatched value';
                                }

                                angular.forEach(['custom','custom-submit','validator','async-validator','submit-validator','async-submit-validator'],function(validatorType) {

                                    if(attr(input,validatorType)===undefined) {
                                        return;
                                    }

                                    var scope = input.data('validator-scope') ? input.data('validator-scope') : parentScope;
                                    var validatorFunction = validatorFunction = attr(input,validatorType);
                                    messages[validatorType] = attr(input,'validator-message') || '';

                                    var func = input.attr(validatorType).replace(/\(.*/,'');
                                    if(input.scope()[func]) {
                                    	scope = input.scope();
                                    }

                                    //Legacy 'custom' namespace
                                    if(validatorType=='custom' || validatorType=='custom-submit') {

	                                    if(validatorType=='custom') {
	                                    	validatorType = 'validator';
	                                    }

	                                    if(validatorType=='custom-submit') {
	                                    	validatorType = 'async-submit-validator';
	                                    }

                                    	if(input.data('custom-scope')) {
                                    		scope =  input.data('custom-scope');
                                    	}

                                    	messages[validatorType] = attr(input,'custom-message') || '';
                                    }

                                    if(validatorType=='validator' || validatorType=='async-validator') {
                                        input.on('blur',function() {
                                            controller.$validate();
                                        });
                                    }

                                    if(validatorType=='async-validator' || validatorType=='async-submit-validator') {

	                                    controller.$asyncValidators[validatorType] = angular.bind(this,
	                                        function(input, element, form, validatorType, value, oldValue) {

	                                        	value = sanitizeValue(value,input);

	                                            return $q(function(resolve,reject) {

	                                                // Only process a submit validator when called from on('submit')
	                                                if(validatorType=='async-submit-validator' && !form.$submitting) {
	                                                    return resolve();
	                                                }

	                                                try {

		                                                evalValidator(validatorFunction,value)
	                                                    .then(function() {
	                                                        resolve();
	                                                    })
	                                                    .catch(function(message) {
	                                                        reject(message);
	                                                    });

	                                                } catch(e) {
	                                                	reject(e);
	                                                }

	                                            })
	                                            .catch(function(message) {
	                                            	updateMessage(message,attr(input,'name'),validatorType);
	                                            	return $q.reject(message);
	                                            });

	                                    },input, element, $scope.form, validatorType);

	                                } else if(validatorType=='validator' || validatorType=='submit-validator') {

	                                    controller.$validators[validatorType] = angular.bind(this,
	                                        function(input, element, form, validatorType, value, oldValue) {

	                                            value = sanitizeValue(value,input);

                                                // Only process a submit validator when called from on('submit')
                                                if(validatorType=='submit-validator' && !form.$submitting) {
                                                    return true;
                                                }

                                                try {

                                                	var result = evalValidator(validatorFunction,value);

	                                                if(angular.isFunction(result)) {
	                                                    result = result(value);
	                                                }

	                                                if(result===true) {
	                                                	return true;
	                                                }

	                                                throw result;

	                                            } catch(e) {
	                                            	updateMessage(e,attr(input,'name'),validatorType);
	                                            	return false;
	                                            }

	                                    },input, element, $scope.form, validatorType);
	                                }

	                                function evalValidator(func,value) {

	                                	var parts = func.match(/\(\)$/);
	                                	if(parts) {
	                                		func = func.replace('()','($value)');
	                                	} else if(func.match(/[^\)]+$/)) {
	                                		func += '($value)';
	                                	}

                                       	return scope.$eval(func,{ $value: value });
	                                }

                                    function updateMessage(message,name,validatorType) {
                                        if(message) {
                                            $timeout(function() {
                                               angular.element(element[0].querySelector('.messages[data-name="' + name + '"] .message[data-type="' + validatorType + '"]'))
                                                .text(message);
                                            });
                                        }
                                    }

                                    function sanitizeValue(value,input) {
                                    	if(attr(input,'type')=='num') {
                                            if(value===undefined) {
                                                value = null;
                                            }
                                        } else {
                                            if(value===undefined || value===null) {
                                                value = '';
                                            }
                                        }

                                        return value;
                                    }
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
                                    messages.required = angular.element(container).attr('required-message') || 'Required';
                                }

                                //Prevalidate the form. Avoid required $error.required = true
                                controller.$validate();

                                if(!fsUtil.isEmpty(messages))  {

                                    var msgs = angular.element('<div>')
                                    					.addClass('ng-hide messages')
														.attr('data-name',name)
														.attr('ng-show',"(form.$submitted || form['" + attr(input,'name') + "'].$touched) && form['" + attr(input,'name') + "'].$invalid");

                                    angular.forEach(messages,function(message,type) {
                                    	msgs.append(angular.element('<div>')
                                    					.addClass('ng-hide message')
                                    					.attr('data-type',type)
                                    					.attr('ng-show',"form['" + attr(input,'name') + "'].$error['" + type + "']")
                                    					.append(message));
                                    });

                                    angular.element(container).append(msgs);
                                    $compile(msgs)($scope);
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
    })
	.directive('fsValidateButtonContainer', function (fsValidate) {
        return {
            restrict: 'A',
            scope: {
                id: "@fsValidateButtonContainer"
            },
            link: {
                post: function($scope,element) {

                	setTimeout(function() {

	                	var instance = angular.element(document.querySelector('#' + $scope.id)).data('instance');
	                	if(instance) {
	                		angular.forEach(element[0].querySelectorAll('button'),function(button) {

	                			instance.registerButton(button);

	                        	button = angular.element(button);

	                        	if(button.attr('type')=='submit') {

		                			button.on('click',function() {
			                            fsValidate.submit($scope.id);
			                        });
			                    }
	                		});
	                	}
                    });
                }
            }
        };
    });
})();