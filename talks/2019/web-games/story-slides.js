(function () {
	'use strict';

	const storageKeyMode = window.location.pathname + '.mode';


	//
	// Functions that rely on state
	//

	function updateActiveSlide(options) {
		options.state.currentIndex = options.newIndex;
		updateProgress(
			options.state.slides,
			options.state.currentIndex,
			options.state.initialTitle,
			options.restoringPreviousState !== true);
	}


	//
	// Functions that do not rely on state
	//

	const debug = window.console.debug.bind(window.console.debug, 'StorySlides:');
	const error = window.console.error.bind(window.console.error, 'StorySlides:');

	function hasStrictDataBoolean(element, attrName) {
		return element.dataset[attrName] === ''
	}

	function progressPercent(slides, currentIndex) {
		return Math.round(((currentIndex + 1) / slides.length) * 100)
	}

	function announce(text) {
		const announcer = document.getElementById('storyslides-announcer');
		debug(`announcing '${text}'`);
		announcer.innerText = text;
		setTimeout(() => announcer.innerText = '', 1000);
	}

	function applicationifyBody() {
		document.body.setAttribute('role', 'application');
		document.body.focus();  // encourage SRs to use application mode
	}

	function unApplicationifyBody() {
		document.body.removeAttribute('role');
	}

	function getMode() {
		const saved = window.sessionStorage.getItem(storageKeyMode);
		if (saved !== null) validateMode(saved);
		return saved
	}

	function setMode(mode) {
		window.sessionStorage.setItem(storageKeyMode, validateMode(mode));
	}

	function updateProgress(slides, currentIndex, initialTitle, addToHistory) {
		debug('updateProgress():', currentIndex, initialTitle, 'add to history?', addToHistory);
		// The author could've removed the progress indicator. (TODO?)
		const progress = document.querySelector('#storyslides-progress > div');
		if (progress) {
			const percent = progressPercent(slides, currentIndex);
			progress.style.width = `${Math.round(percent)}%`;
		}

		const slideNumber = currentIndex + 1;
		const hash = `#slide-${slideNumber}`;

		document.title = `Slide ${slideNumber} - ${initialTitle}`;

		// FIXME separate and test?
		const statePusher = () => {
			if (window.location.hash) {
				if (window.location.hash !== hash) {
					debug('adding new history entry');
					window.history.pushState({ index: currentIndex }, document.title, hash);
				}
			} else {
				debug('replacing current history entry');
				window.history.replaceState({ index: currentIndex }, document.title, hash);
			}
		};

		if (addToHistory) {
			if (window.history.state) {
				// Check that the current state isn't for the same index (which
				// would be the case if we switched modes) first.
				if (window.history.state.index !== currentIndex) {
					statePusher();
				} else {
					debug('not adding to history as already on this slide');
				}
			} else {
				statePusher();
			}
		}
	}

	// FIXME exported for testing only
	function checkSetActiveSlideOptions(options) {
		debug('checkSetActiveSlideOptions()');
		const required = [ 'newIndex', 'state' ];
		const allowed = [ 'restoringPreviousState', 'triggeredByScroll' ];
		const requiredOrAllowed = required.concat(allowed);

		if (!options) throw Error('no options passed')
		if (typeof options !== 'object') throw Error('options is not an object')
		if (Object.keys(options).length < 1) throw Error('no options given')

		for (const key of required) {
			// eslint-disable-next-line no-prototype-builtins
			if (!options.hasOwnProperty(key)) {
				throw Error(`required key '${key}' not given`)
			}
		}

		for (const key of Object.keys(options)) {
			if (!requiredOrAllowed.includes(key)) {
				throw Error(`unexpected key '${key}' given`)
			}
		}

		return options
	}


	//
	// Private functions
	//

	// FIXME exported for testing only
	function validateMode(mode) {
		if (mode === 'slides' || mode === 'story') return mode
		throw new Error(`Mode '${mode}' isn't valid`)
	}

	//
	// Initialisation
	//

	let dialogKeys = null;
	let dialogMenu = null;
	let contentAndUI = null;  // FIXME DRY with State

	function init() {
		dialogKeys = document.getElementById('storyslides-dialog-keys');
		dialogMenu = document.getElementById('storyslides-dialog-menu');
		contentAndUI = document.getElementById('storyslides-main-content');
		dialogKeys.querySelector('button.close').addEventListener(
			'click', hideOpenDialog);
		dialogMenu.querySelector('button.close').addEventListener(
			'click', hideOpenDialog);
	}


	//
	// Dialog state
	//

	let _currentlyOpenDialog = null;
	let _codeToRun = null;


	//
	// Dialog state management
	//

	const setRunAfterClosingDialog = (run) => _codeToRun = run;
	const isDialogOpen = () => _currentlyOpenDialog !== null;

	const getOpenDialog = () => _currentlyOpenDialog;
	const setOpenDialog = (dialog) => _currentlyOpenDialog = dialog;

	function runCodeAfterClosingDialog() {
		if (_codeToRun) {
			_codeToRun();
			return true
		}
		return false
	}


	//
	// Functions that rely on dialog state
	//

	function getDialog(name) {
		const map = {
			'keys': dialogKeys,
			'menu': dialogMenu
		};
		if (!Object.keys(map).includes(name)) error(`Invalid dialog '${name}'`);
		return map[name]
	}

	function hideOpenDialog() {
		const dialogThatWasOpen = getOpenDialog();
		if (dialogThatWasOpen) {
			dialogThatWasOpen.hidden = true;
			contentAndUI.removeAttribute('inert');
			applicationifyBody();
			setOpenDialog(null);

			// We may've been asked to defer running some code (i.e. show the slide
			// after showing the help dialog for the first time).
			if (runCodeAfterClosingDialog()) setRunAfterClosingDialog(null);

			return dialogThatWasOpen
		}
		return null
	}

	function showOrToggleDialog(name) {
		const dialog = getDialog(name);
		const switchToNewDialog = hideOpenDialog() !== dialog;
		if (switchToNewDialog && dialog.hidden === true) {
			dialog.hidden = false;
			dialog.scrollTop = 0;
			contentAndUI.setAttribute('inert', '');  // sets aria-hidden
			unApplicationifyBody();
			dialog.focus();  // already has tabindex -1
			setOpenDialog(dialog);
		}
	}

	/* global screenfull */

	const storageKeyHelpShown = window.location.pathname + '.help-shown';


	//
	// Slides mode state
	//

	let keyHandlerModeSlides = null;  // must be set during startup


	//
	// Functions that rely on global state
	//

	function makeKeyHandlerModeSlides(switchToModeFunction) {
		// There seem to be problems re-adding a document keydown handler when a
		// screen-reader is running: the handler is often not registered, so
		// virtual cursor navigation continues. Therefore we check here for whether
		// we should ignore certain keys due to lock mode here, and also handle
		// closing dialogs here too.
		keyHandlerModeSlides = function keyHandlerModeSlides(event) {
			if (event.isComposing || event.keyCode === 229) return
			if (event.ctrlKey || event.metaKey) return

			switch (event.key) {
				case 'ArrowLeft':
				case 'ArrowUp':
				case 'PageUp':
					if (!locked() && !isDialogOpen()) moveToPreviousSlide(window.state);
					break
				case 'ArrowRight':
				case 'ArrowDown':
				case 'PageDown':
					if (!locked() && !isDialogOpen()) revealStepOrMoveToNextSlide(window.state);
					// Note: not supporting the space key as it's echoed by
					// screen-readers.
					break
				case 'f':
					if (!locked()) toggleFullscreen();
					break
				case 's':
					if (!locked()) {
						switchToModeFunction(window.state, 'story');
					}
					break
				case '?':
				case 'h':
					if (!locked()) {
						showOrToggleDialog('keys');
					}
					break
				case 'l':
					if (!locked()) {
						// TODO currentSlide getter?
						toggleSlideLock(window.state.slides[window.state.currentIndex]);
					}
					break
				case 'Escape':
					if (locked()) {
						// TODO currentSlide getter?
						toggleSlideLock(window.state.slides[window.state.currentIndex]);
					} else {
						hideOpenDialog();
					}
					break
				case 'p':
					announce(progressPercent(window.state.slides, window.state.currentIndex) + '%');
					break
				case 'o':
					announce('Slide ' + (window.state.currentIndex + 1) + ' of ' + window.state.slides.length);
					break
				case 'm':  // for debugging
					showOrToggleDialog('menu');
			}
		};
	}


	//
	// Functions that rely on state
	//

	// Called during start-up only
	function registerSlidesModeClickHandlers(state) {
		if (screenfull.enabled) {  // not supported on iPhone
			document
				.getElementById('storyslides-button-fullscreen')
				.addEventListener('click', () => {
					hideOpenDialog();
					toggleFullscreen();
				});
		} else {
			document.getElementById('storyslides-button-fullscreen').remove();
		}

		const setup = {
			'storyslides-button-help-keys': () => showOrToggleDialog('keys'),
			'storyslides-button-menu': () => showOrToggleDialog('menu'),
			'storyslides-button-next': () => revealStepOrMoveToNextSlide(state),
			'storyslides-button-previous': () => moveToPreviousSlide(state)
		};

		for (const id in setup) {
			document.getElementById(id).addEventListener('click', setup[id]);
		}
	}

	function setUpModeSlides(state, thenRun) {
		document.addEventListener('keydown', keyHandlerModeSlides);
		window.addEventListener('resize', slidesViewportHandler);
		slidesViewportHandler();

		state.slidesContainer.setAttribute('aria-live', 'assertive');
		// Note: if JAWS is launched after Firefox, this doesn't work
		//       (<https://bugzilla.mozilla.org/show_bug.cgi?id=1453673>).
		applicationifyBody();

		if (window.sessionStorage.getItem(storageKeyHelpShown) !== 'yes') {
			setRunAfterClosingDialog(thenRun);
			showOrToggleDialog('keys');
			window.sessionStorage.setItem(storageKeyHelpShown, 'yes');
		} else {
			thenRun();
		}
	}

	function tearDownModeSlides(state) {
		if (state.currentIndex !== null) {
			state.slides[state.currentIndex].classList.remove('active');
		}

		if (screenfull.enabled) {
			screenfull.exit();  // prevents aberrations in Firefox and iOS Safari
		}

		hideOpenDialog();

		document.removeEventListener('keydown', keyHandlerModeSlides);
		window.removeEventListener('resize', slidesViewportHandler);

		state.slidesContainer.removeAttribute('aria-live');
		unApplicationifyBody();
		document.body.blur();  // otherwise SRs may try to read the entire thing
	}

	function moveToPreviousSlide(state) {
		const newIndex = previousSlideNumber(state.slides, state.currentIndex);
		setActiveSlideInSlidesMode({ newIndex: newIndex, state: state });
	}

	function revealStepOrMoveToNextSlide(state) {
		const newIndex = revealStepAndNextSlideNumber(state.slides, state.currentIndex);
		if (newIndex !== null) {
			setActiveSlideInSlidesMode({ newIndex: newIndex, state: state });
		}
	}


	//
	// Functions that do not rely on state
	//

	function setActiveSlideInSlidesMode(options) {
		const slides = options.state.slides;
		const currentIndex = options.state.currentIndex;
		const newIndex = options.newIndex;
		debug('setActiveSlideInSlidesMode():', options);
		checkSetActiveSlideOptions(options);  // done in both modes

		if (currentIndex !== null) {
			slides[currentIndex].classList.remove('active');
		}
		slides[newIndex].classList.add('active');
		checkSlideForOverflow(slides, newIndex);

		updateActiveSlide(options);
	}

	function toggleSlideLock(currentSlide) {
		if (!document.body.classList.contains('storyslides-locked')) {
			hideOpenDialog();
			unApplicationifyBody();
			document.body.classList.add('storyslides-locked');
			window.alert("Slide locked. Press Escape to unlock. If you're using a screen-reader, you can now explore the slide with the virtual cursor.");
			currentSlide.focus();
		} else {
			applicationifyBody();  // snap out of virtual cursor mode
			document.body.classList.remove('storyslides-locked');
			window.alert('Slide unlocked.');
		}
	}

	function revealStepAndNextSlideNumber(slides, currentIndex) {
		if (revealStepAndNextSlide(slides[currentIndex])) {
			return nextSlideNumber(slides, currentIndex)
		}
		return null
	}

	// The author sets two CSS custom properties under the :root pseudo-class to
	// specify slide aspect ratio and font size, such as in the following examples.
	//
	// --author-font-height-percent-of-slide: 8;
	// --author-aspect-ratio: calc(16 / 9);
	//
	// It is not possible to use CSS custom properties in media queries, so we need
	// to run some code to work out the dimensions of the slides.
	//
	// Based on those dimentions, the base font size is set accordingly too.
	//
	// Thanks https://davidwalsh.name/css-variables-javascript :-)
	function slidesViewportHandler() {
		const viewWidth = document.documentElement.clientWidth;
		const viewHeight = document.documentElement.clientHeight;
		const viewAspect = viewWidth / viewHeight;
		const slideAspectRaw = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--author-aspect-ratio');
		const matches = slideAspectRaw.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
		const slideAspect = matches[1] / matches[2];

		let slideHeight = null;
		let slideWidth = null;

		if (viewAspect >= slideAspect) {
			// View is wider than slide
			// Slide height should be 100vh
			slideHeight = viewHeight;
			slideWidth = viewHeight * slideAspect;
		} else {
			// View is narrower than slide
			// slide width should be 100vw
			slideWidth = viewWidth;
			slideHeight = viewWidth / slideAspect;
		}

		document.documentElement.style
			.setProperty('--computed-slide-height', slideHeight + 'px');
		document.documentElement.style
			.setProperty('--computed-slide-width', slideWidth + 'px');

		// On mobile browsers, these can change quite a bit, as browser UI
		// appears and disappears.
		const verticalMargin = (window.innerHeight - slideHeight) / 2;
		const horizontalMargin = (window.innerWidth - slideWidth) / 2;

		document.documentElement.style.setProperty(
			'--computed-vertical-margin', (verticalMargin > 0 ? verticalMargin : 0) + 'px');
		document.documentElement.style.setProperty(
			'--computed-horizontal-margin', (horizontalMargin > 0 ? horizontalMargin : 0) + 'px');

		// We also work out the user's chosen base font size
		const rootFontSizePercent = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--author-font-height-percent-of-slide');
		const realRootFontSize = slideHeight * (rootFontSizePercent / 100);
		document.documentElement.style
			.setProperty('--computed-base-font-size', realRootFontSize + 'px');
	}

	function locked() {
		return document.body.classList.contains('storyslides-locked')
	}

	function toggleFullscreen() {
		if (screenfull.enabled) {
			screenfull.toggle();
			// On Safari on iOS it's a bit buggy and doesn't resize, even after
			// calling slidesViewportHandler after the toggle is resolved -
			// probably due to the animation effect.
		} else {
			window.alert('fullscreen mode is not available');
		}
	}

	// If there are steps on the slide that are to be gradually revealed (more info
	// on this at the bottom) then go through those steps before advancing to the
	// next slide. Returns true to say "go to next slide" or false otherwise.
	function revealStepAndNextSlide(slide) {
		const nextHiddenThing = slide.querySelector('[data-storyslides-step]');
		if (nextHiddenThing) {
			nextHiddenThing.removeAttribute('data-storyslides-step');
			return false
		}
		return true
	}

	function checkSlideForOverflow(slides, index) {
		const overflow = isOverflowing(slides[index]);
		if (overflow) {
			window.alert(`Slide ${index + 1} is overflowing by; ${JSON.stringify(overflow, null, 2)}`);
			error('Slide is overflowing:', slides[index], 'by:', overflow);
		}
	}

	// FIXME exported for testing only
	function isOverflowing(element) {
		const horizontalOverflow = element.scrollWidth - element.clientWidth;
		const verticalOverflow = element.scrollHeight - element.clientHeight;
		if (horizontalOverflow > 0 || verticalOverflow > 0) {
			return {
				'horizontal': horizontalOverflow > 0 ? horizontalOverflow : 0,
				'vertical': verticalOverflow > 0 ? verticalOverflow : 0
			}
		}
		return null
	}

	// FIXME exported for testing only
	function previousSlideNumber(slides, currentIndex) {
		return currentIndex > 0 ? currentIndex - 1 : slides.length - 1
	}

	// FIXME exported for testing only
	function nextSlideNumber(slides, currentIndex) {
		return (currentIndex + 1) % slides.length
	}

	//
	// Story mode state
	//

	let keyHandlerModeStory = null;  // must be set during startup
	let storyModeScrollTimeout = null;
	let scrollCameFromMe = false;


	//
	// Functions that rely on global state
	//

	function makeKeyHandlerModeStory(switchToModeFunction) {
		keyHandlerModeStory = function keyHandlerModeStory(event) {
			if (event.isComposing || event.keyCode === 229) return
			if (event.key === 'Escape') {
				switchToModeFunction(window.state, 'slides');
			}
		};
	}

	// In story mode, we want to cap the max-height of images.
	function storyViewportHandler() {
		for (const image of window.state.slidesContainer.querySelectorAll('img')) {
			image.style.setProperty('--rendered-width', image.width + 'px');
		}
	}

	function realStoryModeScrollHandler() {
		if (!scrollCameFromMe) {
			// Look at a point in the middle of the screen, a third of the way
			// down, and work out which slide is under that point.
			//
			// The point we're testing could be between slides or, at high zoom
			// levels or with a bouncy scroll, it could be in the top UI.

			let height = window.innerHeight / 3;
			let found = document.body;
			const isSlide = (element) => element.classList.contains('slide');

			while (!isSlide(found) && height > 0) {
				found = document.elementFromPoint(window.innerWidth / 2, height);
				if (!isSlide(found)) height = height - 10;
			}

			const index = isSlide(found) ?
				findParentSlideIndex(window.state.slides, found) : 0;

			setActiveSlideInStoryMode({
				newIndex: index,
				state: window.state,
				triggeredByScroll: true
			});
		} else {
			scrollCameFromMe = false;
		}
	}


	//
	// Functions that rely on state
	//

	function setActiveSlideInStoryMode(options) {
		const state = options.state;
		const newIndex = options.newIndex;
		debug('setActiveSlideInStoryMode():', options);
		checkSetActiveSlideOptions(options);  // done in both modes

		if (!options.triggeredByScroll) {
			// Note: screen-readers may set the focus on to elements as the user
			//       reads and scrolls through the document using the virtual
			//       cursor - that's not story-slides doing it :-).
			scrollCameFromMe = true;
			state.slides[newIndex].focus();  // needs to be done first for SRs
			if (newIndex === 0) {
				// If the page was just loaded, then we'll be at the top already
				// and there will be no need to scroll, so we should un-ignore the
				// next scroll event :-).
				if (window.pageYOffset > 0) {
					window.scrollTo(0, 0);
				} else {
					scrollCameFromMe = false;
				}
			} else {
				state.slides[newIndex].scrollIntoView(true);
			}
		}

		if (state.currentIndex !== newIndex) {
			updateActiveSlide(options);
		} else {
			debug('not setting same current slide');
		}
	}


	//
	// Functions that do not rely on state
	//

	function setUpModeStory() {
		document.addEventListener('keydown', keyHandlerModeStory);
		document.addEventListener('scroll', scrollHandlerStoryMode);
		window.addEventListener('resize', storyViewportHandler);
		storyViewportHandler();
	}

	function tearDownModeStory() {
		document.removeEventListener('keydown', keyHandlerModeStory);
		document.removeEventListener('scroll', scrollHandlerStoryMode);
		window.removeEventListener('resize', storyViewportHandler);
	}

	function scrollHandlerStoryMode(event) {
		clearTimeout(storyModeScrollTimeout);
		storyModeScrollTimeout = setTimeout(
			() => realStoryModeScrollHandler(), 250);
	}


	//
	// Private functions
	//

	// FIXME test
	function findParentSlideIndex(slides, element) {
		let next = element;
		while (!slides.includes(next)) {
			if (next.parentElement) {
				next = next.parentElement;
			} else {
				return null
			}
		}
		return slides.indexOf(next)
	}

	//
	// State
	//

	// Browsers aren't supposed to fire hashchange events when using the History
	// API but they seem to be - am I doing something wrong? (TODO)
	let _restoringPreviousState = false;

	//
	// Functions that rely on global state
	//

	function popState(event) {
		debug('popState():', event);
		if (event.state !== null) {
			_restoringPreviousState = true;
			setActiveSlide({
				newIndex: event.state.index,  // state previously pushed
				restoringPreviousState: true,
				state: window.state
			});
		}
	}


	//
	// Functions that rely on state
	//

	function switchToMode(state, mode, startup) {
		debug('switchToMode():', state, mode, startup);
		if (!startup && getMode() === mode) {
			error(`Already in ${mode} mode; not switching.`);
			return
		}

		toggleStyleSheetsForMode(mode);
		setMode(mode);

		// FIXME double-checking mode
		if (mode === 'story') {
			if (!startup) tearDownModeSlides(state);
			setUpModeStory();
			setActiveSlideFromHash(state);
		} else {
			// It seems the only reliable way to make the live region work on load
			// is to give it some time to settle before fettling the CSS that makes
			// the slides show up.
			const showSlide = () => setTimeout(
				() => setActiveSlideFromHash(state), 1000);
			// Notes:
			//  - A value of 0 almost worked across browsers and SRs.
			//  - Would be nice to do more research and testing.
			//  - If the user switches back to story mode before this, it'll
			//    get called twice, but that's no biggie.

			// We can't call these two directly because if this is the first time
			// the user has used slides mode this session, and the help dialog is
			// shown, we need the slide to appear after that.
			if (!startup) tearDownModeStory();
			setUpModeSlides(state, showSlide);
		}
	}

	function setActiveSlideFromHash(state) {
		debug('setActiveSlideFromHash():', state);
		if (_restoringPreviousState) {
			debug('skipping - restoring previous state');
			_restoringPreviousState = false;
			return
		}
		if (window.location.hash) {
			const match = window.location.hash.match(/^#slide-(\d+)$/);
			if (match) {
				const desired = Number(match[1]) - 1;
				if (desired > -1 && desired < state.slides.length) {
					setActiveSlide({ newIndex: desired, state: state });
					return
				}
			}
		}
		setActiveSlide({ newIndex: 0, state: window.state });
	}

	function registerClickHandlersAndGlobalEventListeners(state) {
		registerSlidesModeClickHandlers(state);

		window.history.scrollRestoration = 'manual';
		window.addEventListener('popstate', popState);
		window.addEventListener('hashchange',
			() => setActiveSlideFromHash(state));

		const setup = {
			'storyslides-button-mode-slides': () => switchToMode(state, 'slides'),
			'storyslides-button-mode-story': () => switchToMode(state, 'story')
		};

		for (const id in setup) {
			document.getElementById(id).addEventListener('click', setup[id]);
		}
	}


	//
	// Functions that do not rely on state
	//

	function setActiveSlide(options) {
		debug('setActiveSlide():', options);
		if (getMode() === 'story') {
			setActiveSlideInStoryMode(options);
		} else {
			setActiveSlideInSlidesMode(options);
		}
	}

	function toggleStyleSheetsForMode(mode) {
		for (const styleSheet of document.styleSheets) {
			if (styleSheet.href) {
				const name = baseName(styleSheet.href);
				if (name === 'story-slides.css') continue
				if (name === 'theme.common.css') continue
				styleSheet.disabled = name !== `theme.${mode}.css`;
				console.log(name, 'disabled?', styleSheet.disabled);
			}
		}

		document.documentElement.className = `mode-${mode}`;  // support transitions
	}

	function disableThemeStyleSheets() {
		for (const styleSheet of document.styleSheets) {
			if (styleSheet.href) {
				const name = baseName(styleSheet.href);
				if (name.startsWith('theme') && name !== 'theme.common.css') {
					styleSheet.disabled = true;
				}
			}
		}
	}

	// TODO test - what about local file access in other browsers?
	function baseName(href) {
		return href.split('/').pop()
	}

	function stripLeadingSpace(text) {
		const leadingSpaceMatches = text.match(/\n(\s*)\S/);
		if (leadingSpaceMatches) {
			const leadingSpace = leadingSpaceMatches[1];
			const breakAndLeadingSpace = RegExp('\n(' + leadingSpace + ')', 'g');
			return text.replace(breakAndLeadingSpace, '\n').trim()
		}
		return text
	}

	/* global marked */


	//
	// Handling line breaks
	//

	// Line breaks may be used in slides mode, but not desired in story mode (e.g.
	// when breaking up a heading across lines). Thus we go through and replace <br
	// class="slides"> with <span class="story"> </span><br class="slides">

	function fettleLineBreaks() {
		const slideModeLineBreaks = document.querySelectorAll('br.slides');
		for (const lineBreak of slideModeLineBreaks) {
			const lineBreakSpace = document.createElement('span');
			lineBreakSpace.classList.add('story');
			lineBreakSpace.textContent = ' ';
			lineBreak.parentElement.insertBefore(lineBreakSpace, lineBreak);
		}
	}


	//
	// Rendering Markdown within slides
	//

	// The 'markdown' custom attribute flags an element as containing markdown.  In
	// order for it to appear correctly in the editor and not invalidate the HTML,
	// the markdown is placed within a commend within the container.

	function getMarkdownFromComment(element) {
		for (const child of element.childNodes) {
			if (child.nodeType === window.Node.COMMENT_NODE) {
				return child.textContent
			}
		}
	}

	function renderMarkdown() {
		for (const container of document.querySelectorAll('[data-markdown]')) {
			const markdown = stripLeadingSpace(getMarkdownFromComment(container));
			container.innerHTML = marked(markdown);
		}
	}


	//
	// Making slides programatically focusable
	//

	// On Chrome, switching to story mode always puts focus on the button at the
	// top, even if we try to focus the slide we want to visit (using the 'add
	// tabindex, focus, remove tabindex' approach. This addresses that issue.
	function makeSlidesProgrammaticallyFocusable(slides) {
		for (const slide of slides) {
			slide.setAttribute('tabindex', '-1');
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
	// We don't create a pause step for anything with a class of 'story' becuase
	// that is only visible in story mode.
	function preparePauses(slides) {
		for (const slide of slides) {
			const pauseyThings = hasStrictDataBoolean(slide, 'pause')
				? [ slide ]  // if the slide itself has the attribute
				: slide.querySelectorAll('[data-pause]');

			for (const thing of pauseyThings) {
				for (const step of thing.children) {
					if (!step.classList.contains('story')) {
						step.setAttribute('data-storyslides-step', '');
					}
				}
			}
		}
	}


	//
	// Split slide layouts
	//

	// Each slide is a flexbox. The elements within can be shifted to the
	// top/middle/bottom of of the slide using CSS classes on the slides.
	//
	// If the author wants the vertical space in the slide split equally between
	// all children, they can specify an empty 'data-split' attribute.  If they
	// want more control, they can give a list of percentages for the sizes of the
	// vertical sections.
	//
	// Split sections are given the CSS classes part-<number> and also
	// part-(even|odd) as appropriate.
	//
	// If the slide had a top/middle/bottom class, then the split parts will
	// recieve this too.
	//
	// Splitting only some of the content of a slide is supported.

	function doSplits() {
		const containers = document.querySelectorAll('[data-split]');
		let ok = true;

		for (const container of containers) {
			const elements = Array.from(container.children);
			const numNonStoryElements = elements.filter((element) => {
				return !element.classList.contains('story')
			}).length;

			const percentages = hasStrictDataBoolean(container, 'split')
				? []
				: container.dataset.split.split(' ');

			if (percentages.length > 0) {
				ok = checkPercentages(percentages, numNonStoryElements, container);
			}

			processSplitContainer(container, percentages, elements);
		}

		return ok
	}

	function processSplitContainer(container, percentages, elements) {
		const promolgate = [ 'top', 'middle', 'bottom' ];
		let counter = 0;

		for (const child of elements) {  // don't iterate over live collection
			if (!child.classList.contains('story')) {
				// Create a flexbox with author-requested height
				const splitCounter = counter + 1;  // the first split part is odd
				const box = document.createElement('div');
				box.classList.add(`part-${splitCounter}`);
				const parity = splitCounter % 2 ? 'odd' : 'even';
				box.classList.add('part-' + parity);
				box.appendChild(child);

				if (percentages.length > 0) {
					box.style.flexBasis = percentages[counter];
				}

				for (const property of promolgate) {
					if (container.classList.contains(property)) {
						box.classList.add(property);
					}
				}

				container.appendChild(box);
				counter++;
			} else {
				// Story mode content is invisible in slides mode and mustn't
				// affect the layout, but the DOM order does need to be preserved,
				// so it makes sense in story mode.
				container.appendChild(child);
			}
		}
	}

	function checkPercentages(percentages, expectedLength, container) {
		if (percentages.length !== expectedLength) {
			error('Mismatched percentages for split container:', container);
			return false
		}

		const sum = percentages.reduce((accumulator, currentValue) => {
			const number = Number(currentValue.slice(0, -1));
			return accumulator += number
		}, 0);

		if (sum !== 100) {
			error(`Percentages add up to ${sum} for split container`, container);
			return false
		}

		return true
	}

	class State {
		// TODO get const?

		constructor() {
			this._currentIndex = null;
			this._slides = Object.freeze(Array.from(document.getElementsByClassName('slide')));
			this._slidesContainer = document.getElementById('storyslides-slides-container');
			this._contentAndUI =  document.getElementById('storyslides-main-content');  // FIXME DRY
			this._initialTitle = document.title;
		}

		get currentIndex() {
			return this._currentIndex
		}

		set currentIndex(newIndex) {
			this._currentIndex = newIndex;  // FIXME error-checking
		}

		get slides() {
			return this._slides
		}

		get slidesContainer() {
			return this._slidesContainer
		}

		get initialTitle() {
			return this._initialTitle
		}

		get contentAndUI() {
			return this._contentAndUI
		}
	}

	const topUI = `
<div id="storyslides-top-ui" class="storyslides-ui">
	<div class="slides mobile-only">
		<button id="storyslides-button-menu">Menu</button>
		<button class="slides" id="storyslides-button-previous" aria-label="Previous"><span>&larr;</span></button>
	</div>
	<div class="story">
		<button id="storyslides-button-mode-slides" aria-describedby="storyslides-mode-slides-key storyslides-mode-slides-explainer">Switch to slides mode</button>
		<span id="storyslides-mode-slides-key">or press <kbd>Escape</kbd></span>
		<div id="storyslides-mode-slides-explainer-container">
			<p id="storyslides-mode-slides-explainer">Slides mode displays each slide one at a time, as they would be projected for the audience. The extra information present in story mode is not displayed. Keyboard shortcuts or buttons can be used to move between slides.</p>
			<button class="mobile-only close">Close</button>
		</div>
	</div>
</div>`;

	const bottomUI = `
<div class="storyslides-ui slides">
	<button class="mobile-only" id="storyslides-button-next" aria-label="Next"><span>&rarr;</span></button>
	<div id="storyslides-progress"><div></div></div>
</div>`;

	const mainUI = `
<div class="storyslides-ui">
	<div id="storyslides-screen-errors" hidden>
		<h1>Content errors detected</h1>
		<p>An error, or errors, were detected in your presentation's content&mdash;open the browser console for more info.</p>
	</div>

	<div id="storyslides-screen-loading" hidden>
		<p>Loading&hellip;</p>
	</div>

	<div id="storyslides-screen-intro" hidden>
		<h1 id="storyslides-screen-intro-heading" tabindex="-1"></h1>
		<fieldset>
			<legend>Read presentation as&hellip;</legend>
			<div id="storyslides-grid">
				<h2>Story</h2>
				<div id="storyslides-desc-story">
					<p>The real content of a talk is often not in the slides, but in what's said around them. Story mode shows you not only what was projected, but the explanation behind it too.</p>
				</div>
				<button id="storyslides-choose-story" aria-describedby="storyslides-desc-story">Story (recommended)</button>

				<h2>Slides</h2>
				<div id="storyslides-desc-slides">
					<p>Slides mode shows you just the slides as presented.</p>
				</div>
				<button id="storyslides-choose-slides" aria-describedby="storyslides-desc-slides storyslides-desc-help">Slides</button>
			</div>
		</fieldset>
	</div>

	<div id="storyslides-dialog-keys" role="dialog" tabindex="-1" aria-labelledby="storyslides-dialog-keys-title" class="storyslides-dialog" hidden>
		<h1 id="storyslides-dialog-keys-title">Slides mode help</h1>
		<p class="mobile-only">Tap either the left or right third of the screen to move to the previous or next slide. If you have a keyboard attached, you can use the following shortcuts.</p>
		<table>
			<tr>
				<th><p>Key</p></th>
				<th><p>Action</p></th>
			</tr>
			<tr>
				<td><kbd>S</kbd></td>
				<td><p>Switch to story mode.</p></td>
			</tr>
			<tr>
				<td><kbd>L</kbd></td>
				<td><p>Lock the current slide: disable all navigation keys, so if you're using a screen-reader, you can explore the current slide with your virtual cursor.</p></td>
			</tr>
			<tr>
				<td><kbd>F</kbd></td>
				<td><p>Toggle full-screen slide view<span class="mobile-only"> (not supported on iPhone)</span>.</p></td>
			</tr>
			<tr>
				<td><kbd>&rarr;</kbd> <kbd>&darr;</kbd> <kbd>Page&nbsp;Down</kbd></td>
				<td><p>Next slide.</p></td>
			</tr>
			<tr>
				<td><kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>Page&nbsp;Up</kbd></td>
				<td><p>Previous slide.</p></td>
			</tr>
			<tr>
				<td><kbd>Escape</kbd></td>
				<td>
					<ul>
						<li><p><strong>In slides mode:</strong> disable the current slide lock (no effect otherwise).</p></li>
						<li><p><strong>In story mode:</strong> go to slides mode.</p></li>
					</ul>
				</td>
			</tr>
			<tr>
				<td><kbd>P</kbd></td>
				<td><p>If you're running a screen-reader, announce the current slide progress as a percentage.</p></td>
			</tr>
			<tr>
				<td><kbd>O</kbd></td>
				<td><p>If you're running a screen-reader, announce the current slide number and the total number of slides.</p></td>
			</tr>
			<tr>
				<td><kbd aria-hidden="true">?</kbd><span class="visually-hidden">question mark</span> <kbd>h</kbd></td>
				<td><p>Toggle this help dialog</p></td>
			</tr>
		</table>
		<button class="close">Close</button>
	</div>

	<div id="storyslides-dialog-menu" role="dialog" tabindex="-1" aria-labelledby="storyslides-dialog-menu-heading" class="storyslides-dialog" hidden>
		<h1 id="storyslides-dialog-menu-heading">View and Info</h1>
		<button id="storyslides-button-mode-story" aria-describedby="storyslides-mode-story-explainer">Switch to story mode</button>
		<button id="storyslides-button-fullscreen">Full-screen</button>
		<button id="storyslides-button-help-keys">Help</button>
		<p id="storyslides-mode-story-explainer">Story mode allows you to read the presentation as a document, rather than a collection of separate slides, and includes extra background information on the content.</p>
		<button class="close">Close</button>
	</div>
</div>`;

	const announcer = '<div id="storyslides-announcer" role="log" aria-live="assertive" class="visually-hidden"></div>';

	function fettleHtml(fixture) {
		// Main content wraps the top UI, slides and bottom UI

		const mainContent = document.createElement('div');
		mainContent.id = 'storyslides-main-content';
		mainContent.hidden = true;

		const dummyTopUI = document.createElement('div');  // extra layer
		dummyTopUI.innerHTML = topUI;

		const slidesContainer = document.createElement('div');
		slidesContainer.id = 'storyslides-slides-container';
		// Bringing all children over brings <script>s too; that'll be fixed later.
		while (fixture.childNodes.length > 0) {
			slidesContainer.appendChild(fixture.childNodes[0]);
		}

		const dummyBottomUI = document.createElement('div');  // extra layer
		dummyBottomUI.innerHTML = bottomUI;

		// The dialogs and announcer follow, outside the main content container

		const dummyMainUI = document.createElement('div');  // extra layer
		dummyMainUI.innerHTML = mainUI;

		const dummyAnnouncer = document.createElement('div');
		dummyAnnouncer.innerHTML = announcer;

		mainContent.appendChild(dummyTopUI.children[0]);
		mainContent.appendChild(slidesContainer);
		mainContent.appendChild(dummyBottomUI.children[0]);
		fixture.appendChild(mainContent);

		fixture.appendChild(dummyMainUI.children[0]);
		fixture.appendChild(dummyAnnouncer.children[0]);

		for (const script of fixture.querySelectorAll('script')) {
			fixture.appendChild(script);
		}
	}

	// Note: checking for overflowing slide content is done when a slide is
	// shown, as it requires the layout to be known. Therefore that check is
	// done above.

	function checkNoDuplicateIds() {
		const allIds = Array.from(document.querySelectorAll('[id]'), (e) => e.id);
		const uniqueIds = new Set(allIds);
		if (allIds.length > uniqueIds.size) {
			error('Duplicate element IDs detected');
			return false
		}
		return true
	}

	function checkForElements() {
		const check = [
			'storyslides-announcer',
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
		];

		const presence = check.map((id) => {
			if (!document.getElementById(id)) {
				error(`missing element with id '${id}'`);
				return false
			}
			return true
		});

		return presence.every((result) => result === true)
	}

	function checkSlideContainment(slides) {
		const container = document.getElementById('storyslides-slides-container');
		const message = "The number of children of the slides container isn't the same as the number of slides. This could be due to putting story mode content outside of slides, having some slides outside of the slides contianer, or having other non-slide elements inside the container.";

		if (slides.length !== container.children.length) {
			error(message);
			return false
		}

		return true
	}

	function lint(slides) {
		return checkNoDuplicateIds()
			&& checkForElements()
			&& checkSlideContainment(slides)
	}

	// Screen reader stuff...

	function prepareContentAndUI(state) {
		// TODO catch any errors? Show error screen?
		makeSlidesProgrammaticallyFocusable(state.slides);
		fettleLineBreaks();
		renderMarkdown();
		preparePauses(state.slides);
	}

	function startUpInMode(state, mode) {
		prepareContentAndUI(state);
		registerClickHandlersAndGlobalEventListeners(state);
		document.getElementById('storyslides-screen-intro').remove();
		state.contentAndUI.hidden = false;
		switchToMode(state, mode, true);
		debug('ready');
	}

	function windowLoaded(state, loading) {
		loading.remove();
		const previousMode = getMode();
		if (previousMode) {
			startUpInMode(state, previousMode);
		} else {
			const heading = document.getElementById('storyslides-screen-intro-heading');
			heading.innerText = state.initialTitle;

			document.getElementById('storyslides-choose-story').addEventListener(
				'click', () => startUpInMode(state, 'story'));
			document.getElementById('storyslides-choose-slides').addEventListener(
				'click', () => startUpInMode(state, 'slides'));

			const intro = document.getElementById('storyslides-screen-intro');
			intro.hidden = false;
			heading.focus();
		}
	}

	function main() {
		debug('starting up...');
		fettleHtml(document.body);
		init();
		window.state = new State();
		disableThemeStyleSheets();
		makeKeyHandlerModeSlides(switchToMode);
		makeKeyHandlerModeStory(switchToMode);
		toggleStyleSheetsForMode('story');
		document.body.hidden = false;

		if (lint(window.state.slides) && doSplits(window.state.slides)) {
			const loading = document.getElementById('storyslides-screen-loading');
			loading.hidden = false;
			// TODO why can't we unhide it immediately and add a transition delay?
			setTimeout(() => loading.className = 'in-progress', 1000);
			window.addEventListener('load', () => windowLoaded(window.state, loading));
		} else {
			document.getElementById('storyslides-screen-errors').hidden = false;
		}
	}

	main();

}());
