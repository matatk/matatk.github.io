'use strict';
/* global marked screenfull */
// Screen reader stuff...
//
//  TODO: Make Loading... an alert? Or aria-busy?
//  TODO: With Firefox + JAWS, booting straight into a slide (e.g. when
//        restoring tabs) in slides mode doesn't set application mode, but it
//        does read the slide contents. Going via the intro works. On Chrome,
//        booting directly into a slide does work, but I don't hear the
//        application mode entry noise.
//  TODO: Vary rarely, JAWS will flip up to the top of story mode, read a bit
//        and then go back down to the bit that was foucused.
//  TODO: Support identifying the curent slide by which has the focus, rather
//        than just visual scrolling?
//
// Mobile stuff...
//
// FIXME: with iOS VO, the dialogs don't get focus when opening
// FIXME: table too wide on iPhone
//  TODO: need both mobile menu and mobile menu buttons to have explicit CSS
//        z-index rule in Chrome (they don't inherit)
//  TODO: Can we only check if a slide is overflowing when it's visible?
//  TODO: where should I add a global keydown listener - doc/window?
//
// General stuff...
//
// FIXME: can't go back to the page before the slides (redirect/hsitory state?)
//  TODO: use a reset
//  TODO: support links the story mode doc - how does this work w/ the hash?
//  TODO: IE note is FOUCy
(function(win, doc) {
	const slides = Array.from(doc.getElementsByClassName('slide'))
	let currentIndex = null

	const storageKeyMode = win.location.pathname + '.mode'
	const storageKeyHelpShown = win.location.pathname + '.help-shown'

	const contentAndUI = doc.getElementById('storyslides-main-content')
	const slidesContainer = doc.getElementById('storyslides-slides-container')
	const dialogKeys = doc.getElementById('storyslides-dialog-keys')
	const dialogMenu = doc.getElementById('storyslides-dialog-menu')
	const initialTitle = doc.title

	let contentErrors = false
	let openDialog = null
	let runAfterClosingDialog = null
	let storyModeScrollTimeout = null
	let scrollCameFromMe = false


	//
	// Utilities
	//

	const debug = win.console.debug.bind(win.console.debug, 'StorySlides:')
	const error = win.console.error.bind(win.console.error, 'StorySlides:')

	function hasStrictDataBoolean(element, attrName) {
		return element.dataset[attrName] === ''
	}

	function validateMode(mode) {
		if (mode === 'slides' || mode === 'story') return mode
		throw new Error(`Mode '${mode}' isn't valid`)
	}

	function progressPercent() {
		return Math.round(((currentIndex + 1) / slides.length) * 100)
	}

	function announce(text) {
		const announcer = doc.getElementById('storyslides-announcer')
		announcer.innerText = text
		setTimeout(() => announcer.innerText = '', 1000)
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

	function updateProgress(addToHistory) {
		// The author could've removed the progress indicator. (TODO?)
		const progress = doc.querySelector('#storyslides-progress > div')
		if (progress) {
			const percent = progressPercent()
			progress.style.width = `${Math.round(percent)}%`
		}

		const slideNumber = currentIndex + 1
		const hash = `#slide-${slideNumber}`

		doc.title = `Slide ${slideNumber} - ${initialTitle}`

		const statePusher = () => {
			if (win.location.hash) {
				if (win.location.hash !== hash) {
					win.history.pushState({ index: currentIndex }, doc.title, hash)
				}
			} else {
				win.history.replaceState({ index: currentIndex }, doc.title, hash)
			}
		}

		if (addToHistory) {
			if (win.history.state) {
				// Check that the current state isn't for the same index (which
				// would be the case if we switched modes) first.
				if (win.history.state.index !== currentIndex) {
					statePusher()
				}
			} else {
				statePusher()
			}
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

	function checkSlideForOverflow(index) {
		const overflow = isOverflowing(slides[index])
		if (overflow) {
			win.alert(`Slide ${index + 1} is overflowing by; ${JSON.stringify(overflow, null, 2)}`)
			error('Slide is overflowing:', slides[index], 'by:', overflow)
		}
	}

	function checkSetActiveSlideOptions(options) {
		if (typeof options !== 'object') {
			error('setActiveSlide options must be object', options)
		}
		if (!Object.prototype.hasOwnProperty.call(options, 'index')) {
			error('setActiveSlide options must specify index', options)
		}
		if (isNaN(options.index)) {
			error('Requested slide index is not a number.', options)
		}
		if (options.index < 0 || options.index > (slides.length - 1)) {
			error(`Requested slide index ${options.index} is out of bounds.`)
		}
		if (options.triggeredByScroll
			&& typeof options.triggeredByScroll !== 'boolean') {
			error('triggeredByScroll must be boolean', options)
		}
		if (options.restoringPreviousState
			&& typeof options.restoringPreviousState !== 'boolean') {
			error('restoringPreviousState must be boolean', options)
		}
		for (const key of Object.keys(options)) {
			const validOptions = Object.freeze(
				['index', 'triggeredByScroll', 'restoringPreviousState'])
			if (!validOptions.includes(key)) {
				error(`Unexpected key '${key}' in options object`, options)
			}
		}
	}

	function setActiveSlide(options) {
		checkSetActiveSlideOptions(options)

		const mode = getStoredMode()
		if (mode === 'slides') {
			if (currentIndex !== null) {
				slides[currentIndex].classList.remove('active')
			}
			slides[options.index].classList.add('active')

			checkSlideForOverflow(options.index)

		} else if (!options.triggeredByScroll) {
			// Story mode - focus and scroll to the slide
			//
			// Note: screen-readers may set the focus on to elements as the
			//       user reads and scrolls through the document using the
			//       virtual cursor - that's not story-slides doing it :-).
			scrollCameFromMe = true
			slides[options.index].focus()  // needs to be done first for SRs
			if (options.index === 0) {
				// If the page was just loaded, then we'll be at the top
				// already and there will be no need to scroll, so we should
				// un-ignore the next scroll event :-).
				if (win.pageYOffset > 0) {
					win.scrollTo(0, 0)
				} else {
					scrollCameFromMe = false
				}
			} else {
				slides[options.index].scrollIntoView(true)
			}
		}

		currentIndex = options.index
		updateProgress(options.restoringPreviousState !== true)
	}

	function setActiveSlideFromHash() {
		if (win.location.hash) {
			const match = win.location.hash.match(/^#slide-(\d+)$/)
			if (match) {
				const desired = Number(match[1]) - 1
				if (desired > -1 && desired < slides.length) {
					setActiveSlide({ index: desired })
					return
				}
			}
		}

		setActiveSlide({ index: 0 })
	}

	function popState(event) {
		if (event.state !== null) {
			setActiveSlide({
				index: event.state.index,
				restoringPreviousState: true
			})
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

		hideOpenDialog()

		if (mode === 'story') {
			goModeStory()
			setActiveSlideFromHash()
		} else {
			// It seems the only reliable way to make the live region work on
			// load is to give it some time to settle before fettling the CSS
			// that makes the slides show up.
			const showSlide = () => setTimeout(setActiveSlideFromHash, 1000)
			// Notes:
			//  - A value of 0 almost worked across browsers and SRs.
			//  - Would be nice to do more research and testing.
			//  - If the user switches back to story mode before this, it'll
			//    get called twice, but that's no biggie.

			// We can't call these two directly because if this is the first
			// time the user has used slides mode this session, and the help
			// dialog is shown, we need the slide to appear after that.
			goModeSlides(showSlide)
		}
	}

	// The following are called by the go-mode functions.
	// The style toggle is also called at startup.

	function toggleStyleSheetsForMode(mode) {
		const oppositeMode = mode === 'slides' ? 'story' : 'slides'
		for (const styleSheet of doc.styleSheets) {
			if (styleSheet.href) {
				if (styleSheet.href.includes(`.${mode}`)) {
					styleSheet.disabled = false
				}
				if (styleSheet.href.includes(`.${oppositeMode}`)) {
					styleSheet.disabled = true
				}
			}
		}
	}

	function applicationifyBody() {
		doc.body.setAttribute('role', 'application')
		doc.body.focus()  // encourage SRs to use application mode
	}

	function unApplicationifyBody() {
		doc.body.removeAttribute('role')
	}


	//
	// Slides mode
	//

	function goModeSlides(thenRun) {
		toggleStyleSheetsForMode('slides')

		doc.removeEventListener('keydown', keyHandlerModeStory)
		doc.addEventListener('keydown', keyHandlerModeSlides)
		doc.removeEventListener('scroll', scrollHandlerStoryMode)

		slidesContainer.setAttribute('aria-live', 'assertive')
		// Note: if JAWS is launched after Firefox, this doesn't work
		//       (<https://bugzilla.mozilla.org/show_bug.cgi?id=1453673>).
		applicationifyBody()

		win.removeEventListener('resize', storyViewportHandler)
		win.addEventListener('resize', slidesViewportHandler)
		slidesViewportHandler()

		storeMode('slides')

		if (!win.sessionStorage.getItem(storageKeyHelpShown)) {
			runAfterClosingDialog = thenRun
			showOrToggleDialog(dialogKeys)
			win.sessionStorage.setItem(storageKeyHelpShown, true)
		} else {
			thenRun()
		}
	}

	function hideOpenDialog() {
		if (openDialog) {
			const dialogThatWasOpen = openDialog
			openDialog.hidden = true
			contentAndUI.removeAttribute('inert')
			applicationifyBody()
			openDialog = null

			// We may've been asked to defer running some code (i.e. show the
			// slide after showing the help dialog for the first time).
			if (runAfterClosingDialog) {
				runAfterClosingDialog()
				runAfterClosingDialog = null
			}

			return dialogThatWasOpen
		}
		return null
	}

	function showOrToggleDialog(dialog) {
		const switchToNewDialog = hideOpenDialog() !== dialog
		if (switchToNewDialog && dialog.hidden === true) {
			dialog.hidden = false
			dialog.scrollTop = 0
			contentAndUI.setAttribute('inert', '')  // sets aria-hidden
			unApplicationifyBody()
			dialog.focus()  // already has tabindex -1
			openDialog = dialog
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
		setActiveSlide({ index: previousSlideNumber() })
	}

	function moveToNextRevealOrSlide() {
		if (revealStepsOrNextSlide()) {
			setActiveSlide({ index: nextSlideNumber() })
		}
	}

	function toggleSlideLock() {
		if (!doc.body.classList.contains('storyslides-locked')) {
			hideOpenDialog()
			unApplicationifyBody()
			doc.body.classList.add('storyslides-locked')
			win.alert("Slide locked. Press Escape to unlock. If you're using a screen-reader, you can now explore the slide with the virtual cursor.")
			slides[currentIndex].focus()
		} else {
			applicationifyBody()  // snap out of virtual cursor mode
			doc.body.classList.remove('storyslides-locked')
			win.alert('Slide unlocked.')
		}
	}

	const locked = () => doc.body.classList.contains('storyslides-locked')

	function toggleFullscreen() {
		if (screenfull.enabled) {
			screenfull.toggle()
			// On Safari on iOS it's a bit buggy and doesn't resize, even after
			// calling slidesViewportHandler after the toggle is resolved - probably due
			// to the animation effect.
		} else {
			win.alert('fullscreen mode is not available')
		}
	}

	// There seem to be problems re-adding a document keydown handler when a
	// screen-reader is running: the handler is often not registered, so
	// virtual cursor navigation continues. Therefore we check here for whether
	// we should ignore certain keys due to lock mode here, and also handle
	// closing dialogs here too.
	function keyHandlerModeSlides(event) {
		if (event.isComposing || event.keyCode === 229) return
		if (event.ctrlKey || event.metaKey) return

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				if (!locked() && !openDialog) moveToPreviousSlide()
				break
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
				if (!locked() && !openDialog) moveToNextRevealOrSlide()
				// Note: not supporting the space key as it's echoed by
				// screen-readers.
				break
			case 'f':
				if (!locked()) toggleFullscreen()
				break
			case 's':
				if (!locked()) switchToMode('story')
				break
			case '?':
			case 'h':
				if (!locked()) {
					showOrToggleDialog(dialogKeys)
				}
				break
			case 'l':
				if (!locked()) {
					toggleSlideLock()
				}
				break
			case 'Escape':
				if (locked()) {
					toggleSlideLock()
				} else {
					hideOpenDialog()
				}
				break
			case 'p':
				announce(progressPercent() + '%')
				break
			case 'o':
				announce('Slide ' + (currentIndex + 1) + ' of ' + slides.length)
				break
			/*
			case 'm':
				// For debugging
				showOrToggleDialog(dialogMenu)
			*/
		}
	}


	//
	// Story mode
	//

	function goModeStory() {
		if (currentIndex !== null) {
			slides[currentIndex].classList.remove('active')
		}

		slidesContainer.removeAttribute('aria-live')
		unApplicationifyBody()
		doc.body.blur()  // otherwise SRs may try to read the entire thing

		toggleStyleSheetsForMode('story')

		doc.removeEventListener('keydown', keyHandlerModeSlides)
		doc.addEventListener('keydown', keyHandlerModeStory)
		doc.addEventListener('scroll', scrollHandlerStoryMode)

		win.removeEventListener('resize', slidesViewportHandler)
		win.addEventListener('resize', storyViewportHandler)
		storyViewportHandler()

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
			setActiveSlide({
				index: findParentSlideIndex(current),  // FIXME breaks smtms?
				triggeredByScroll: true
			})
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
	// Handling line breaks
	//

	// Line breaks may be used in slides mode, but not desired in story mode
	// (e.g. when breaking up a heading across lines). Thus we go through and
	// replace <br class="slides"> with <span class="story"> </span><br
	// class="slides">

	function fettleLineBreaks() {
		const slideModeLineBreaks = doc.querySelectorAll('br.slides')
		for (const lineBreak of slideModeLineBreaks) {
			const lineBreakSpace = doc.createElement('span')
			lineBreakSpace.classList.add('story')
			lineBreakSpace.textContent = ' '
			lineBreak.parentElement.insertBefore(lineBreakSpace, lineBreak)
		}
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
			error('Mismatched percentages for split container:', container)
			contentErrors = true
		}

		const sum = percentages.reduce((accumulator, currentValue) => {
			const number = Number(currentValue.slice(0, -1))
			return accumulator += number
		}, 0)

		if (sum !== 100) {
			error(`Percentages add up to ${sum} for split container`, container)
			contentErrors = true
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

	// Slides mode
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
	function slidesViewportHandler() {
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

	// Story mode
	//
	// In story mode, we want to cap the max-height of images.
	function storyViewportHandler() {
		for (const image of contentAndUI.querySelectorAll('img')) {
			image.style.setProperty('--rendered-width', image.width + 'px')
		}
	}


	//
	// Linting
	//

	// Note: checking for overflowing slide content is done when a slide is
	// shown, as it requires the layout to be known. Therefore that check is
	// done above.

	function checkForDuplicateIds() {
		const allIds = Array.from(doc.querySelectorAll('[id]'), e => e.id)
		const uniqueIds = new Set(allIds)
		if (allIds.length > uniqueIds.size) {
			error('Duplicate element IDs detected')
			contentErrors = true
		}
	}

	function checkForElements() {
		const idsToCheck = Object.freeze([
			'storyslides-announcer',
			// 'storyslides-browser-support-note',
			'storyslides-button-fullscreen',
			'storyslides-button-help-keys',
			'storyslides-button-menu',
			'storyslides-button-mode-slides',
			'storyslides-button-mode-story',
			'storyslides-button-next',
			'storyslides-button-previous',
			'storyslides-dialog-keys',
			'storyslides-dialog-keys-title',
			'storyslides-dialog-menu',
			'storyslides-main-content',
			'storyslides-mode-slides-explainer',
			'storyslides-mode-slides-explainer-container',
			'storyslides-mode-story-explainer',
			'storyslides-progress',
			'storyslides-screen-errors',
			'storyslides-screen-intro',
			'storyslides-screen-intro-heading',
			'storyslides-screen-loading',
			'storyslides-slides-container',
			'storyslides-top-ui'
		])

		for (const id of idsToCheck) {
			const element = doc.getElementById(id)
			if (!element) {
				error(`missing element with id "${id}"`)
				contentErrors = true
			}
		}
	}

	function checkSlideContainment() {
		const container = doc.getElementById('storyslides-slides-container')
		const message = "The number of children of the slides container isn't the same as the number of slides. This could be due to putting story mode content outside of slides, having some slides outside of the slides contianer, or having other non-slide elements inside the container."

		if (slides.length !== container.children.length) {
			error(message)
			contentErrors = true
		}
	}


	//
	// Start-up
	//

	// TODO DRY?
	function disableModeStyleSheets() {
		for (const styleSheet of doc.styleSheets) {
			if (styleSheet.href) {
				if (styleSheet.href.includes('.story.') ||
					styleSheet.href.includes('.slides.')) {
					styleSheet.disabled = true
				}
			}
		}
	}

	// On Chrome, switching to story mode always puts focus on the button at
	// the top, even if we try to focus the slide we want to visit (using the
	// 'add tabindex, focus, remove tabindex' approach. This addresses that
	// issue.
	function makeSlidesProgrammaticallyFocusable() {
		for (const slide of slides) {
			slide.setAttribute('tabindex', '-1')
		}
	}

	// This moves the DOM node for the UI that should come first in the focus
	// order up to the start of the <body>. It's a convenience to the author,
	// as it allows them to have their slide/story content at the top of the
	// HTML when editing.
	function moveTopUI() {
		const topUI = doc.getElementById('storyslides-top-ui')
		contentAndUI.insertBefore(topUI, contentAndUI.firstChild)
	}

	function registerClickHandlers() {
		const setup = {
			'storyslides-button-menu': () => showOrToggleDialog(dialogMenu),
			'storyslides-button-help-keys': () => showOrToggleDialog(dialogKeys),
			'storyslides-button-mode-story': () => switchToMode('story'),
			'storyslides-button-mode-slides': () => switchToMode('slides'),
			'storyslides-button-previous': moveToPreviousSlide,
			'storyslides-button-next': moveToNextRevealOrSlide
		}

		for (const id in setup) {
			doc.getElementById(id).addEventListener('click', setup[id])
		}

		dialogKeys.querySelector('button.close').onclick = hideOpenDialog
		dialogMenu.querySelector('button.close').onclick = hideOpenDialog
	}

	function prepareContentAndUI() {
		// TODO catch any errors? Show error screen?
		makeSlidesProgrammaticallyFocusable()
		moveTopUI()
		registerClickHandlers()
		fettleLineBreaks()
		renderMarkdown()
		preparePauses()

		if (screenfull.enabled) {  // not supported on iPhone
			doc.getElementById('storyslides-button-fullscreen').onclick = () => {
				hideOpenDialog()
				toggleFullscreen()
			}
		} else {
			doc.getElementById('storyslides-button-fullscreen').remove()
		}

		win.history.scrollRestoration = 'manual'
		win.addEventListener('popstate', popState)
		win.addEventListener('hashchange', setActiveSlideFromHash)
	}

	function startUpInMode(mode) {
		prepareContentAndUI()
		doc.getElementById('storyslides-screen-intro').remove()
		contentAndUI.hidden = false
		switchToMode(mode, true)
		debug('ready')
	}

	function main() {
		debug('starting up...')
		doc.getElementById('storyslides-browser-support-note').remove()
		disableModeStyleSheets()

		checkForDuplicateIds()
		checkForElements()
		checkSlideContainment()
		doSplits()  // checks percentages

		// This is the least likely to cause flashing when laoding...
		toggleStyleSheetsForMode('story')

		if (contentErrors === true) {
			doc.getElementById('storyslides-screen-errors').hidden = false
			return
		}

		const loading = doc.getElementById('storyslides-screen-loading')
		setTimeout(function() {
			if (loading) loading.hidden = false
		}, 0)

		win.onload = function() {
			loading.remove()
			const previousMode = getStoredMode()
			if (previousMode) {
				startUpInMode(previousMode)
			} else {
				const heading = doc.getElementById('storyslides-screen-intro-heading')
				heading.innerText = initialTitle

				doc.getElementById('storyslides-choose-story').onclick =
					() => startUpInMode('story')
				doc.getElementById('storyslides-choose-slides').onclick =
					() => startUpInMode('slides')

				const intro = doc.getElementById('storyslides-screen-intro')
				intro.hidden = false
				heading.focus()
			}
		}
	}

	main()
})(window, document)
