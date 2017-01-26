'use strict';

angular
.module('app', [
    'config',
    'ui.router',
    'ngMaterial',
    'fs-angular-validate',
    'fs-angular-lister',
    'fs-angular-api',
    'fs-angular-phone',
    'fs-angular-time'
])
.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/404');
    $urlRouterProvider.when('', '/demo');
    $urlRouterProvider.when('/', '/demo');

    $stateProvider
    .state('demo', {
        url: '/demo',
        templateUrl: 'views/demo.html',
        controller: 'DemoCtrl'
    })

    .state('404', {
        templateUrl: 'views/404.html',
        controller: 'DemoCtrl'
    });

})
.run(function ($rootScope, BOWER) {
    $rootScope.app_name = BOWER.name;
});
