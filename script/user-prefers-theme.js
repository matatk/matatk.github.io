'use strict';
(function(win) {
	var VALID_THEMES = Object.freeze(['light', 'dark'])
	var USER_PREFERS_THEME = 'user-prefers-theme'
	var CLASS_PREFIX = USER_PREFERS_THEME + '-'
	var QUERY = '(prefers-color-scheme: dark)'  // light if user has no pref.
	var _query = matchMedia(QUERY)
	var _registeringCallback = false
	var _callback = null
	var _theme = null


	//
	// Utilities
	//

	function setClass(theme) {
		win.document.body.classList.add(CLASS_PREFIX + theme)
	}

	function removeClass(theme) {
		win.document.body.classList.remove(CLASS_PREFIX + theme)
	}

	function includes(array, value) {
		return array.indexOf(value) > -1
	}

	function validate(theme) {
		if (!includes(VALID_THEMES, theme)) {
			throw new Error('Invalid theme "' + theme + '"')
		}
		return theme
	}


	//
	// Deciding which setting to reflect, and then reflecting it
	//

	function dispatch() {
		if (userHasPreference()) {
			switchToTheme(getUserPreference())
		} else {
			setUpSystemHandling()
		}
	}

	function switchToTheme(newTheme) {
		// Note: validation is done in the storage get/set code. The only other
		//       function calling this is systemThemeHandler() below, and that
		//       only uses valid values.
		if (_theme) removeClass(_theme)
		setClass(newTheme)
		if (!_registeringCallback && newTheme === _theme) {
			return
		}
		if (_callback) _callback(newTheme)
		_theme = newTheme
	}


	//
	// Reflecting the system theme setting
	//

	function setUpSystemHandling() {
		systemThemeHandler()
		_query.addListener(systemThemeHandler)
		// Newer: _query.addEventListener('change', systemThemeHandler)
	}

	function systemThemeHandler() {
		var newTheme = _query.matches ? 'dark' : 'light'
		switchToTheme(newTheme)
	}


	//
	// Reflecting direct user preference
	//

	function userHasPreference() {
		if (localStorage.getItem(USER_PREFERS_THEME) === null) {
			return false
		}
		return true
	}

	function getUserPreference() {
		return validate(localStorage.getItem(USER_PREFERS_THEME))
	}

	function setUserPreference(newTheme) {
		localStorage.setItem(USER_PREFERS_THEME, validate(newTheme))
	}


	//
	// Public API
	//

	dispatch()  // start managing the class on <body>

	win.userPrefersThemeListener = function(clientCallback) {
		if (typeof clientCallback !== 'function') {
			throw new Error('Callback given is not a function.')
		}
		_registeringCallback = true
		_callback = clientCallback
		dispatch()
		_registeringCallback = false
	}

	win.userPrefersTheme = function(newTheme) {
		setUserPreference(newTheme)  // validates the input
		switchToTheme(newTheme)

		// We no longer listen to the media query (if we were)
		_query.removeListener(systemThemeHandler)
		// Newer: _query.removeEventListener('change', systemThemeHandler)
	}

	win.userPrefersThemeNeither = function() {
		localStorage.removeItem(USER_PREFERS_THEME)
		setUpSystemHandling()
	}
})(window)
