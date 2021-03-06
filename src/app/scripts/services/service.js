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
        	email: email,
        	submit: submit
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
			return !!fsUtil.string(value).match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        }

    	function submit(id) {
            var el = angular.element(document.querySelector('#' + id));

            if(el.length) {
	            var button = angular.element('<button>')
	                            .attr('type','submit')
	                            .css('visibility','hidden')
	                            .css('display','none');

	            el.attr('action','javascript:;').append(button);

	            setTimeout(function() {
					button[0].click();
	            	button.remove();
	            });
            }
    	}
    });

})();
