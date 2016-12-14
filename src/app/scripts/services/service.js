(function () {
    'use strict';

	/**
     * @ngdoc service
     * @name fs.services:fsValidate
     */
     angular.module('fs-angular-validate')
    .factory('fsValidate', function() {

        return {
        	phone: phone,
        	email: email,
        	empty: empty
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
			var EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
			var valid = EMAIL_REGEXP.test(value);
			return empty(value) || !String(value).length || valid
        }

        function empty(value) {
            return value===undefined || value===null || value==="";
        }

    });

})();
