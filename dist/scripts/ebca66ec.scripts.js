"use strict";var serverAddress="https://ftn-13190.onmodulus.net",geoLocationServiceAddress="https://maps.googleapis.com/maps/api/geocode/json?",POSTS_PER_PAGE=5,app=angular.module("geoLocationMessagingClientApp",["ngRoute"]);app.config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/posts.html",controller:"PostsListController"}).when("/map",{templateUrl:"views/map.html",controller:"MapsController"}).when("/new",{templateUrl:"views/new.html",controller:"NewPostController"}).when("/settings",{templateUrl:"views/settings.html",controller:""}).otherwise({redirectTo:"/"})}]),app.controller("mainCtrl",["$scope","$rootScope","$location","locationService",function(a,b,c,d){a.settings={sampleData:!1},a.route="posts",a.address="",d.getAddress(function(b){a.address="OK"===b.status?b.results[0].formatted_address:"Couldn't locate you."}),b.$on("$routeChangeSuccess",function(){a.route=c.path(),console.log(a.route)}),a.$on("LOAD_START",function(){a.loading=!0}),a.$on("LOAD_END",function(){a.loading=!1})}]),app.$inject=["$rootScope","$location"],app.service("locationService",["$http",function(a){var b=null,c={enableHighAccuracy:!0,timeout:3e4,maximumAge:0};this.getLocation=function(a,d){function e(c){b=c.coords,console.log("Your current position is: ["+b.longitude+", "+b.latitude+"]"),console.log("More or less "+b.accuracy+" meters."),a(b)}function f(a){switch(a.code){case a.PERMISSION_DENIED:d.feedback="Using geolocation is disabled on your device.";break;case a.POSITION_UNAVAILABLE:d.feedback="Location information is unavailable.";break;case a.TIMEOUT:d.feedback="The request to get user location timed out.";break;case a.UNKNOWN_ERROR:d.feedback="An unknown error occurred."}d.$apply()}navigator.geolocation.getCurrentPosition(e,f,c)},this.getAddress=function(b){this.getLocation(function(c){a({method:"GET",url:geoLocationServiceAddress+"latlng="+c.latitude+","+c.longitude+"&sensor=true"}).success(function(a){b(a)}).error(function(){console.log("error")})},this)}}]),app.service("dataService",["$http","locationService",function(a,b){this.getData=function(c,d){b.getLocation(function(b){a({method:"POST",url:serverAddress+"/posts",data:{longitude:b.longitude,latitude:b.latitude,page:d.page}}).success(function(a){c(a,d)}).error(function(){console.log("error")})},d)}}]),app.controller("PostsListController",["$scope","$interval","$q","dataService",function(a,b,c,d){function e(){a.$emit("LOAD_START"),d.getData(function(c){a.posts=c,a.feedback="",a.$emit("LOAD_END"),f(),g(),b(g,6e4,0,!1)},a)}function f(){angular.forEach(a.posts,function(a){var b="m";a.distance>1e3&&(a.distance/=1e3,b="km"),a.distance=Math.round(a.distance,1)+" "+b})}function g(){angular.forEach(a.posts,function(a){a.moment=moment(a.created_at).fromNow()})}a.posts=[],a.page=1,a.feedback="Loading... (Please make sure GPS is enabled on your device)",a.onReload=function(){console.warn("reloading")},e(),a.getCloser=function(){a.page>1&&(a.page--,e()),console.log("Page: ",a.page)},a.getFurther=function(){a.posts.length===POSTS_PER_PAGE&&(a.page++,e()),console.log("Page: ",a.page),console.log(a.posts)}}]),app.controller("NewPostController",["$scope","$http","locationService",function(a,b,c){a.enabled=!1,a.feedback="Waiting for location data...",a.loc=null,a.message="",c.getLocation(function(b){a.loc=b,a.enabled=!0,a.$$phase||a.$apply()},a),a.send=function(){return""===a.message?(a.feedback="Please enter message...",a.$$phase||a.$apply(),!1):(a.feedback="Sending...",a.enabled=!1,void b({method:"POST",url:serverAddress+"/posts/new",data:{message:a.message,longitude:a.loc.longitude,latitude:a.loc.latitude}}).success(function(){a.feedback="Message sent.",a.message=""}))}}]),app.controller("MapsController",["$scope",function(a){a.centerProperty={lat:45,lng:-73},a.zoomProperty=8,a.markersProperty=[{latitude:45,longitude:-74}],a.clickedLatitudeProperty=null,a.clickedLongitudeProperty=null}]);