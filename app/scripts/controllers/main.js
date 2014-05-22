'use strict';

//to be used in future
//var serverAddress = 'http://192.168.1.2:3000';
var app = angular.module('geoLocationMessagingClientApp', ['ngRoute']);

app.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'views/posts.html',
				controller: 'PostsListController'
			}).
			when('/newPost', {
				templateUrl: 'views/newPost.html',
				controller: 'NewPostController'
			}).
			otherwise({
				redirectTo: '/'
			});
	}
]);

app.config(['$httpProvider', function($httpProvider) {
			$httpProvider.defaults.useXDomain = true;
			delete $httpProvider.defaults.headers.common['X-Requested-With'];
		}
]);