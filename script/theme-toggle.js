'use strict'
// The idea here is that the toggle button has three states: the first two are
// explicit preferences for light/dark themes (which way 'round they come
// depends on what the system theme setting is) and the last state is to simply
// track the system theme setting.
//
// FIXME: If the system theme setting changes during the first two states, then
//        the opportunity to set an explicit preference for the opposite state
//        may disappear.
var currentTheme = null
var mode = 0

window.userPrefersThemeListener(function(theme) {
	currentTheme = theme
	updateButtonLabel()
})

function updateButtonLabel() {
	var button = document.getElementById('toggle-theme')

	if (mode < 2) {
		if (!currentTheme || currentTheme === 'light') {
			button.innerText = 'Switch to dark theme'
		} else {
			button.innerText = 'Switch to light theme'
		}
	} else {
		button.innerText = 'Use system theme'
	}
}

document.getElementById('toggle-theme').onclick = function() {
	mode += 1

	if (mode > 2) {
		window.userPrefersThemeNeither()
		mode = 0
		updateButtonLabel()
	} else if (!currentTheme || currentTheme === 'light') {
		window.userPrefersTheme('dark')
	} else {
		window.userPrefersTheme('light')
	}
}

updateButtonLabel()
