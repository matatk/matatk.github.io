'use strict';
/* global marked screenfull */
// FIXME: white thing on startup is the ".storyslides-ui:first-of-type" in the
//		  story mode CSS - can we includ a CSS link but disable it?
// FIXME: with iOS VO, the dialogs don't get focus when opening
//
// TODO: can't press story mode button successfully in Firefox
// TODO: need both mobile menu and mobile menu buttons to have explicit CSS
//       z-index rule in Chrome
// TODO: max-width of dialog is same as width (even with cmd+/-) doesn't do
//       minimum
// TODO: Can we only check if a slide is overflowing when it's visible?
// TODO: where should I add a global keydown listener - doc/window?
// TODO: Look for things that can be done via CSS like the IE notice.
// TODO: possible FOUCs - refer to TODOs below
//
// TODO: IE: fullscreen (promises)
// TODO: How to announce progress? Provide a keyboard shortcut?
// TODO: slide locked indication accessible to screen reader users - focusing
//       the body overrides it?
(function(win, doc) {
	const slides = Array.from(doc.getElementsByClassName('slide'))
	let currentIndex = null

	const storageKeyMode = win.location.pathname + '.mode'
	const storageKeyIntroShown = win.location.pathname + '.slides-intro-shown'

	const elId = (id) => doc.getElementById(id)  // TODO move somehow?
	const nonDialogContent = elId('storyslides-main-content')
	const dialogIntro = elId('storyslides-dialog-intro')
	const dialogKeys = elId('storyslides-dialog-keys')
	let openDialog = null

	let storyModeScrollTimeout = null
	let scrollCameFromMe = false
	let hashChangeCameFromMe = false


	//
	// Utilities
	//

	// TODO bind to where it was called from?
	const warn = (...args) => win.console.warn('StorySlides:', ...args)
	const error = (...args) => win.console.error('StorySlides:', ...args)
	const debug = (...args) => win.console.debug('StorySlides:', ...args)

	function hasStrictDataBoolean(element, attrName) {
		return element.dataset[attrName] === ''
	}

	function validateMode(mode) {
		if (mode === 'slides' || mode === 'story') return mode
		throw new Error(`Mode '${mode}' isn't valid`)
	}


	//
	// Code for both slides mode and story mode
	//

	function getStoredMode() {
		const saved = win.sessionStorage.getItem(storageKeyMode)
		if (saved !== null) validateMode(saved)
		return saved
	}

	function storeMode(mode) {
		win.sessionStorage.setItem(storageKeyMode, validateMode(mode))
	}

	function updateLocation() {
		win.location.hash = `#slide-${currentIndex + 1}`
		// Doesn't fire a hashchange event if asked to re-set the same hash.
	}

	// This is here because we need to track it across modes.
	function updateProgressBar() {
		// The author could've removed the progress section, e.g. for giving
		// the talk.
		const progress = doc.querySelector('#storyslides-progress > div')
		if (progress) {
			const percent = ((currentIndex + 1) / slides.length) * 100
			progress.style.width = `${Math.round(percent)}%`
		}
	}

	function isOverflowing(element) {
		const horizontalOverflow = element.scrollWidth - element.clientWidth
		const verticalOverflow = element.scrollHeight - element.clientHeight
		if (horizontalOverflow > 0 || verticalOverflow > 0) {
			return {
				'horizontal': horizontalOverflow > 0 ? horizontalOverflow : 0,
				'vertical': verticalOverflow > 0 ? verticalOverflow : 0,
			}
		}
		return null
	}

	function setActiveSlide(index, triggeredByURL, triggeredByStoryModeScroll) {
		if (index < 0 || index > (slides.length - 1)) {
			error(`Slide index ${index} is out of bounds.`)
			return
		}

		// Scrolling in story mode can update the current slide
		if (currentIndex !== null) {
			slides[currentIndex].classList.remove('active')
		}
		slides[index].classList.add('active')

		// The 'first-slide' class enables showing hints through CSS only
		// (nice). The user could change slides via story mode, though.
		if (index === 0) {
			doc.body.classList.add('first-slide')
		} else if (currentIndex === 0) {
			doc.body.classList.remove('first-slide')
		}

		switch (getStoredMode()) {
			case 'slides': {
				const overflow = isOverflowing(slides[index])
				if (overflow) {
					win.alert(`Slide ${index + 1} is overflowing by; ${JSON.stringify(overflow, null, 2)}`)
					error('Slide is overflowing:', slides[index], 'by:', overflow)
				}
			}
				break  // TODO does this need to be outside of the block?
			case 'story':
				// Don't scroll to the start of the first slide, so that the
				// mode button is more visible.
				//
				// For any other slide, when we scroll to it, the start of it
				// will be underneath the top bar (where the mode button is),
				// so we will need to correct for this by shifting the page
				// down a bit.
				if (!triggeredByStoryModeScroll && index > 0) {
					scrollCameFromMe = true
					slides[index].setAttribute('tabindex', -1)
					slides[index].focus()
					slides[index].removeAttribute('tabindex')
					slides[index].scrollIntoView(true)
					const top = slides[index].getBoundingClientRect().top
					const eightth = window.innerHeight / 8
					if (top < eightth) {  // slides at end probably won't be
						win.scrollBy(0, -eightth)
					}
				}
		}

		currentIndex = index
		updateProgressBar()
		if (!triggeredByURL) hashChangeCameFromMe = true  // already reflected
		updateLocation()
	}

	function reflectLocationFromURL() {
		if (!hashChangeCameFromMe) {
			if (win.location.hash) {
				const match = win.location.hash.match(/^#slide-(\d+)$/)
				if (match) {
					const desired = Number(match[1]) - 1
					if (desired > -1 && desired < slides.length) {
						setActiveSlide(desired, true, null)
						return
					}
				}
			}
			setActiveSlide(0, false, null)
		} else {
			hashChangeCameFromMe = false
		}
	}

	function switchToMode(mode, startup) {
		if (!startup && getStoredMode() === mode) {
			error(`Already in ${mode} mode; not switching.`)
			return
		}

		if (screenfull.enabled) {
			screenfull.exit()  // prevents aberrations in Firefox and iOS Safari
		}

		// TODO: must check for mobile menu here, can't just check in
		// keybeindings as it could've been clicked. Should we move *all*
		// checks like for open dialogs here?
		toggleOrDismissMobileMenu(true)

		switch (mode) {
			case 'story':
				goModeStory()
				break
			case 'slides':
			case null:
				goModeSlides()
		}

		reflectLocationFromURL()
	}

	// The following are called by the go-mode functions

	function toggleStyleSheetsForMode(mode) {
		validateMode(mode)
		const oppositeMode = mode === 'slides' ? 'story' : 'slides'
		for (const styleSheet of doc.styleSheets) {
			if (styleSheet.href) {
				if (styleSheet.href.includes(`mode-${mode}`)) {
					styleSheet.disabled = false
				}
				if (styleSheet.href.includes(`mode-${oppositeMode}`)) {
					styleSheet.disabled = true
				}
			}
		}
	}

	function disableInlineStyles() {  // slides to story mode
		for (const element of doc.querySelectorAll('[style]')) {
			if (element.id && element.id.startsWith('dialog-')) continue
			element.dataset.originalStyle = element.getAttribute('style')
			element.removeAttribute('style')
		}
	}

	function restoreInlineStyles() {  // story to slides mode
		for (const element of doc.querySelectorAll('[data-original-style]')) {
			element.setAttribute('style', element.dataset.originalStyle)
			element.removeAttribute('data-original-style')
		}
	}

	function neutraliseBody() {
		doc.body.removeAttribute('role')
		doc.body.removeAttribute('aria-describedby')
		doc.body.removeAttribute('tabindex')
	}

	function applicationifyBody() {
		doc.body.setAttribute('role', 'application')
		// Note: no aria-label as screen-readers announce this on each slide
		doc.body.setAttribute('aria-describedby', 'storyslides-screenreader-intro')
		doc.body.setAttribute('tabindex', 0)
	}

	function toggleOrDismissMobileMenu(dismiss) {
		const toggle = elId('storyslides-mobile-menu-toggle')
		if (dismiss) {
			toggle.setAttribute('aria-expanded', 'false')
		} else {
			toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'false' ? 'true' : 'false')
		}
		elId('storyslides-mobile-menu-content').classList.toggle('mobile-none', dismiss)
	}


	//
	// Slides mode
	//

	function goModeSlides() {
		toggleStyleSheetsForMode('slides')
		restoreInlineStyles()

		doc.removeEventListener('keydown', keyHandlerModeStory)
		doc.addEventListener('keydown', keyHandlerModeSlides)
		doc.removeEventListener('scroll', scrollHandlerStoryMode)

		elId('storyslides-slides-container').setAttribute('aria-live', 'polite')

		elId('storyslides-button-mode-toggle').innerText = 'Switch to story mode'
		elId('storyslides-button-mode-toggle')
			.setAttribute('aria-describedby', 'storyslides-mode-story-explainer')
		elId('storyslides-button-mode-toggle').onclick = () => switchToMode('story')

		applicationifyBody()

		viewSizing()
		win.addEventListener('resize', viewSizing)
		storeMode('slides')

		if (!win.sessionStorage.getItem(storageKeyIntroShown)) {
			showOrToggleDialog(dialogIntro)
			win.sessionStorage.setItem(storageKeyIntroShown, true)
		}
	}

	function hideOpenDialog() {
		if (openDialog) {
			const previousOpenDialog = openDialog
			hideDialog(openDialog)
			return previousOpenDialog
		}
	}

	function showOrToggleDialog(dialog) {
		const showTheDialog = hideOpenDialog() !== dialog
		if (showTheDialog && dialog.style.display) {
			dialog.removeAttribute('style')
			nonDialogContent.setAttribute('inert', '')  // sets aria-hidden
			neutraliseBody()
			dialog.focus()
			openDialog = dialog
		}
	}

	// TODO simplify
	function hideDialog(dialog) {
		if (!openDialog) {
			error('no open dialog')
			return
		}
		if (openDialog !== dialog) {
			error(`trying to hide "${dialog.id}" but "${openDialog.id}" is open`)
			return
		}
		if (!dialog.style.display) {
			dialog.style.display = 'none'
			nonDialogContent.removeAttribute('inert')
			applicationifyBody()
			doc.body.focus()
			openDialog = null
		}
	}

	function previousSlideNumber() {
		return currentIndex > 0 ? currentIndex - 1 : slides.length - 1
	}

	function nextSlideNumber() {
		return (currentIndex + 1) % slides.length
	}

	// If there are steps on the slide that are to be gradually revealed (more
	// info on this at the bottom) then go through those steps before advancing
	// to the next slide. Returns true to say "go to next slide" or false
	// otherwise.
	function revealStepsOrNextSlide() {
		const nextHiddenThing = slides[currentIndex].querySelector('[data-storyslides-step]')
		if (nextHiddenThing) {
			nextHiddenThing.removeAttribute('data-storyslides-step')
			return false
		}
		return true
	}

	function moveToPreviousSlide() {
		setActiveSlide(previousSlideNumber(), false, null)
	}

	function moveToNextRevealOrSlide() {
		if (revealStepsOrNextSlide()) {
			setActiveSlide(nextSlideNumber(), false, null)
		}
	}

	function toggleSlideLock() {
		if (!doc.body.classList.contains('storyslides-slide-locked')) {
			// Note: most .storyslides-ui stuff is removed via CSS
			hideOpenDialog()
			neutraliseBody()
			doc.body.classList.add('storyslides-slide-locked')
		} else {
			applicationifyBody()
			doc.body.classList.remove('storyslides-slide-locked')
		}
		doc.body.focus()  // FIXME firefox doesn't like this
	}

	function toggleFullscreen() {
		if (screenfull.enabled) {
			screenfull.toggle()
		} else {
			win.alert('fullscreen mode is not available')
		}
	}

	function notLocked() {
		return !doc.body.classList.contains('storyslides-slide-locked')
	}

	// There seem to be problems re-adding a document keydown handler when a
	// screen-reader is running: the handler is often not registered, so
	// virtual cursor navigation continues. Therefore we check here for whether
	// we should ignore certain keys due to lock mode here, and also handle
	// closing dialogs here too.
	function keyHandlerModeSlides(event) {
		if (event.isComposing || event.keyCode === 229) return
		if (event.ctrlKey || event.metaKey) return  // un-bork locking

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				if (notLocked() && !openDialog) moveToPreviousSlide()
				break
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
				if (notLocked() && !openDialog) moveToNextRevealOrSlide()
				// Note: not supporting the space key as it's echoed by
				// screen-readers.
				break
			case 'f':
				if (notLocked()) toggleFullscreen()
				break
			case 's':
				if (notLocked()) {
					if (openDialog) hideDialog(openDialog)
					switchToMode('story')
				}
				break
			case '?':
				if (notLocked()) {
					showOrToggleDialog(dialogKeys)
				}
				break
			case 'i':
				if (notLocked()) {
					showOrToggleDialog(dialogIntro)
				}
				break
			case 'l':
				if (notLocked()) {
					toggleSlideLock()
				}
				break
			case 'Escape':
				if (!notLocked()) {
					toggleSlideLock()
				} else if (openDialog) {
					hideDialog(openDialog)  // TODO just use hideopendialog?
				}
		}
	}


	//
	// Story mode
	//

	function goModeStory() {
		toggleStyleSheetsForMode('story')
		disableInlineStyles()

		doc.removeEventListener('keydown', keyHandlerModeSlides)
		doc.addEventListener('keydown', keyHandlerModeStory)
		doc.addEventListener('scroll', scrollHandlerStoryMode)

		elId('storyslides-slides-container').removeAttribute('aria-live')

		elId('storyslides-button-mode-toggle').innerText = 'Switch to slides mode'
		elId('storyslides-button-mode-toggle')
			.setAttribute('aria-describedby', 'storyslides-mode-slides-explainer')
		elId('storyslides-button-mode-toggle').onclick = () => switchToMode('slides')

		neutraliseBody()

		win.removeEventListener('resize', viewSizing)
		storeMode('story')
	}

	function keyHandlerModeStory(event) {
		if (event.isComposing || event.keyCode === 229) return
		if (event.key === 'Escape') switchToMode('slides')
	}

	function findParentSlideIndex(element) {
		let next = element
		while (!slides.includes(next)) {
			next = next.parentElement
		}
		return slides.indexOf(next)
	}

	function realStoryModeScrollHandler() {
		if (!scrollCameFromMe) {
			const current = doc.elementFromPoint(
				win.innerWidth / 2, win.innerHeight / 3)
			setActiveSlide(findParentSlideIndex(current), false, true)
		} else {
			scrollCameFromMe = false
		}
	}

	function scrollHandlerStoryMode(event) {
		clearTimeout(storyModeScrollTimeout)
		storyModeScrollTimeout = setTimeout(
			() => realStoryModeScrollHandler(event), 250)
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

	function doSplits() {
		const containers = doc.querySelectorAll('[data-split]')
		let percentagesOk = true

		for (const container of containers) {
			const elements = Array.from(container.children)
			const numNonStoryElements = elements.filter(element => {
				return !element.classList.contains('story')
			}).length

			const percentages = hasStrictDataBoolean(container, 'split')
				? []
				: container.dataset.split.split(' ')

			if (percentages.length > 0) {
				const check = checkPercentages(
					percentages, numNonStoryElements, container)
				if (!check) percentagesOk = false
			}

			processSplitContainer(container, percentages, elements)
		}

		return percentagesOk
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
			error('Mismatched percentages for split container:', container)
		}

		const sum = percentages.reduce((accumulator, currentValue) => {
			const number = Number(currentValue.slice(0, -1))
			return accumulator += number
		}, 0)

		if (sum !== 100) {
			error(`Percentages add up to ${sum} for split container:`, container)
		}
	}


	//
	// Prepare slide pauses
	//

	// When the user wants things to be revealed gradually, they set the
	// 'data-pause' attribute on the parent of the things. This function goes
	// through and sets a custom attribute on the things. The CSS ensures that
	// they're taken into consideration when computing the layout.
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

			for (const thing of pauseyThings) {
				for (const step of thing.children) {
					if (!step.classList.contains('story')) {
						step.setAttribute('data-storyslides-step', '')
					}
				}
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

		// On mobile browsers, these can change quite a bit, as browser UI
		// appears and disappears.
		const verticalMargin = (win.innerHeight - slideHeight) / 2
		const horizontalMargin = (win.innerWidth - slideWidth) / 2

		doc.documentElement.style.setProperty(
			'--computed-vertical-margin', (verticalMargin > 0 ? verticalMargin : 0) + 'px')
		doc.documentElement.style.setProperty(
			'--computed-horizontal-margin', (horizontalMargin > 0 ? horizontalMargin : 0) + 'px')

		// We also work out the user's chosen base font size
		const rootFontSizePercent = win.getComputedStyle(doc.documentElement)
			.getPropertyValue('--author-font-height-percent-of-slide')
		const realRootFontSize = slideHeight * (rootFontSizePercent / 100)
		doc.documentElement.style
			.setProperty('--computed-base-font-size', realRootFontSize + 'px')
	}


	//
	// Linting
	//

	// Note: checking for overflowing slide content is done when a slide is
	// shown, as it requires the layout to be known. Therefore that check is
	// done above.

	function checkForDuplicateIds() {
		const elementsWithId = Array.from(doc.querySelectorAll('[id]'))
		const elementIds = elementsWithId.map(element => element.id)
		for (const [index, id] of elementIds.entries()) {
			const firstIndexOfId = elementIds.indexOf(id)
			if (firstIndexOfId !== index) {
				error(`Duplicate occurence of id "${id}":`, elementsWithId[index], 'First occurence was:', elementsWithId[firstIndexOfId])
				return false
			}
		}
		return true
	}

	function checkForElements() {
		let result = true

		const idsToCheck = Object.freeze({
			'storyslides-main-content': error,
			'storyslides-mobile-menu-toggle': error,
			'storyslides-mobile-menu-content': error,
			'storyslides-button-mode-toggle': error,
			'storyslides-button-fullscreen': error,
			'storyslides-button-help-intro': error,
			'storyslides-button-help-keys': error,
			'storyslides-mode-story-explainer': error,
			'storyslides-mode-slides-explainer-container': error,
			'storyslides-mode-slides-explainer': error,
			'storyslides-button-previous': error,
			'storyslides-button-next': error,
			'storyslides-slides-container': error,
			'storyslides-progress': warn,  // user may remove when giving talk
			'storyslides-help-info': error,
			'storyslides-screenreader-intro': error,
			'storyslides-lock-indicator': error,
			'storyslides-dialog-intro': error,
			'storyslides-dialog-intro-title': error,
			'storyslides-dialog-keys': error,
			'storyslides-dialog-keys-title': error,
		})

		for (const id in idsToCheck) {
			const element = elId(id)
			if (!element) {
				idsToCheck[id](`missing element with id "${id}"`)
				result = false
			}
		}

		return result
	}

	function checkSlideContainment() {
		const container = elId('storyslides-slides-container')
		const message = "The number of children of the slides container isn't the same as the number of slides. This could be due to putting story mode content outside of slides, having some slides outside of the slides contianer, or having other non-slide elements inside the container."

		if (slides.length !== container.children.length) {
			win.alert(message)
			error(message)
			return false
		}

		return true
	}


	//
	// Start-up
	//

	function main() {
		debug('starting up')
		win.history.scrollRestoration = 'manual'  // un-bork story mode

		const results = [
			checkForDuplicateIds(),
			checkForElements(),
			checkSlideContainment(),
			doSplits()
		]

		if (!results.every(Boolean)) {
			elId('loading').innerText = 'Error (check console)'
			return
		}

		// These can't produce errors (except if the markdown lib's borked)
		renderMarkdown()
		preparePauses()

		elId('loading').remove()

		// Fullscreen API isn't supported on iPhone
		if (screenfull.enabled) {
			elId('storyslides-button-fullscreen').onclick = toggleFullscreen
		} else {
			elId('storyslides-button-fullscreen').remove()
		}

		elId('storyslides-button-help-intro').onclick = function() {
			showOrToggleDialog(dialogIntro)
		}
		elId('storyslides-button-help-keys').onclick = function() {
			showOrToggleDialog(dialogKeys)
		}

		elId('storyslides-button-previous').onclick = moveToPreviousSlide
		elId('storyslides-button-next').onclick = moveToNextRevealOrSlide

		for (const dialog of [dialogIntro, dialogKeys]) {
			// Already marked as display: none; in the HTML to avoid FOUC
			dialog.querySelector('button.close').onclick = function() {
				hideDialog(this.parentNode)
			}
		}

		switchToMode(getStoredMode(), true)  // skip check for same mode
		win.addEventListener('hashchange', reflectLocationFromURL)

		elId('storyslides-mobile-menu-toggle').onclick = function() {
			// We don't call this directly as it'll take the event parameter to
			// mean we must dismiss the menu
			toggleOrDismissMobileMenu()
		}

		elId('storyslides-main-content').classList.remove('loading')
		debug('started')
	}

	// Depending on 'net connection and mobile device, this may take some time...
	win.addEventListener('load', main)
})(window, document)
