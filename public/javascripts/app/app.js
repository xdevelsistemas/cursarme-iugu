'use strict';
var lodash = angular.module('lodash', []);
lodash.factory('_', function() {
  return window._; // assumes underscore has already been loaded on the page
});
var app  = angular.module('xDukaBoletos',['ngResource','lodash', 'ngProgress','xDukaBoletos.directives','ngRoute','ui.utils.masks']);
app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
}
]);

$('.message .close').on('click', function() { $(this).parent().hide(); });

