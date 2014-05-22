'use strict';

/* TODO

1. Cache location (1st time?) - mainCtrl
2. Message sent, fix to be able to post more.
3. Add by ...

*********/
var serverAddress = 'https://ftn-13190.onmodulus.net';

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

app.service('locationService',
	function(){

		var coords = null;

		var options = {
		  enableHighAccuracy: true,
		  timeout: 5000,
		  maximumAge: 0
		};

		this.getLocation = function(callback, scope){

			function success(pos) {
				coords = pos.coords;

				console.log('Your current position is: [' + coords.longitude + ', ' + coords.latitude + ']');
				console.log('More or less ' + coords.accuracy + ' meters.');
				callback(coords);
			}

			function error(err){
				switch(err.code) {
				case err.PERMISSION_DENIED:
					scope.feedback ='Using geolocation is disabled on your device.';
					break;
				case err.POSITION_UNAVAILABLE:
					scope.feedback = 'Location information is unavailable.';
					break;
				case err.TIMEOUT:
					scope.feedback = 'The request to get user location timed out.';
					break;
				case err.UNKNOWN_ERROR:
					scope.feedback = 'An unknown error occurred.';
					break;
				}
				scope.$apply();
			}

			if(coords === null){
				navigator.geolocation.getCurrentPosition(success, error, options);
			} else {
				callback(coords);
			}
		};
	}
);

app.service('dataService', ['$http', 'locationService',
	function($http, locationService) {

		this.getData = function(callbackFunc, scope) {

			locationService.getLocation(function(loc){
				$http({
					method: 'POST',
					url: serverAddress + '/posts',
					data: {
						longitude: loc.longitude,
						latitude: loc.latitude
					}
				}).
				success(function(data){
					// With the data succesfully returned, call our callback
					callbackFunc(data, scope);
				}).
				error(function(){
					console.log('error');
				});

			}, scope);
		};
	}
]);

app.controller('PostsListController', ['$scope', '$interval', '$q', 'dataService',
	function($scope, $interval, $q, dataService){
		$scope.posts = null;
		$scope.feedback = 'Loading... (Please allow using GPS location on your device)';

		$scope.onReload = function(){
			console.warn('reloading');
		};

		dataService.getData(function(response){
			$scope.posts = response;
			$scope.feedback = '';
			calculateMeters();
			updateMoment();
			$interval(updateMoment, 60000, 0, false);
		}, $scope);

		function calculateMeters(){
			angular.forEach($scope.posts, function(post){
				var measuringUnit = 'm';
				if(post.distance > 1000){
					post.distance /= 1000;
					measuringUnit = 'km';
				}
				post.distance = Math.round(post.distance, 1) + ' ' + measuringUnit;
				
			});
		}

		function updateMoment(){
			angular.forEach($scope.posts, function(post){
				post.moment = moment(post.created_at).fromNow();
			});
		}

		$scope.getCloser = function(){
			console.log('fetching closer messages');
		};

		$scope.getFurther = function(){
			console.log('fetching more distant messages');
		};
	}
]);

app.controller('NewPostController', ['$scope', '$http', 'locationService',
	function($scope, $http, locationService){
		$scope.enabled = false;
		$scope.feedback = 'Waiting for location data...';
		$scope.loc = null;

		locationService.getLocation(function(loc){
			$scope.loc = loc;
			$scope.enabled = true;
			if(!$scope.$$phase){ //if angular digest not in progress
				$scope.$apply();
			}
		}, $scope);

		$scope.send = function(){
			$scope.feedback = 'Sending...';
			$scope.enabled = false;
			
			$http({
				method: 'POST',
				url: serverAddress + '/posts/new',
				data: {
					message: $scope.message,
					longitude: $scope.loc.longitude,
					latitude: $scope.loc.latitude
				}
			}).
			success(function(){//data pa proveriti sta je stvarno vratio server
				$scope.feedback = 'Message sent.';
				$scope.message = '';
			});

		};
	}
]);