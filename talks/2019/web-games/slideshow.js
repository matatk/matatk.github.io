'use strict';
/* global window document marked */
// TODO: Page doesn't seem to change when the back button is used.
// TODO: If visible-keyboard-help (or progress bar, or...?) aren't there, don't
//       bork :-).
// TODO: Story mode is for everyone because it includes the things that would
//       be said for each slide, so this needs to be made more discoverable.
// TODO: Unify visible and accessible keyboard help info in a pop-up dialog.
// TODO: Make the aria-descriptions of slide and story mode visible when
//       active, to help people who are using a screen-reader for reasons other
//       than vision impairment.
// TODO: How to announce progress? Provide a keyboard shortcut?
// TODO: Check out redirection (not sure it's working always)
// TODO: Support the ability to start in story mode?
// TODO: Support focusing a particular 'slide' in story mode, as in slides mode?
// TODO: Support returning to story mode after folloiwng a link and going back
//       to the slideshow page? How? LocalStorage or something?
(function(win, doc) {
	const slides = doc.getElementsByClassName('slide')
	let current = null
	let storyMode = false  // default is slides mode


	//
	// Utilities
	//

	function hasStrictDataBoolean(element, attrName) {
		return element.dataset[attrName] === ''
	}

	// Called to remove inline style properties that were added when gradually
	// revealing slide content, or switching display modes.
	function cleanProperty(element, propertyName) {
		element.style.removeProperty(propertyName)
		if (element.getAttribute('style') === '') {
			element.removeAttribute('style')
		}
	}


	//
	// Moving between slides
	//

	function previousSlideNumber() {
		return current > 0 ? current - 1 : slides.length - 1
	}

	function nextSlideNumber() {
		return (current + 1) % slides.length
	}

	function updateProgressBar() {
		// The author could've removed the progress section for giving the talk
		const progress = doc.querySelector('#progress > div')
		if (progress) {
			const percent = ((current + 1) / slides.length) * 100
			progress.style.width = `${Math.round(percent)}%`
		}
	}

	function updateLocation() {
		win.location = `#slide-${current + 1}`
	}

	function setActiveSlide(number) {
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i]
			if (i !== number) {
				slide.classList.remove('active')
			} else {
				slide.classList.add('active')
			}
		}
		current = number
		updateProgressBar()
		updateLocation()
	}

	// If there are steps on the slide that are to be gradually revealed (more
	// info on this at the bottom) then go through those steps before advancing
	// to the next slide. Returns true to say "go to next slide" or false
	// otherwise.
	function revealStepsOrNextSlide() {
		const slide = slides[current]
		if (slide.dataset.pauseSteps) {
			const totalSteps = Number(slide.dataset.pauseSteps)
			const currentStep = Number(slide.dataset.pauseCurrentStep)
			if (currentStep === totalSteps) {
				return true
			}
			const nextStep = currentStep + 1
			const nextStepElement =
				slide.querySelector(`[data-pause-step="${nextStep}"]`)
			cleanProperty(nextStepElement, 'visibility')
			slide.dataset.pauseCurrentStep = nextStep
			return false
		}
		return true
	}

	function moveToPreviousSlide() {
		setActiveSlide(previousSlideNumber())
	}

	function moveToNextRevealOrSlide() {
		if (revealStepsOrNextSlide()) {
			setActiveSlide(nextSlideNumber())
		}
	}


	//
	// Slides mode and story mode
	//

	function slideModeStartUp() {
		doc.addEventListener('keydown', keyHandler)

		doc.getElementById('mode-button').innerText = 'Switch to story mode'
		doc.getElementById('mode-button')
			.setAttribute('aria-describedby', 'story-mode-explainer')

		doc.body.setAttribute('role', 'application')
		// Note: no aria-label as screen-readers announce this on each slide
		doc.body.setAttribute('aria-describedby', 'screen-reader-intro')
		doc.body.setAttribute('tabindex', 0)

		viewSizing()

		win.addEventListener('resize', viewSizing)
	}

	function toggleDisplayMode() {
		if (storyMode) {
			storyModeOff()
		} else {
			if (doc.fullscreenElement) {
				doc.exitFullscreen()  // prevents aberrations (tested on Fx)
			}
			storyModeOn()
		}
	}

	function storyModeOn() {
		toggleStyleSheets()
		makePauseStepsVisible()
		disableInlineStyles()
		constrainImageSizesToViewport()
		toggleHelpInfo()

		doc.getElementById('previous').style.display = 'none'
		doc.getElementById('next').style.display = 'none'
		doc.getElementById('visible-keyboard-help').style.display = 'none'

		doc.removeEventListener('keydown', keyHandler)

		doc.getElementById('mode-button').innerText = 'Switch to slides mode'
		doc.getElementById('mode-button')
			.setAttribute('aria-describedby', 'slides-mode-explainer')

		doc.body.removeAttribute('role')
		doc.body.removeAttribute('aria-describedby')
		doc.body.removeAttribute('tabindex')

		win.removeEventListener('resize', viewSizing)

		storyMode = true
	}

	function storyModeOff() {
		toggleStyleSheets()
		restorePauseStepVisibilityState()
		restoreInlineStyles()
		unfetterImageSizes()
		toggleHelpInfo()

		cleanProperty(doc.getElementById('previous'), 'display')
		cleanProperty(doc.getElementById('next'), 'display')
		cleanProperty(doc.getElementById('visible-keyboard-help'), 'display')

		slideModeStartUp()

		storyMode = false
	}

	function toggleStyleSheets() {
		for (const sheet of doc.styleSheets) {
			sheet.disabled = !sheet.disabled
		}
	}

	// When moving to story mode, all pause steps should be visible, even if
	// they haven't yet been revealed in slides mode
	function makePauseStepsVisible() {
		for (const thing of doc.querySelectorAll('[data-pause-step]')) {
			if (thing.style.visibility === 'hidden') {
				cleanProperty(thing, 'visibility')
				thing.dataset.slidesModeHide = true
			}
		}
	}

	// When moving back to slides mode, the state of the pause steps'
	// visibility needs to be restored, so that steps that hadn't yet been made
	// visible are returned to being hidden.
	function restorePauseStepVisibilityState() {
		for (const thing of doc.querySelectorAll('[data-slides-mode-hide]')) {
			thing.style.visibility = 'hidden'
			thing.removeAttribute('data-slides-mode-hide')
		}
	}

	function disableInlineStyles() {
		for (const element of doc.querySelectorAll('[style]')) {
			element.dataset.originalStyle = element.getAttribute('style')
			element.removeAttribute('style')
		}
	}

	function restoreInlineStyles() {
		for (const element of doc.querySelectorAll('[data-original-style]')) {
			element.setAttribute('style', element.dataset.originalStyle)
			element.removeAttribute('data-original-style')
		}
	}

	function constrainImageSizesToViewport() {
		for (const image of doc.querySelectorAll('img')) {
			image.style.maxWidth = '100%'
			image.style.maxHeight = '100%'
		}
	}

	function unfetterImageSizes() {
		for (const image of doc.querySelectorAll('img')) {
			cleanProperty(image, 'max-width')
			cleanProperty(image, 'max-height')
		}
	}

	// The help info shouldn't appear in story mode
	function toggleHelpInfo() {
		const helpInfoIds = [
			'screen-reader-intro',
			'story-mode-explainer',
			'slides-mode-explainer']

		for (const id of helpInfoIds) {
			const element = doc.getElementById(id)
			const elementDisplayMode = element.style.display
			if (elementDisplayMode === 'none') {
				cleanProperty(element, 'display')
			} else {
				element.style.display = 'none'
			}
		}
	}


	//
	// Shortcut dispatch
	//

	function keyHandler(event) {
		if (event.isComposing || event.keyCode === 229) return

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				moveToPreviousSlide()
				break
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
			case 'Enter':
			case 'Return':
				moveToNextRevealOrSlide()
				// Note: not supporting the space key as it's echoed by
				// screen-readers.
				break
			case 'f':
				if (!doc.fullscreenElement) {
					doc.body.requestFullscreen()
				} else {
					doc.exitFullscreen()
				}
				break
			case 's':
				toggleDisplayMode()
		}
	}


	//
	// Moving a specific slide if the URL requires it
	//

	function reflectLocation() {
		if (win.location.hash) {
			const match = win.location.hash.match(/^#slide-(\d+)$/)
			if (match) {
				const desired = Number(match[1]) - 1
				if (desired < slides.length) {
					setActiveSlide(desired)
					return true
				}
				return false
			}
		}
		return false
	}


	//
	// Rendering Markdown within slides
	//

	// The 'markdown' custom attribute flags an element as containing markdown.
	// In order for it to appear correctly in the editor and not invalidate
	// the HTML, the markdown is placed within a commend within the container.

	function getMarkdownFromComment(element) {
		for (const child of element.childNodes) {
			if (child.nodeType === win.Node.COMMENT_NODE) {
				return child.textContent
			}
		}
	}

	function filterMarkdown(text) {
		const leadingSpace = text.match(/^\n(\s*)\S/)[1]
		const breakAndLeadingSpace = RegExp('\n(' + leadingSpace + ')', 'g')
		return text.replace(breakAndLeadingSpace, '\n').trim()
	}

	function renderMarkdown() {
		if (!win.marked) return  // TODO error indication?
		for (const container of doc.querySelectorAll('[data-markdown]')) {
			const markdown = filterMarkdown(getMarkdownFromComment(container))
			container.innerHTML = marked(markdown)
		}
	}


	//
	// Split slide layouts
	//

	// Each slide is a flexbox. The elements within can be shifted to the
	// top/middle/bottom of of the slide using CSS classes on the slides.
	//
	// If the author wants the vertical space in the slide split equally
	// between all children, they can specify an empty 'data-split' attribute.
	// If they want more control, they can give a list of percentages for the
	// sizes of the vertical sections.
	//
	// Split sections are given the CSS classes part-<number> and also
	// part-(even|odd) as appropriate.
	//
	// If the slide had a top/middle/bottom class, then the split parts will
	// recieve this too.
	//
	// Splitting only some of the content of a slide is supported.
	//
	// The DOM order of story mode content is preserved, so that it makes sense
	// when moving to story mode.
	//
	// Note: spliting of slides horizontally into columns is not supported yet.

	function doSplits() {
		const containers = doc.querySelectorAll('[data-split]')

		for (const container of containers) {
			const elements = Array.from(container.children)
			const numNonStoryElements = elements.filter(element => {
				return !element.classList.contains('story')
			}).length

			const percentages = hasStrictDataBoolean(container, 'split')
				? []
				: container.dataset.split.split(' ')

			if (percentages.length > 0) {
				checkPercentages(percentages, numNonStoryElements, container)
			}

			processSplitContainer(container, percentages, elements)
		}
	}

	function processSplitContainer(container, percentages, elements) {
		const promolgate = ['top', 'middle', 'bottom']
		let counter = 0

		for (const child of elements) {  // don't iterate over live collection
			if (!child.classList.contains('story')) {
				// Create a flexbox with author-requested height
				const splitCounter = counter + 1  // the first split part is odd
				const box = doc.createElement('div')
				box.classList.add(`part-${splitCounter}`)
				const parity = splitCounter % 2 ? 'odd' : 'even'
				box.classList.add('part-' + parity)
				box.appendChild(child)

				if (percentages.length > 0) {
					box.style.flexBasis = percentages[counter]
				}

				for (const property of promolgate) {
					if (container.classList.contains(property)) {
						box.classList.add(property)
					}
				}

				container.appendChild(box)
				counter++
			} else {
				// Story mode content is invisible in slides mode and mustn't
				// affect the layout, but the DOM order does need to be
				// preserved, so it makes sense in story mode.
				container.appendChild(child)
			}
		}
	}

	function checkPercentages(percentages, expectedLength, container) {
		if (percentages.length !== expectedLength) {
			win.console.error('Mismatched percentages for split container', container)
		}

		const sum = percentages.reduce((accumulator, currentValue) => {
			const number = Number(currentValue.slice(0, -1))
			return accumulator += number
		}, 0)

		if (sum !== 100) {
			win.console.error(`Percentages add up to ${sum} for split container`, container)
		}
	}


	//
	// Prepare slide pauses
	//

	// When the user wants things to be revealed gradually, they set the
	// 'data-pause' attribute on the parent of the things. This function goes
	// through and assigns each thing a step number, tots up the total number
	// of steps for the slide and renders each step hidden.
	//
	// When the user presses the 'next' key/button, the steps are gradually
	// revealed before moving to the next slide (handled above).
	//
	// We don't create a pause step for anything with a class of 'story'
	// becuase that is only visible in story mode.

	function preparePauses() {
		for (const slide of slides) {
			const pauseyThings = hasStrictDataBoolean(slide, 'pause')
				? [slide]  // if the slide itself has the attribute
				: slide.querySelectorAll('[data-pause]')
			let pauseStepCounter = 0

			for (const thing of pauseyThings) {
				for (const step of thing.children) {
					if (!step.classList.contains('story')) {
						pauseStepCounter++
						step.dataset.pauseStep = pauseStepCounter
						step.style.visibility = 'hidden'
					}
				}
			}

			if (pauseStepCounter > 0) {
				slide.dataset.pauseSteps = pauseStepCounter
				slide.dataset.pauseCurrentStep = 0
			}
		}
	}


	//
	// Respoinding to viewport size changes
	//

	// The author sets two CSS custom properties under the :root pseudo-class
	// to specify slide aspect ratio and font size, such as in the following
	// examples.
	//
	// --author-font-height-percent-of-slide: 8;
	// --author-aspect-ratio: calc(16 / 9);
	//
	// It is not possible to use CSS custom properties in media queries, so we
	// need to run some code to work out the dimensions of the slides.
	//
	// Based on those dimentions, the base font size is set accordingly too.

	// Thanks https://davidwalsh.name/css-variables-javascript :-)
	function viewSizing() {
		const viewWidth = doc.documentElement.clientWidth
		const viewHeight = doc.documentElement.clientHeight
		const viewAspect = viewWidth / viewHeight
		const slideAspectRaw = win.getComputedStyle(doc.documentElement)
			.getPropertyValue('--author-aspect-ratio')
		const matches = slideAspectRaw.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/)
		const slideAspect = matches[1] / matches[2]

		let slideHeight = null
		let slideWidth = null

		if (viewAspect >= slideAspect) {
			// View is wider than slide
			// Slide height should be 100vh
			slideHeight = viewHeight
			slideWidth = viewHeight * slideAspect
		} else {
			// View is narrower than slide
			// slide width should be 100vw
			slideWidth = viewWidth
			slideHeight = viewWidth / slideAspect
		}

		doc.documentElement.style
			.setProperty('--computed-slide-height', slideHeight + 'px')
		doc.documentElement.style
			.setProperty('--computed-slide-width', slideWidth + 'px')

		const rootFontSizePercent = win.getComputedStyle(doc.documentElement)
			.getPropertyValue('--author-font-height-percent-of-slide')
		const realRootFontSize = slideHeight * (rootFontSizePercent / 100)
		doc.documentElement.style
			.setProperty('--computed-base-font-size', realRootFontSize + 'px')
	}


	//
	// Start-up
	//

	doc.getElementById('browser-support-note').remove()

	renderMarkdown()
	doSplits()
	preparePauses()
	if (!reflectLocation()) {
		setActiveSlide(0)
	}
	slideModeStartUp()  // make body focusable, application; handle keys, resize

	doc.getElementById('previous').onclick = moveToPreviousSlide
	doc.getElementById('next').onclick = moveToNextRevealOrSlide
	doc.getElementById('mode-button').onclick = toggleDisplayMode
})(window, document)
