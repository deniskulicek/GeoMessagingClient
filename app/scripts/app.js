/*global google:false */

'use strict';

/* TODO

1. Cache location (1st time?) - mainCtrl
2. Message sent, fix to be able to post more.
3. Add by ...

*********/

var serverAddress = 'https://ftn-13190.onmodulus.net'; // dev: 'http://localhost:3000';
var urlquery = ''; //based on useSampleData value

var geoLocationServiceAddress = 'https://maps.googleapis.com/maps/api/geocode/json?';
var POSTS_PER_PAGE = 5;

var app = angular.module('geoLocationMessagingClientApp', ['ngRoute', 'ngCookies', 'ui.map']);

app.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'views/posts.html',
				controller: 'PostsListController'
			}).
			when('/map', {
				templateUrl: 'views/map.html',
				controller: 'MapsController'
			}).
			when('/new', {
				templateUrl: 'views/new.html',
				controller: 'NewPostController'
			}).
			when('/settings', {
				templateUrl: 'views/settings.html',
				controller: 'SettingsController'
			}).
			otherwise({
				redirectTo: '/'
			});
	}
]);

app.controller('mainCtrl', ['$scope', '$rootScope', '$location', '$cookies', 'locationService',

	function($scope, $rootScope, $location, $cookies, locationService){

		//initial cookie settings (will keep settings for current session)
		if($cookies.username === undefined){
			$cookies.username = 'Anonymous'+Math.round(Math.random()*10000);
			$cookies.sampledata = false;
		}

		$scope.settings = {
			username: $cookies.username,
			sampleData: $cookies.sampledata === 'true'
		};

		$scope.changePostsPath = function(){
			if($scope.settings.sampleData === true){
				urlquery = '?sampleflag';
			} else {
				urlquery = '';
			}
		};

		$scope.changePostsPath();

		$scope.address = '';
		$scope.coords = null;

		locationService.getAddress(function(data, coords){
			if(data.status === 'OK'){
				$scope.address = data.results[0].formatted_address + ' (Accuracy: '+coords.accuracy+'m)';
			} else {
				$scope.address = 'Couldn\'t locate you.';
			}
		});

		$rootScope.$on('$routeChangeSuccess', function() {
			$scope.route = $location.path();
		});

		$scope.$on('LOAD_START', function(){
			$scope.loading = true;
		});

		$scope.$on('LOAD_END', function(){
			$scope.loading = false;
		});
	}

]);

app.$inject = ['$rootScope', '$location'];


