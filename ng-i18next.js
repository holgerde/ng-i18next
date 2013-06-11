/*
 * AngularJS directive for using i18next (http://jamuhl.github.com/i18next)
 * Usage:
 *  - include i18next-1.x.x.js
 *  - include your language files
 *  - add 'i18n' to your dependencies of your module
 *    -> 'angular.module('MyApp', ['i18next']);'
 *  - anywhere in your code change $rootScope.i18nextOptions to your options.
 *    Best practise: in
 *    angular.module('MyApp', ['i18next']).run(function ($rootScope) {
 *        $rootScope.i18nextOptions = {
 *            lng: 'de-DE',
 *            ...
 *        };
 *    });
 *    (Because it will run before the directive is initialized)
 *  - use the 'ng-i18next' attribute on any element you want
 *    -> '<p ng-i18next="myStringToTranslate"></p>'
 *  - You can also listen for the 'i18nextInit' event. Then you can translate
 *    via i18n.t('Your String here');
 *    -> $scope.$on('i18nextInit', function () {
 *           console.log(i18n.t('hello'));
 *       });
 */
angular.module('i18next', []).directive('ngI18next', function ($rootScope) {

	'use strict';

	var
		/**
		 * This will be our translation function (see code below)
		 */
		t = null,
		/**
		 * Default options for i18next
		 * @type {Object}
		 */
		options = {},
		callbacks = [],
		translated = [];

	/**
	 * Translate the string given by the ng-i18next attribute and put it into the element as
	 * text or as an attribute.
	 * @param {DOMElement} element     Element with the ng-i18next attribute
	 * @param {String}     key         The string we want to translate
	 * @param {Boolean}    retranslate Whether it is the first time we translate the element or not
	 */
	function parse(element, key, retranslate) {

		/**
		 * Default attribute we'll put the translated string into
		 * (text means that it's the element's content)
		 * @type {String}
		 */
		var attr = 'text';

		if (!retranslate) {
			translated[translated.length] = function () {
				parse(element, key, true);
			};
		}

		if (t !== null) {
			/*
			 * Check if we want to translate an attribute
			 */
			if (key.indexOf('[') === 0) {
				var parts = key.split(']');
				key = parts[1];
				attr = parts[0].substr(1, parts[0].length - 1);
			}
			/*
			 * Cut of the ";" that might be at the end of the string
			 */
			if (key.indexOf(';') === key.length - 1) {
				key = key.substr(0, key.length - 2);
			}

			if (attr === 'html') {

				element.html(t(key));

			} else if (attr === 'text') {

				element.text(t(key));

			} else {

				element.attr(attr, t(key));

			}

		} else {
			/*
			 * We have to wait for i18next to initialize, so we
			 * add the string (and element) we want to translate
			 * to the callback array. It will get executed when
			 * i18next is ready.
			 */
			callbacks[callbacks.length] = function () {
				parse(element, key);
			};
		}

	}


	function localize(element, key) {

		if (key.indexOf(';') >= 0) {

			var keys = key.split(';');

			for (var i = 0; i < keys.length; i++) {
				if (keys[i] !== '') {
					parse(element, keys[i]);
				}
			}

		} else {
			parse(element, key);
		}

	}

	/**
	 * Initializes i18next
	 * @param {Boolean} reinitialization Have the options (in $rootScope) changed, so
	 *                                   we have to translate every string again?
	 */
	function init(reinitialization) {

		window.i18n.init(options, function (tFunction) {

			$rootScope.$broadcast('i18nextInit');
			$rootScope.i18nextLoaded = true;

			var i;

			t = tFunction;

			if (!reinitialization) {

				for (i = 0; i < callbacks.length; i++) {
					callbacks[i]();
				}

				callbacks = [];

			} else {

				for (i = 0; i < translated.length; i++) {
					translated[i]();
				}

			}

		});

	}

	$rootScope.$watch('i18nextOptions', function () {

		options = $rootScope.i18nextOptions || options;

		// Note: !! -> make i18nextOptions a boolean (true if it is defined)
		init(!!$rootScope.i18nextOptions);

	});

	return {

		// 'A': only as attribute
		restrict: 'A',

		link: function postLink(scope, element, attrs) {

			attrs.$observe('ngI18next', function (value) {

				if (!value) {
					// Well, seems that we don't have anything to translate...
					return;
				}

				localize(element, value);

			});

		}

	};

});
