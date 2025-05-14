'use strict'

// TODO: Don't disable tweak sheets?
function disableStyleSheets() {
	for (let i = 0; i < document.styleSheets.length; i++) {
		const styleSheet = document.styleSheets[i]
		styleSheet.disabled = true
	}
}

function makeNewStyleSheet() {
	const css =
		'body { '
		+ ' font-size: 1.5em; '
		+ ' font-family: Georgia, serif; '
		+ '}\n'
		+ '.slides { display: none; }'

	const style = document.createElement('style')
	style.appendChild(document.createTextNode(css))
	document.head.appendChild(style)
}

window.addEventListener('load', function() {
	window.setTimeout(function() {
		if (document.documentElement.hasAttribute('data-story-slides-is-running')) {
			console.debug('Story Slides: Legacy script not needed.')
		} else {
			alert('This browser is not supported by Story Slides.\n\n'

				+ 'Most formatting will be disabled, so that you can try '
				+ 'reading the content of the story.\n\n'

				+ "PLEASE NOTE: It won't necessarily look, and may not read, "
				+ 'as the author intended. Some important formatting or even '
				+ 'content may be missing, or errantly included.\n\n'

				+ "It's recommended that you try using a different browser.")

			disableStyleSheets()
			makeNewStyleSheet()
		}
	}, 500)
})