app.service('locationService', ['$http',
	function($http){

		var coords = null;

		var options = {
		  enableHighAccuracy: true,
		  timeout: 30000, /* make it 30sec, GPS cannot find location quickly */
		  maximumAge: 0
		};

		this.getLocation = function(callback, scope){

			function success(pos) {
				coords = pos.coords;
				
				//console.log('Your current position is: [' + coords.longitude + ', ' + coords.latitude + ']' + ' Accuracy: '+coords.accuracy +' m');
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

			//always ping for new location (no cache for accuracy)
			navigator.geolocation.getCurrentPosition(success, error, options);

			/*
			if(coords === null){
				navigator.geolocation.getCurrentPosition(success, error, options);
			} else {
				callback(coords);
			}
			*/
		};

		this.getAddress = function(callback){

			this.getLocation(function(coords){

				$http({
					method: 'GET',
					url: geoLocationServiceAddress + 'latlng=' + coords.latitude + ',' + coords.longitude + '&sensor=true'
				}).
				success(function(data){
					callback(data, coords);
				}).
				error(function(){
					console.log('error');
				});

			}, this);
			
		};
	}
]);

app.service('dataService', ['$http', 'locationService',
	function($http, locationService) {

		this.getData = function(callbackFunc, scope) {

			locationService.getLocation(function(loc){
				$http({
					method: 'POST',
					url: serverAddress + '/posts' +urlquery,
					data: {
						longitude: loc.longitude,
						latitude: loc.latitude,
						page: scope.page
					}
				}).
				success(function(data){
					// With the data succesfully returned, call our callback
					callbackFunc(data, scope);
				}).
				error(function(){
					scope.$emit('ERROR', 'Error fetching data from server.');
				});

			}, scope);
		};
	}
]);

app.controller('PostsListController', ['$scope', '$interval', '$q', 'dataService',
	function($scope, $interval, $q, dataService){
		$scope.posts = [];
		$scope.page = 1;
		$scope.feedback = 'Loading... (Please make sure GPS is enabled on your device)';

		//TODO - pull to refresh
		$scope.onReload = function(){
			console.warn('reloading');
		};

		$scope.$on('ERROR', function(msg){
			console.log(msg);
		});

		function loadData(){
			$scope.$emit('LOAD_START');
			dataService.getData(function(response){
				$scope.posts = response;
				$scope.feedback = '';
				$scope.$emit('LOAD_END');
				calculateMeters();
				updateMoment();
				$interval(updateMoment, 60000, 0, false);
			}, $scope);
		}

		loadData();

		function calculateMeters(){
			angular.forEach($scope.posts, function(post){

				if(post.distance < 1000){
					post.distance = Math.round(post.distance) + ' m';
				} else {
					post.distance /= 10;
					post.distance = Math.round(post.distance) / 100 + ' km';
				}
				
			});
		}

		function updateMoment(){
			angular.forEach($scope.posts, function(post){
				post.moment = moment(post.created_at).fromNow();
			});
		}

		$scope.getCloser = function(){
			if($scope.page > 1){
				$scope.page--;
				loadData();
			}
			console.log('Page: ',$scope.page);
		};

		$scope.getFurther = function(){
			if($scope.posts.length === POSTS_PER_PAGE){
				$scope.page++;
				loadData();
			}
			console.log('Page: ',$scope.page);
			console.log($scope.posts);
		};
	}
]);

app.controller('NewPostController', ['$scope', '$http', 'locationService',
	function($scope, $http, locationService){
		$scope.enabled = false;
		$scope.feedback = 'Waiting for location data...';
		$scope.loc = null;
		$scope.message = '';

		locationService.getLocation(function(loc){
			$scope.loc = loc;
			$scope.coords = loc; //budzotina
			$scope.enabled = true;
			if(!$scope.$$phase){ //if angular digest not in progress
				$scope.$apply();
			}
		}, $scope);

		$scope.send = function(){
			if($scope.message === ''){
				$scope.feedback = 'Please enter message...';
				if(!$scope.$$phase){ //if angular digest not in progress
					$scope.$apply();
				}
				return false;
			}
			$scope.feedback = 'Sending...';
			$scope.enabled = false;
			
			$http({
				method: 'POST',
				url: serverAddress + '/posts/new',
				data: {
					message: $scope.message,
					longitude: $scope.loc.longitude,
					latitude: $scope.loc.latitude,
					device_id: $scope.settings.username
				}
			}).
			success(function(){//data pa proveriti sta je stvarno vratio server
				$scope.feedback = 'Message sent.';
				$scope.message = '';
			});

		};
	}
]);

app.controller('SettingsController', ['$scope', '$cookies', function($scope, $cookies){

	$scope.$watch('settings.username', function(){
		$cookies.username = $scope.settings.username;
	});

	$scope.$watch('settings.sampleData', function(){

		$cookies.sampledata = $scope.settings.sampleData;
		$scope.changePostsPath();
		
	});

}]);

app.controller('MapsController', ['$scope', '$http', 'locationService', function($scope, $http, locationService){

/*
	$scope.mapOptions = {
      center: new google.maps.LatLng(45.2530032, 19.8262524),
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
*/
	locationService.getLocation(function(coords){
		if($scope.myMap !== undefined){ //make sure map is loaded

			//set initial options
			$scope.myMap.setOptions({
				center: new google.maps.LatLng(coords.latitude, coords.longitude),
				zoom: 15,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});

			//add you are here marker
			var image = 'custom/marker-blue.png';
			$scope.you = new google.maps.Marker({
				position: new google.maps.LatLng(coords.latitude, coords.longitude),
				map: $scope.myMap,
				title: 'You are here!',
				animation: google.maps.Animation.DROP,
				icon: image
			});

			google.maps.event.addListener($scope.myMap, 'idle', function(){
				var ne = {
					long: $scope.myMap.getBounds().getNorthEast().lng(),
					lat: $scope.myMap.getBounds().getNorthEast().lat()
				};
				var sw = {
					long: $scope.myMap.getBounds().getSouthWest().lng(),
					lat: $scope.myMap.getBounds().getSouthWest().lat()
				};
				var nw = {
					long: sw.long,
					lat: ne.lat
				};
				var se = {
					long: ne.long,
					lat: sw.lat
				};

				$scope.getPointsWithin(ne,nw,sw,se);
			});
			
		}
	}, $scope);

	$scope.getPointsWithin = function(ne,nw,sw,se){

		$http({
			method: 'POST',
			url: serverAddress + '/posts/within' + urlquery,
			data: {
				points: [
					[
						[
							ne.long,
							ne.lat
						],
						[
							nw.long,
							ne.lat
						],
						[
							sw.long,
							sw.lat
						],
						[
							se.long,
							se.lat
						],
						[
							ne.long,
							ne.lat
						]
					]
				]
			}
		}).
		success(function(data){
			$scope.populateMap(data);
		}).
		error(function(){
			console.log('Couldn\'t  fetch data.');
		});

	};

	$scope.allMarkerKeys = [];

	$scope.populateMap = function(points) {
		
		var markers = [];
		var mcOptions = {gridSize: 50, maxZoom: 15};
		points.forEach(function(p){
			var latlng = new google.maps.LatLng(p.loc.coordinates[1], p.loc.coordinates[0]);
			
			if($scope.allMarkerKeys.indexOf(p._id) === -1){

				var by = (p.device_id !== undefined)?'<br>by '+p.device_id:'';
				var msg = p.message.replace(/(?:\r\n|\r|\n)/g, '<br />');

				var marker = new MarkerWithLabel({
					position: latlng,
					draggable: false,
					map: $scope.myMap,
					labelContent: msg + by,
					labelAnchor: new google.maps.Point(22,0),
					labelClass: 'label'
				});
				markers.push(marker);
				$scope.allMarkerKeys.push(p._id);
				//console.log('Dont have it adding:',p._id);
			} else {
				//console.log('XXXXXX',p._id);
			}

		});
		var cluster = new MarkerClusterer($scope.myMap, markers, mcOptions);

	};

}]);