(function () {
    'use strict';

    angular.module('app')
    .factory('dummyService', function (fsApi) {

        var categoryObject = {
                isNew: true,
                name: '',
                color: ''
            };

        var service = {
            instantiate:instantiate,
            setId:setId,
            gets:gets,
            get:get,
            put:put,
            post:post,
            'delete':deleted
        };

        return service;

        function instantiate() {
            return categoryObject;
        }

        function setId(id) {
            if(id) {
                categoryObject.id = id;
                categoryObject.isNew = false;
            }
            else {
                categoryObject.id = 0;
                categoryObject.isNew = true;
            }
        }

        function gets(data,options) {
            return fsApi.get('dummy', data, options);
        }

        function get(trade_category_id) {
            return fsApi.get('tradecategories/' + trade_category_id + '', {}, {key: 'trade_category'});
        }

        function put(data) {
            return fsApi.put('tradecategories/' + data.id + '', data, {key: 'trade_category'});
        }

        function post(data) {
            return fsApi.post('tradecategories', data, { key: 'trade_category' });
        }

        function deleted(trade_category_id) {
            return fsApi.delete('tradecategories/' + trade_category_id + '');
        }


    });
})();