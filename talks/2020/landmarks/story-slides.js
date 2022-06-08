/*
Licence information for Story Slides and third party libraries

=== Google inert polyfill ===

Copyright 2015 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.

=== Screenfull ===

screenfull
v5.2.0 - 2021-11-03
(c) Sindre Sorhus; MIT License

(The licence terms are the same as those in the next section.)

=== Story Slides ===

Copyright © 2019-2022 Matthew Tylee Atkinson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

if (!('inert' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'inert', {
    enumerable: true,

    /**
     * @return {boolean}
     * @this {Element}
     */
    get: function() { return this.hasAttribute('inert'); },

    /**
     * @param {boolean} inert
     * @this {Element}
     */
    set: function(inert) {
      if (inert) {
        this.setAttribute('inert', '');
      } else {
        this.removeAttribute('inert');
      }
    }
  });

  window.addEventListener('load', function() {
    function applyStyle(css) {
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.body.appendChild(style);
    }
    var css = "/*[inert]*/*[inert]{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none}";
    applyStyle(css);

    /**
     * Sends a fake tab event. This is only supported by some browsers.
     *
     * @param {boolean=} opt_shiftKey whether to send this tab with shiftKey
     */
    function dispatchTabEvent(opt_shiftKey) {
      var ev = null;
      try {
        ev = new KeyboardEvent('keydown', {
          keyCode: 9,
          which: 9,
          key: 'Tab',
          code: 'Tab',
          keyIdentifier: 'U+0009',
          shiftKey: !!opt_shiftKey,
          bubbles: true
        });
      } catch (e) {
        try {
          // Internet Explorer
          ev = document.createEvent('KeyboardEvent');
          ev.initKeyboardEvent(
            'keydown',
            true,
            true,
            window,
            'Tab',
            0,
            opt_shiftKey ? 'Shift' : '',
            false,
            'en'
          )
        } catch (e) {}
      }
      if (ev) {
        try {
          Object.defineProperty(ev, 'keyCode', { value: 9 });
        } catch (e) {}
        document.dispatchEvent(ev);
      }
    }

    /**
     * Determines whether the specified element is inert, and returns the element
     * which caused this state. This is limited to, but may include, the body
     * element.
     *
     * @param {Element} e to check
     * @return {Element} element is made inert by, if any
     */
    function madeInertBy(e) {
      while (e && e !== document.documentElement) {
        if (e.hasAttribute('inert')) {
          return e;
        }
        e = e.parentElement;
      }
      return null;
    }

    /**
     * Finds the nearest shadow root from an element that's within said shadow root.
     *
     * TODO(samthor): We probably want to find the highest shadow root.
     *
     * @param {Element} e to check
     * @return {Node} shadow root, if any
     */
    var findShadowRoot = function(e) { return null; };
    if (window.ShadowRoot) {
      findShadowRoot = function(e) {
        while (e && e !== document.documentElement) {
          if (e instanceof window.ShadowRoot) { return e; }
          e = e.parentNode;
        }
        return null;
      }
    }

    /**
     * Returns the target of the passed event. If there's a path (shadow DOM only), then prefer it.
     *
     * @param {!Event} event
     * @return {Element} target of event
     */
    function targetForEvent(event) {
      var p = event.path;
      return  /** @type {Element} */ (p && p[0] || event.target);
    }

    // Hold onto the last tab direction: next (tab) or previous (shift-tab). This
    // can be used to step over inert elements in the correct direction. Mouse
    // or non-tab events should reset this and inert events should focus nothing.
    var lastTabDirection = 0;
    document.addEventListener('keydown', function(ev) {
      if (ev.keyCode === 9) {
        lastTabDirection = ev.shiftKey ? -1 : +1;
      } else {
        lastTabDirection = 0;
      }
    });
    document.addEventListener('mousedown', function(ev) {
      lastTabDirection = 0;
    });

    // Retain the currently focused shadowRoot.
    var focusedShadowRoot = null;
    function updateFocusedShadowRoot(root) {
      if (root == focusedShadowRoot) { return; }
      if (focusedShadowRoot) {
        if (!(focusedShadowRoot instanceof window.ShadowRoot)) {
          throw new Error('not shadow root: ' + focusedShadowRoot);
        }
        focusedShadowRoot.removeEventListener('focusin', shadowFocusHandler, true);  // remove
      }
      if (root) {
        root.addEventListener('focusin', shadowFocusHandler, true);  // add
      }
      focusedShadowRoot = root;
    }

    /**
     * Focus handler on a Shadow DOM host. This traps focus events within that root.
     *
     * @param {!Event} ev
     */
    function shadowFocusHandler(ev) {
      // ignore "direct" focus, we only want shadow root focus
      var last = ev.path[ev.path.length - 1];
      if (last === /** @type {*} */ (window)) { return; }
      sharedFocusHandler(targetForEvent(ev));
      ev.preventDefault();
      ev.stopPropagation();
    }

    /**
     * Called indirectly by both the regular focus handler and Shadow DOM host focus handler. This
     * is the bulk of the polyfill which prevents focus.
     *
     * @param {Element} target focused on
     */
    function sharedFocusHandler(target) {
      var inertElement = madeInertBy(target);
      if (!inertElement) { return; }

      // If the page has been tabbed recently, then focus the next element
      // in the known direction (if available).
      if (document.hasFocus() && lastTabDirection !== 0) {
        function getFocused() {
          return (focusedShadowRoot || document).activeElement;
        }

        // Send a fake tab event to enumerate through the browser's view of
        // focusable elements. This is supported in some browsers (not Firefox).
        var previous = getFocused();
        dispatchTabEvent(lastTabDirection < 0 ? true : false);
        if (previous != getFocused()) { return; }

        // Otherwise, enumerate through adjacent elements to find the next
        // focusable element. This won't respect any custom tabIndex.
        var filter = /** @type {NodeFilter} */ ({
          /**
           * @param {Node} node
           * @return {number}
           */
          acceptNode: function(node) {
            if (!node || !node.focus || node.tabIndex < 0) {
              return NodeFilter.FILTER_SKIP;  // look at descendants
            }
            var contained = inertElement.contains(node);
            return contained ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
          },
        });
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, filter);
        walker.currentNode = inertElement;

        var nextFunc = Math.sign(lastTabDirection) === -1 ? walker.previousNode : walker.nextNode
        var next = nextFunc.bind(walker);
        for (var candidate; candidate = next(); ) {
          candidate.focus();
          if (getFocused() !== previous) { return; }
        }

        // FIXME: If a focusable element can't be found here, it's likely to mean
        // that this is the start or end of the page. Blurring is then not quite
        // right, as it prevents access to the browser chrome.
      }

      // Otherwise, immediately blur the targeted element. Technically, this
      // still generates focus and blur events on the element. This is (probably)
      // the price to pay for this polyfill.
      target.blur();
    }

    // The 'focusin' event bubbles, but instead, use 'focus' with useCapture set
    // to true as this is supported in Firefox. Additionally, target the body so
    // this doesn't generate superfluous events on document itself.
    document.body.addEventListener('focus', function(ev) {
      var target = targetForEvent(ev);
      updateFocusedShadowRoot((target == ev.target ? null : findShadowRoot(target)));
      sharedFocusHandler(target);  // either real DOM node or shadow node
    }, true);

    // Use a capturing click listener as both a safety fallback where pointer-events is not
    // available (IE10 and below), and to prevent accessKey access to inert elements.
    // TODO(samthor): Note that pointer-events polyfills trap more mouse events, e.g.-
    //   https://github.com/kmewhort/pointer_events_polyfill
    document.addEventListener('click', function(ev) {
      var target = targetForEvent(ev);
      if (madeInertBy(target)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }, true);
  });
}

/*!
* screenfull
* v5.2.0 - 2021-11-03
* (c) Sindre Sorhus; MIT License
*/
(function () {
	'use strict';

	var document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
	var isCommonjs = typeof module !== 'undefined' && module.exports;

	var fn = (function () {
		var val;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// New WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// Old WebKit
			[
				'webkitRequestFullScreen',
				'webkitCancelFullScreen',
				'webkitCurrentFullScreenElement',
				'webkitCancelFullScreen',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			[
				'mozRequestFullScreen',
				'mozCancelFullScreen',
				'mozFullScreenElement',
				'mozFullScreenEnabled',
				'mozfullscreenchange',
				'mozfullscreenerror'
			],
			[
				'msRequestFullscreen',
				'msExitFullscreen',
				'msFullscreenElement',
				'msFullscreenEnabled',
				'MSFullscreenChange',
				'MSFullscreenError'
			]
		];

		var i = 0;
		var l = fnMap.length;
		var ret = {};

		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0; i < val.length; i++) {
					ret[fnMap[0][i]] = val[i];
				}
				return ret;
			}
		}

		return false;
	})();

	var eventNameMap = {
		change: fn.fullscreenchange,
		error: fn.fullscreenerror
	};

	var screenfull = {
		request: function (element, options) {
			return new Promise(function (resolve, reject) {
				var onFullScreenEntered = function () {
					this.off('change', onFullScreenEntered);
					resolve();
				}.bind(this);

				this.on('change', onFullScreenEntered);

				element = element || document.documentElement;

				var returnPromise = element[fn.requestFullscreen](options);

				if (returnPromise instanceof Promise) {
					returnPromise.then(onFullScreenEntered).catch(reject);
				}
			}.bind(this));
		},
		exit: function () {
			return new Promise(function (resolve, reject) {
				if (!this.isFullscreen) {
					resolve();
					return;
				}

				var onFullScreenExit = function () {
					this.off('change', onFullScreenExit);
					resolve();
				}.bind(this);

				this.on('change', onFullScreenExit);

				var returnPromise = document[fn.exitFullscreen]();

				if (returnPromise instanceof Promise) {
					returnPromise.then(onFullScreenExit).catch(reject);
				}
			}.bind(this));
		},
		toggle: function (element, options) {
			return this.isFullscreen ? this.exit() : this.request(element, options);
		},
		onchange: function (callback) {
			this.on('change', callback);
		},
		onerror: function (callback) {
			this.on('error', callback);
		},
		on: function (event, callback) {
			var eventName = eventNameMap[event];
			if (eventName) {
				document.addEventListener(eventName, callback, false);
			}
		},
		off: function (event, callback) {
			var eventName = eventNameMap[event];
			if (eventName) {
				document.removeEventListener(eventName, callback, false);
			}
		},
		raw: fn
	};

	if (!fn) {
		if (isCommonjs) {
			module.exports = {isEnabled: false};
		} else {
			window.screenfull = {isEnabled: false};
		}

		return;
	}

	Object.defineProperties(screenfull, {
		isFullscreen: {
			get: function () {
				return Boolean(document[fn.fullscreenElement]);
			}
		},
		element: {
			enumerable: true,
			get: function () {
				return document[fn.fullscreenElement];
			}
		},
		isEnabled: {
			enumerable: true,
			get: function () {
				// Coerce to boolean in case of old WebKit
				return Boolean(document[fn.fullscreenEnabled]);
			}
		}
	});

	if (isCommonjs) {
		module.exports = screenfull;
	} else {
		window.screenfull = screenfull;
	}
})();

(function () {
    'use strict';

    const modes = ['story', 'slides'];
    const storageKeyMode = window.location.pathname + '.mode';
    //
    // Functions that do not rely on state
    //
    const debug = window.console.debug.bind(window.console.debug, 'Story Slides:');
    const error = window.console.error.bind(window.console.error, 'Story Slides:');
    function hasStrictDataBoolean(element, attrName) {
        return element.dataset[attrName] === '';
    }
    function getMode() {
        const saved = window.sessionStorage.getItem(storageKeyMode);
        const mode = modes.find(value => value === saved);
        if (mode)
            return mode;
        return null;
    }
    const setMode = (mode) => window.sessionStorage.setItem(storageKeyMode, mode);
    function debugOptionsToString(options) {
        const debug = [];
        for (const key of Object.keys(options)) {
            debug.push(`${key}: ${options[key]}`);
        }
        return debug.join('; ');
    }
    // FIXME: When switching modes and taking time over it, this gets called and
    //        errors out as canditate is null (e.g. when a dialog is open).
    function slideNumberFromElement(element) {
        const isSlide = (candidate) => candidate.classList.contains('slide');
        let found = element;
        while (found !== document.body && !isSlide(found)) {
            found = found.parentElement;
        }
        if (found === document.body)
            return null;
        return Number(found.getAttribute('data-slide-number'));
    }
    function progressPercent(currentSlideNumber, numberOfSlides) {
        return Math.round((currentSlideNumber / numberOfSlides) * 100);
    }
    //
    // Functions that rely on state
    //
    // NOTE: These two are here to avoid code being imported both ways between
    //       story/slides and shared.
    // Update state, slides progress bar (if present) and history stack
    function updateActiveSlide(options) {
        var _a;
        debug('updateActiveSlide():', debugOptionsToString(options));
        // NOTE: The author could've removed the progress indicator.
        const progress = document.querySelector('#story-slides-progress > div');
        if (progress) {
            const percent = progressPercent(options.newNumber, options.state.numSlides);
            progress.style.width = `${Math.round(percent)}%`;
        }
        const hash = (_a = options.hash) !== null && _a !== void 0 ? _a : `#${options.newNumber}`;
        document.title = `Slide ${options.newNumber} - ${options.state.initialTitle}`;
        if (window.history.state) {
            if (window.history.state.slideNumber === options.newNumber) {
                if (options.force) {
                    debug('forced to update same-slide history entry');
                    window.history.replaceState({ slideNumber: options.newNumber }, document.title, hash);
                }
                else {
                    debug('not adding same slide to history');
                }
            }
            else {
                debug('existing history.state: adding new entry');
                window.history.pushState({ slideNumber: options.newNumber }, document.title, hash);
            }
        }
        else {
            debug('no history.state: updating entry');
            window.history.replaceState({ slideNumber: options.newNumber }, document.title, hash);
        }
        if (!options.state.startingUp) {
            debug('setting previous slide number to', options.state.currentSlideNumber);
            options.state.previousSlideNumber = options.state.currentSlideNumber;
        }
        debug('setting current slide number to', options.newNumber);
        options.state.currentSlideNumber = options.newNumber;
    }

    //
    // Dialog state
    //
    let currentlyOpenDialog = null;
    let codeToRun = null;
    let previousActiveElement = null;
    //
    // Dialog state management
    //
    const setRunAfterClosingDialog = (run) => codeToRun = run;
    const isDialogOpen = () => currentlyOpenDialog !== null;
    function runCodeAfterClosingDialog() {
        if (codeToRun) {
            codeToRun();
            codeToRun = null;
        }
    }
    //
    // Initialisation
    //
    let dialogKeys;
    let dialogMenu;
    let dialogGo;
    function initDialogsWithActivateSlidesFunc(activateSlideFunction) {
        dialogKeys = document.getElementById('story-slides-dialog-keys');
        dialogMenu = document.getElementById('story-slides-dialog-menu');
        dialogGo = document.getElementById('story-slides-dialog-go');
        const buttons = document.querySelectorAll('.story-slides-ui button.close');
        for (const button of buttons) {
            // NOTE: Must ensure event isn't passed, or it'll be interpreted as a
            //       reuqest to not restore focus after closing the dialog.
            button.addEventListener('click', () => hideOpenDialog());
        }
        document.getElementById('story-slides-go-form').addEventListener('submit', makeGoSubmitHandler(activateSlideFunction));
        // TODO: Test; find a neater way.
        const onMac = navigator.userAgent.indexOf('Mac') > -1;
        if (onMac) {
            for (const kbd of dialogKeys.getElementsByTagName('kbd')) {
                if (kbd.innerText === 'Alt')
                    kbd.innerText = 'Option';
            }
        }
    }
    function makeGoSubmitHandler(activateSlideFunction) {
        return function goSubmitHandler(event) {
            event.preventDefault(); // stop page reloading
            const number = Number(document.getElementById('story-slides-go-input').value);
            if (number > 0 && number <= window.storySlidesState.numSlides) {
                if (number !== window.storySlidesState.currentSlideNumber) {
                    hideOpenDialog(false);
                    activateSlideFunction({ newNumber: number, state: window.storySlidesState });
                }
                else {
                    previousActiveElement = window.storySlidesState.currentSlide;
                    hideOpenDialog();
                }
            }
            else {
                hideOpenDialog();
            }
        };
    }
    //
    // Functions that rely on dialog state
    //
    function getDialog(name) {
        const map = {
            'go': dialogGo,
            'keys': dialogKeys,
            'menu': dialogMenu
        };
        if (!Object.keys(map).includes(name)) {
            throw Error(`Invalid dialog '${name}'`);
        }
        return map[name];
    }
    function showOrToggleDialog(name, replaceExistingDialog = false) {
        if (currentlyOpenDialog && !replaceExistingDialog) {
            throw Error('showOrToggleDialog(): A dialog is open');
        }
        if (!currentlyOpenDialog && replaceExistingDialog) {
            throw Error('showOrToggleDialog(): No dialog is open');
        }
        if (!replaceExistingDialog) {
            previousActiveElement = document.activeElement;
        }
        else {
            currentlyOpenDialog.hidden = true; // TODO: Checked above, yes?!
        }
        const dialog = getDialog(name);
        if (name === 'go') {
            document.getElementById('story-slides-slide-last').innerText =
                String(window.storySlidesState.numSlides);
            document.getElementById('story-slides-slide-current').innerText =
                String(window.storySlidesState.currentSlideNumber);
        }
        // TODO: check on mobile
        // HT maybe https://stackoverflow.com/questions/9538868/prevent-body-from-scrolling-when-a-modal-is-opened
        // HT maybe https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
        // TODO: Use https://github.com/willmcpo/body-scroll-lock
        document.body.style.overflow = 'hidden';
        dialog.scrollTop = 0;
        dialog.hidden = false;
        window.storySlidesState.contentAndUI.setAttribute('inert', '');
        window.storySlidesState.contentAndUI.setAttribute('aria-hidden', 'true');
        currentlyOpenDialog = dialog;
        if (name !== 'go') {
            dialog.focus(); // already has tabindex -1
        }
        else {
            document.getElementById('story-slides-go-input').focus();
        }
    }
    function hideOpenDialog(restoreFocus = true) {
        if (!currentlyOpenDialog)
            throw Error('No dialog is open');
        currentlyOpenDialog.hidden = true;
        if (currentlyOpenDialog === dialogGo) {
            // FIXME: include this in the new idea too?
            document.getElementById('story-slides-go-input').value = '';
        }
        else if (currentlyOpenDialog === dialogKeys) {
            document.querySelectorAll('details').forEach(details => details.removeAttribute('open'));
        }
        document.body.style.overflow = ''; // TODO: check on mobile
        window.storySlidesState.contentAndUI.removeAttribute('inert');
        window.storySlidesState.contentAndUI.removeAttribute('aria-hidden');
        if (restoreFocus === true) {
            // FIXME: No longer true as not using that polyfill any more, but this
            //        does work; can it be simplified?
            // We schedule the focusing task for "as soon as possible" after
            // microtasks run, because the MutationObserver used by the inert
            // polyfil inherently uses microtasks, and needs to wind down.
            (function (element) {
                setTimeout(function () {
                    // If we moved to slides mode, the menu button may have gone.
                    if (window.getComputedStyle(element).display === 'none') {
                        document.body.focus();
                    }
                    else {
                        element.focus();
                    }
                }, 0);
            })(previousActiveElement); // TODO: dialog opened, so this must exist?
        }
        previousActiveElement = null;
        currentlyOpenDialog = null;
        // We may've been asked to defer running some code (i.e. show the slide
        // after showing the keyboard shortcuts dialog for the first time).
        runCodeAfterClosingDialog();
    }

    /* global screenfull */
    const HELP_SHOWN = window.location.pathname + '.story-slides-help-shown';
    const ANNOUNCE_REMOVE_DELAY = 1e3;
    const KEY_HANDLER_THROTTLE = 500;
    // It seems the only reliable way to make the live region work on load is to
    // give it some time to settle before fettling the CSS that makes the slides
    // show up.
    const SLIDE_SETTLE_DELAY = 1e3;
    // NOTE:
    //  - A value of 0 _almost_ worked across browsers and SRs.
    //  - Would be nice to do more research and testing.
    //  - If the user switches back to story mode before this, it'll get called
    //    twice, but that's no biggie.
    //
    // Slides mode state
    //
    let keyHandlerModeSlides; // must be set during startup
    //
    // Functions that rely on global state
    //
    // Must be called during startup
    function initMakeKeyHandlerModeSlides(switchToModeFunction) {
        // FIXME: update docs
        // There seem to be problems re-adding a document keydown handler when a
        // screen reader is running: the handler is often not registered, so
        // virtual cursor navigation continues. Therefore we check here for whether
        // we should ignore certain keys due to lock mode here, and also handle
        // closing dialogs here too.
        function theActualKeyHandler(event) {
            if (event.isComposing || event.keyCode === 229)
                return;
            if (event.ctrlKey || event.metaKey)
                return;
            const state = window.storySlidesState;
            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'PageUp':
                    if (!isDialogOpen())
                        moveToPreviousSlide(state);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case 'PageDown':
                    if (!isDialogOpen()) {
                        revealStepOrMoveToNextSlide(state);
                    }
                    // NOTE: not supporting the space key as it's echoed by
                    //       screen readers.
                    // FIXME: just prevent default to fix that?
                    break;
                case 'f':
                    if (!isDialogOpen())
                        toggleFullscreen();
                    break;
                case 's':
                    if (!isDialogOpen()) {
                        switchToModeFunction(state, 'story');
                    }
                    break;
                case 'g':
                    if (!isDialogOpen()) {
                        event.preventDefault();
                        showOrToggleDialog('go');
                    }
                    break;
                case '?':
                case 'h':
                    if (!isDialogOpen())
                        showOrToggleDialog('keys');
                    break;
                case 'Escape':
                    if (isDialogOpen()) {
                        hideOpenDialog();
                    }
                    break;
                case 'p':
                    if (!isDialogOpen()) {
                        const current = state.currentSlideNumber;
                        const total = state.numSlides;
                        const percent = progressPercent(current, total);
                        announce(`${percent}%, slide ${current} of ${total}`);
                    }
                    break;
                case 'm':
                    if (!isDialogOpen())
                        showOrToggleDialog('menu');
            }
        }
        // TODO: check needed
        if (window.storySlidesNoThrottle) {
            keyHandlerModeSlides = theActualKeyHandler;
        }
        else {
            keyHandlerModeSlides = throttle(theActualKeyHandler);
        }
    }
    //
    // Functions that rely on state
    //
    // Called during start-up only
    function registerSlidesModeClickHandlers(state) {
        if (screenfull.isEnabled) { // not supported on iPhone
            document
                .getElementById('story-slides-button-fullscreen')
                .addEventListener('click', () => {
                if (isDialogOpen())
                    hideOpenDialog();
                toggleFullscreen();
            });
        }
        else {
            document.getElementById('story-slides-button-fullscreen').remove();
        }
        document.getElementById('story-slides-button-next').addEventListener('click', () => revealStepOrMoveToNextSlide(state));
        document.getElementById('story-slides-button-previous').addEventListener('click', () => moveToPreviousSlide(state));
    }
    function setUpModeSlides(state, showSlide) {
        if (!keyHandlerModeSlides)
            throw Error('No slides mode key handler set');
        window.addEventListener('resize', slidesViewportHandler);
        slidesViewportHandler();
        state.slidesContainer.setAttribute('aria-live', 'assertive');
        // FIXME: need to do rIC here?
        document.body.style.visibility = 'visible';
        function registerKeyHandlerAndRunCode() {
            setTimeout(() => {
                showSlide();
                setTimeout(() => {
                    document.addEventListener('keydown', keyHandlerModeSlides);
                }, KEY_HANDLER_THROTTLE);
            }, SLIDE_SETTLE_DELAY);
        }
        // The first time the user has used slides mode this session, the keyboard
        // shortcuts dialog is shown; we need the slide to appear after that.
        if (window.sessionStorage.getItem(HELP_SHOWN) !== 'yes') {
            setRunAfterClosingDialog(registerKeyHandlerAndRunCode);
            showOrToggleDialog('keys');
            window.sessionStorage.setItem(HELP_SHOWN, 'yes');
        }
        else {
            registerKeyHandlerAndRunCode();
        }
    }
    function tearDownModeSlides(state) {
        if (!keyHandlerModeSlides)
            throw Error('No slides mode key handler set');
        // TODO: will we ever be starting up here?
        if (!state.startingUp) {
            state.currentSlide.classList.remove('active');
        }
        if (screenfull.isEnabled) {
            screenfull.exit(); // prevents aberrations in Firefox and iOS Safari
        }
        if (isDialogOpen())
            hideOpenDialog();
        document.removeEventListener('keydown', keyHandlerModeSlides);
        window.removeEventListener('resize', slidesViewportHandler);
        state.slidesContainer.removeAttribute('aria-live');
    }
    function moveToPreviousSlide(state) {
        const num = previousSlideNumber(state.numSlides, state.currentSlideNumber);
        activateSlideInSlidesMode({ newNumber: num, state });
    }
    function revealStepOrMoveToNextSlide(state) {
        if (revealStepAndCheckIfReadyForNextSlide(state.currentSlide)) {
            const num = nextSlideNumber(state.numSlides, state.currentSlideNumber);
            if (num !== null) {
                activateSlideInSlidesMode({ newNumber: num, state });
            }
        }
    }
    function activateSlideInSlidesMode(options) {
        debug('activateSlideInSlidesMode():', debugOptionsToString(options));
        const { state, newNumber } = options;
        if (!state.startingUp) {
            state.currentSlide.classList.remove('active');
        }
        state.slide(newNumber).classList.add('active');
        checkSlideForOverflow(state.slide(newNumber), newNumber);
        updateActiveSlide(options);
    }
    //
    // Functions that do not rely on state
    //
    // The author sets two CSS custom properties under the :root pseudo-class to
    // specify slide aspect ratio and font size, such as in the following examples.
    //
    // --slide-font-height-percent-of-slide: 8;
    // --slide-aspect-ratio: calc(16 / 9);
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
        // FIXME DRY with linting.js
        const slideAspectRaw = window.getComputedStyle(document.documentElement)
            .getPropertyValue('--slide-aspect-ratio');
        const matches = slideAspectRaw.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
        // NOTE: The format was already checked in linting checkGivenAspect()
        const slideAspect = Number(matches[1]) / Number(matches[2]);
        let slideHeight = null;
        let slideWidth = null;
        if (viewAspect >= slideAspect) {
            // View is wider than slide
            // Slide height should be 100vh
            slideHeight = viewHeight;
            slideWidth = viewHeight * slideAspect;
        }
        else {
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
        document.documentElement.style.setProperty('--computed-vertical-margin', (verticalMargin > 0 ? verticalMargin : 0) + 'px');
        document.documentElement.style.setProperty('--computed-horizontal-margin', (horizontalMargin > 0 ? horizontalMargin : 0) + 'px');
        // FIXME DRY with linting.js
        // We also work out the user's chosen base font size
        const rootFontSizePercent = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--slide-font-height-percent-of-slide'));
        const realRootFontSize = slideHeight * (rootFontSizePercent / 100);
        document.documentElement.style
            .setProperty('--computed-base-font-size', realRootFontSize + 'px');
    }
    function toggleFullscreen() {
        if (screenfull.isEnabled) {
            screenfull.toggle();
            // On Safari on iOS it's a bit buggy and doesn't resize, even after
            // calling slidesViewportHandler after the toggle is resolved -
            // probably due to the animation effect.
        }
        else {
            window.alert('fullscreen mode is not available');
        }
    }
    // If there are steps on the slide that are to be gradually revealed (more info
    // on this at the bottom) then go through those steps before advancing to the
    // next slide. Returns true to say "go to next slide" or false otherwise.
    function revealStepAndCheckIfReadyForNextSlide(slide) {
        const nextHiddenThing = slide.querySelector('[data-story-slides-step]');
        if (nextHiddenThing) {
            nextHiddenThing.removeAttribute('data-story-slides-step');
            return false;
        }
        return true;
    }
    function checkSlideForOverflow(slide, number) {
        const overflow = isOverflowing(slide);
        if (overflow) {
            window.alert(`Slide ${number} is overflowing by; ${JSON.stringify(overflow, null, 2)}`);
            error('Slide is overflowing:', slide, 'by:', overflow);
        }
    }
    // NOTE: Only exported for testing
    function isOverflowing(element) {
        const horizontalOverflow = element.scrollWidth - element.clientWidth;
        const verticalOverflow = element.scrollHeight - element.clientHeight;
        if (horizontalOverflow > 0 || verticalOverflow > 0) {
            return {
                'horizontal': horizontalOverflow > 0 ? horizontalOverflow : 0,
                'vertical': verticalOverflow > 0 ? verticalOverflow : 0
            };
        }
        return null;
    }
    // NOTE: Only exported for testing
    function previousSlideNumber(numSlides, currentNumber) {
        return currentNumber > 1 ? currentNumber - 1 : numSlides;
    }
    // NOTE: Only exported for testing
    function nextSlideNumber(numSlides, currentNumber) {
        return (currentNumber % numSlides) + 1;
    }
    let last = performance.now();
    function throttle(callback) {
        return function (event) {
            const now = performance.now();
            if (now > last + KEY_HANDLER_THROTTLE) {
                last = now;
                callback(event);
            }
        };
    }
    // NOTE: Only exported for testing
    function announce(text) {
        const announcer = document.getElementById('story-slides-announcer');
        debug(`announcing '${text}'`);
        announcer.innerText = text;
        setTimeout(() => announcer.innerText = '', ANNOUNCE_REMOVE_DELAY);
    }

    //
    // Story mode state
    //
    let keyHandlerModeStory = null; // must be set during startup
    let storyModeScrollTimeout = null;
    let scrollCameFromMe = false;
    //
    // Functions that rely on global state
    //
    // Must be called during startup
    function initMakeKeyHandlerModeStory(switchToModeFunction) {
        keyHandlerModeStory = function (event) {
            if (event.isComposing || event.keyCode === 229)
                return;
            switch (event.key) {
                case 'Escape':
                    if (isDialogOpen()) {
                        if (isDialogOpen())
                            hideOpenDialog();
                    }
                    else {
                        switchToModeFunction(window.storySlidesState, 'slides');
                    }
                    break;
                case 'g':
                    if (!event.altKey)
                        break;
                case '©': // eslint-disable-line no-fallthrough
                    if (!isDialogOpen()) {
                        event.preventDefault();
                        showOrToggleDialog('go');
                    }
                    break;
                case '?':
                    if (!isDialogOpen())
                        showOrToggleDialog('keys');
                    break;
                case 'm':
                    if (!event.altKey)
                        break;
                case 'µ': // eslint-disable-line no-fallthrough
                    if (!isDialogOpen())
                        showOrToggleDialog('menu');
            }
        };
    }
    function realStoryModeScrollHandler() {
        var _a;
        if (scrollCameFromMe) {
            scrollCameFromMe = false;
        }
        else {
            activateSlideInStoryMode({
                newNumber: (_a = scanForSlideNumber()) !== null && _a !== void 0 ? _a : 1,
                state: window.storySlidesState,
                triggeredByScroll: true
            });
        }
    }
    //
    // Functions that rely on state
    //
    function activateSlideInStoryMode(options) {
        debug('activateSlideInStoryMode():', debugOptionsToString(options));
        const { state, newNumber } = options;
        if (!options.triggeredByScroll) {
            // NOTE: screen readers may set the focus [OR JUST SCROLL THE PAGE?] on
            //       to elements as the user reads and scrolls through the document
            //       using the virtual cursor - that's not Story Slides doing it.
            scrollCameFromMe = true;
            if (newNumber === 1) {
                // Scroll to the very top if slide 1 was requested (we could have
                // just loaded the page).
                if (window.pageYOffset > 0) {
                    // FIXME: should this be in an idle callback like the other
                    //        things below, too? The other things are presumably
                    //        because before we got here we were waiting for
                    //        something else to happen...
                    window.scrollTo(0, 0);
                }
                else {
                    // We're at the top already so there's no need to scroll, so we
                    // should un-ignore the next scroll event :-).
                    scrollCameFromMe = false;
                }
                // FIXME: DRY with below?
                // TODO: sT on this gives us a pause whilst bkg fading
                window.requestIdleCallback(() => {
                    // FIXME: rAF for this
                    document.body.style.visibility = 'visible';
                    // TODO: need a pause here too?
                    state.slide(newNumber).focus({ preventScroll: true });
                });
            }
            else {
                // FIXME: DRY with above?
                // TODO: sT on this gives us a pause whilst bkg fading
                window.requestIdleCallback(() => {
                    state.slide(newNumber).scrollIntoView(true);
                    window.requestIdleCallback(() => {
                        // FIXME: rAF for this
                        document.body.style.visibility = 'visible';
                        // TODO: need a pause here too?
                        state.slide(newNumber).focus({ preventScroll: true });
                    });
                });
            }
        }
        updateActiveSlide(options);
    }
    //
    // Functions that do not rely on state
    //
    function setUpModeStory() {
        if (!keyHandlerModeStory)
            throw Error('No story mode key handler set');
        document.addEventListener('keydown', keyHandlerModeStory);
        document.addEventListener('scroll', scrollHandlerStoryMode);
    }
    function tearDownModeStory() {
        if (isDialogOpen())
            hideOpenDialog();
        if (!keyHandlerModeStory)
            throw Error('No story mode key handler set');
        document.removeEventListener('keydown', keyHandlerModeStory);
        document.removeEventListener('scroll', scrollHandlerStoryMode);
    }
    function scrollHandlerStoryMode() {
        if (storyModeScrollTimeout)
            clearTimeout(storyModeScrollTimeout);
        storyModeScrollTimeout = setTimeout(realStoryModeScrollHandler, 250);
    }
    function scanForSlideNumber() {
        // Take a point towards the middle of the screen, and work out which slide
        // is under that point.
        //
        // The point being testing could be in a gap between slides. If a slide
        // isn't found, try a starting point 10px higher up the screen.  If no
        // slide is ever found, default to the first.
        let height = window.innerHeight / 4;
        let slideNumber = null;
        do {
            height = height - 10;
            const found = document.elementFromPoint(window.innerWidth / 2, height);
            slideNumber = slideNumberFromElement(found);
        } while (!slideNumber && height > 0);
        return slideNumber;
    }

    //
    // Functions that rely on global state
    //
    // NOTE: Event state is serialisable and !== Story Slides state.
    //       The state object is { slideNumber }
    function popState(event) {
        debug('popState(): hl:', window.history.length, 'event.state:', event.state);
        handlePopOrLoad(event.state);
    }
    // TODO: Presumably we will only be given states that came from our origin.
    function handlePopOrLoad(historyState) {
        debug('handlePopOrLoad(): hl:', window.history.length, 'historyState:', historyState);
        if (historyState === null) {
            debug('handlePopOrLoad(): no previous state—activate slide from hash');
            activateSlideFromHash(window.storySlidesState);
        }
        else {
            debug('handlePopOrLoad(): have previous state');
            activateSlide({
                newNumber: historyState.slideNumber,
                state: window.storySlidesState
            });
        }
    }
    //
    // Functions that rely on state
    //
    // NOTE: This function hides the body by way of the visibility property. The
    //       mode-specific functions are expected to restore visibility.
    function switchToMode(state, toMode, startup) {
        debug(`switchToMode(): ${state}`, toMode, startup ? '(startup)' : '(running)');
        if (!startup && getMode() === toMode) {
            throw Error(`Already in ${toMode} mode; not switching.`);
        }
        document.body.style.visibility = 'hidden';
        // Teardown must come before changing style sheets in order to stop the
        // story mode scroll handler from borking.
        if (!startup) {
            if (toMode === 'story') {
                tearDownModeSlides(state);
            }
            else {
                tearDownModeStory();
            }
        }
        setMode(toMode);
        // TODO: If we are starting up, is there a way to avoid calling these style
        //       'change' functions again? The main script only checks whether we
        //       have an existing mode _after_ loading is complete. Maybe if we
        //       solve the focusing thing _and_ the not-needing-to-be-full-loaded
        //       thing follows, we can work around all of this.
        if (toMode === 'story') {
            // TODO: Can we avoid the need for this callback by already using
            //       requestIdleCallback?
            toggleStyleSheetsForMode(toMode, () => {
                setUpModeStory();
                handlePopOrLoad(window.history.state);
            });
        }
        else {
            // TODO: Should we put the slides set-up in a callback as above?
            // TODO: Can we get rid of wait here by using callback?
            toggleStyleSheetsForMode(toMode);
            setUpModeSlides(state, () => handlePopOrLoad(window.history.state));
        }
    }
    function activateSlideFromHash(state) {
        debug(`activateSlideFromHash(): ${state}`);
        if (!window.location.hash) {
            activateSlide({ newNumber: 1, state });
            return;
        }
        // Order of precedence:
        // 1. slide/element-on-the-slide id
        // 2. slide number
        // 3. fall back to first slide
        // NOTE: There shouldn't be an XSS vulnerability here becuase
        //       getElementById() doesn't execute the string.
        const found = document.getElementById(window.location.hash.slice(1));
        if (found) {
            if (found.classList.contains('slide')) {
                activateSlide({
                    hash: window.location.hash,
                    newNumber: Number(found.getAttribute('data-slide-number')),
                    state
                });
            }
            else if (state.startingUp || getMode() === 'slides') {
                // In story mode, the browser will scroll to the element—but we
                // only allow that after we've fully started up, as a slide needs
                // to be activated once in order for the content to be shown.
                //
                // In slides mode, we'll always need to activate the slide.
                const newNumber = slideNumberFromElement(found);
                debug(`Element ${window.location.hash}'s slide is ${newNumber}`);
                activateSlide({
                    hash: window.location.hash,
                    newNumber: newNumber !== null && newNumber !== void 0 ? newNumber : (state.startingUp ? 1 : state.currentSlideNumber),
                    state
                });
            }
            else ;
        }
        else {
            const numberMatch = window.location.hash.match(/^#(\d+)$/);
            const newNumber = numberMatch ? Number(numberMatch[1]) : 0;
            if (newNumber >= 1 && newNumber <= state.numSlides) {
                // TODO: Use state.validate() in the above check
                activateSlide({ newNumber, state });
            }
            else if (state.startingUp) {
                activateSlide({ newNumber: 1, state });
            }
            else {
                // Out of range, or invalid, and we're currently on a slide.
                // The hash has changed by this point, though. Can't delete a
                // history entry; just have to correct the one that was created
                // by the hash change.
                activateSlide({
                    force: true,
                    newNumber: state.currentSlideNumber,
                    state
                });
                // NOTE: If the slide we were on had an ID, it's lost and turned
                //       into the slide number.
                // TODO: Make it so if there's an ID it'll show up?
            }
        }
    }
    function registerClickHandlersAndGlobalEventListeners(state) {
        registerSlidesModeClickHandlers(state);
        window.addEventListener('popstate', popState);
        document.getElementById('story-slides-button-go').addEventListener('click', () => showOrToggleDialog('go', true));
        document.getElementById('story-slides-button-keys').addEventListener('click', () => showOrToggleDialog('keys', true));
        document.getElementById('story-slides-button-menu').addEventListener('click', () => showOrToggleDialog('menu'));
        document.getElementById('story-slides-button-mode-slides').addEventListener('click', () => switchToMode(state, 'slides'));
        document.getElementById('story-slides-button-mode-story').addEventListener('click', () => switchToMode(state, 'story'));
    }
    //
    // Functions that do not rely on state
    //
    // NOTE: Afterwards updateActiveSlide() must be called.
    function activateSlide(options) {
        const mode = getMode();
        if (!mode || mode === 'story') {
            activateSlideInStoryMode(options);
        }
        else {
            activateSlideInSlidesMode(options);
        }
    }
    function toggleStyleSheetsForMode(mode, callback) {
        for (const styleSheet of document.styleSheets) {
            if (styleSheet.href) {
                const name = baseName(styleSheet.href);
                const sheetMode = name.endsWith('.story.css') ? 'story'
                    : name.endsWith('.slides.css') ? 'slides'
                        : null;
                if (sheetMode)
                    styleSheet.disabled = sheetMode !== mode;
            }
        }
        document.documentElement.className = `mode-${mode}`; // support transitions
        if (callback)
            window.requestIdleCallback(callback);
    }
    // TODO test - what about local file access in other browsers?
    function baseName(href) {
        return href.split('/').pop();
    }

    const verticalPositions = ['top', 'middle', 'bottom'];
    const horizontalPositions = [
        'left', 'position-left',
        'centre', 'position-centre', 'center', 'position-center',
        'right', 'position-right'
    ];
    const verticalAndHorizontalPositions = [...verticalPositions, ...horizontalPositions];
    //
    //
    // Utilities
    //
    //
    function hasTextSiblings(element) {
        let test = element;
        while (test.previousSibling) {
            test = test.previousSibling;
            if (test.nodeType === Node.TEXT_NODE &&
                test.nodeValue.trim())
                return true;
        }
        test = element;
        while (test.nextSibling) {
            test = test.nextSibling;
            if (test.nodeType === Node.TEXT_NODE &&
                test.nodeValue.trim())
                return true;
        }
        return false;
    }
    const numNonStoryElements = (elements) => elements.filter(element => !element.classList.contains('story')).length;
    function addToMovedClasses(element, className, direction) {
        var _a;
        const attr = 'data-classes-propagated-from-' +
            (direction === 'down' ? 'above' : 'below');
        element.setAttribute(attr, ((_a = element.getAttribute(attr)) !== null && _a !== void 0 ? _a : '') +
            (element.getAttribute(attr) ? ' ' : '') + className);
    }
    // TODO: fix this one as with adding the parens above, too
    function addToRemovedClasses(element, className) {
        var _a;
        element.setAttribute('data-classes-moved-up', (_a = element.getAttribute('data-classes-moved-up')) !== null && _a !== void 0 ? _a : '' +
            (element.getAttribute('data-classes-moved-up') ? ' ' : '') + className);
    }
    //
    //
    // Injecting the UI
    //
    //
    // NOTE: Only this and processContent() below are exported for use (as opposed
    //       to just for testing).
    function injectUI(fixture, preSlide, postSlide, screens, announcer) {
        // Main content wraps the top UI, slides and bottom UI
        const mainContent = document.createElement('div');
        mainContent.id = 'story-slides-main-content';
        mainContent.hidden = true;
        const dummyTopUI = document.createElement('div'); // extra layer
        dummyTopUI.innerHTML = preSlide;
        const slidesContainer = document.createElement('div');
        slidesContainer.id = 'story-slides-slides-container';
        // Bringing all children over brings <script>s too; that'll be fixed later.
        while (fixture.childNodes.length > 0) {
            slidesContainer.appendChild(fixture.childNodes[0]);
        }
        const dummyBottomUI = document.createElement('div'); // extra layer
        dummyBottomUI.innerHTML = postSlide;
        // The dialogs and announcer follow, outside the main content container
        const dummyMainUI = document.createElement('div'); // extra layer
        dummyMainUI.innerHTML = screens;
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
    //
    //
    // Contet processing tasks
    //
    //
    //
    // Add padding around slide contents
    //
    // It's assumed most slides will want to have some padding around their
    // contents, but ths can't be done simply by adding padding to the slides
    // themselves, as then full-background effects like splits won't work.
    //
    // Therefore we wrap each of the elements contained directly within the slide
    // in another <div>, to which we apply the padding.
    //
    // Refer to the comments in slides.css for more info.
    //
    // NOTE 1: This assumes that if you have a <figure> acting as a slide, you don't
    //         want any padding.
    //
    // NOTE 2: If this is a heading slide that directly contains text, wrap that
    //         text so that it doesn't get treated as a collection of flex items
    //         (which it would, if there were elements such as <span>s or <code>s
    //         mixed in with the text).
    function makePaddingWrappers(slides) {
        var _a;
        const padSlides = Array.from(slides).filter(slide => slide.tagName !== 'FIGURE' &&
            !slide.classList.contains('no-padding') ||
            // NOTE: need this next one becuase we have to pad the flexboxes
            horizontalPositions.some(pos => slide.classList.contains(pos)));
        for (const slide of padSlides) {
            if (slide.tagName.match(/H[1-6]/)) {
                const firstTextNode = (_a = Array.from(slide.childNodes).filter(node => node.nodeType === Node.TEXT_NODE)[0].nodeValue) === null || _a === void 0 ? void 0 : _a.trim();
                if (firstTextNode) {
                    const wrapper = document.createElement('DIV');
                    while (slide.childNodes.length > 0) {
                        wrapper.appendChild(slide.childNodes[0]);
                    }
                    slide.appendChild(wrapper);
                }
            }
            const elements = Array.from(slide.children).filter(element => window.getComputedStyle(element).position !== 'absolute');
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (!element.classList.contains('story')) {
                    const wrapper = document.createElement('DIV');
                    if (!slide.classList.contains('no-padding')) {
                        const classes = [];
                        classes.push('slide-padding-wrapper');
                        if (i === 0)
                            classes.push('slide-padding-wrapper-first');
                        if (i < elements.length - 1 || i > 0)
                            classes.push('slide-padding-wrapper-middle');
                        if (i === elements.length - 1)
                            classes.push('slide-padding-wrapper-last');
                        wrapper.classList.add(...classes);
                    }
                    element.parentElement.insertBefore(wrapper, element);
                    wrapper.appendChild(element);
                }
            }
        }
    }
    //
    // Split slide layouts
    //
    // If the author wants the space in the slide split equally between all
    // children, they can specify an empty 'data-split' attribute. If they want
    // more control, they can give a list of percentages for the sizes of the
    // vertical sections OR a list of '*' (greedy) or '-' (non-greedy) characters.
    //
    // Percentages and greedy/non-greedy size specifiers can't be mixed.
    //
    // Split sections are given the CSS classes `slide-part` `part-<number>` and
    // also `part-(even|odd)` as appropriate.
    //
    // NOTE: Splitting is done after creating padding wrappers (if applicable). In
    //       order to not create extra layers of redundant wrapper <div>s, this
    //       will add the various split part classes to a wrapper if it exists
    //       (otherwise it creates a <div> for the split part).
    function doSplits(slidesContainer) {
        const containers = slidesContainer.querySelectorAll('[data-split]');
        let allOK = true;
        for (const container of containers) {
            // TODO: remove the array.from bit?
            const elements = Array.from(container.children);
            if (elements.length === 1) {
                error('Split container', container, 'has only one child - no split is necessary.');
                allOK = false;
                continue;
            }
            const splitSizes = hasStrictDataBoolean(container, 'split')
                ? []
                : container.dataset.split.split(' ');
            const percentages = splitSizes.length > 0
                ? checkSplitSizesAndCreateFlexBases(container, numNonStoryElements(elements), splitSizes)
                : [];
            if (percentages) {
                processSplitContainer(container, percentages, elements);
            }
            else {
                allOK = false;
            }
        }
        return allOK;
    }
    function checkSplitSizesAndCreateFlexBases(container, numNonStoryElements, splitSizes) {
        // We expect either:
        //
        //  - A list of percentages (each ending with %)
        //  - A list of either '*' (greedy) or '-' (non-greedy) characters
        //
        // The case of the empty list was handled before we were called.
        if (splitSizes.length !== numNonStoryElements) {
            error('Unexpected number of split sizes given for split container. Was expecting', numNonStoryElements, 'but got', splitSizes.length, 'for', container);
            return null;
        }
        const isSizeSpecifiers = splitSizes.every(value => value === '*' || value === '-');
        if (isSizeSpecifiers) {
            return splitSizes.map(value => value === '*' ? '100%' : '0%');
        }
        let sum = 0;
        const isPercentages = splitSizes.every(value => {
            const gotNum = Number(value.slice(0, -1));
            if (gotNum) {
                sum += gotNum;
                return true;
            }
            return false;
        });
        if (!isPercentages) {
            error('Given data-split value is not a valid list of size specifiers nor percentages:', splitSizes, 'for', container);
            return null;
        }
        if (sum !== 100) {
            error("Given data-split percentages don't add up to 100:", splitSizes, 'for', container);
            return null;
        }
        return splitSizes;
    }
    // FIXME: Ensure percentage flex basis values are strict, i.e. no growing nor
    //        shrinking. Do that in CSS only?
    function processSplitContainer(container, flexBases, elements) {
        let counter = 0;
        for (const child of elements) { // don't iterate over live collection
            if (!child.classList.contains('story')) {
                // Create a flexbox with author-requested height. If we already
                // have a padding wrapper, we re-use that (adding the class to make
                // sure it's a flexbox).
                const splitCounter = counter + 1;
                const box = child.classList.contains('slide-padding-wrapper') ?
                    child : document.createElement('DIV');
                const parity = splitCounter % 2 ? 'odd' : 'even';
                box.classList.add(`part-${splitCounter}`, `part-${parity}`, 'slide-part');
                if (flexBases.length > 0) {
                    const basis = flexBases[counter];
                    box.style.flexBasis = basis;
                    if (basis !== '0%' && basis !== '100%') {
                        box.style.flexShrink = '0';
                    }
                }
                if (box !== child)
                    box.appendChild(child);
                container.appendChild(box); // retain order even if not creating one
                counter++;
            }
            else {
                // Story mode content is invisible in slides mode and mustn't
                // affect the layout, but the DOM order does need to be preserved,
                // so it makes sense in story mode.
                container.appendChild(child);
            }
        }
    }
    //
    // Explicitly numbering slides
    //
    // This removes the need for e.g. story mode scroll handler to search for a
    // slide's number.
    function giveSlidesExplicitNumbers(slides) {
        for (let i = 0; i < slides.length; i++) {
            slides[i].setAttribute('data-slide-number', String(i + 1));
        }
    }
    //
    // Making slides programatically focusable
    //
    // On Chrome, switching to story mode always puts focus on the button at the
    // top, even if we try to focus the slide we want to visit (using the 'add
    // tabindex, focus, remove tabindex' approach). This addresses that issue.
    function makeSlidesProgrammaticallyFocusable(slides) {
        for (const slide of slides) {
            slide.setAttribute('tabindex', '-1');
        }
    }
    //
    // Handling line breaks
    //
    // Line breaks may be used in slides mode, but not desired in story mode (e.g.
    // when breaking up a heading across lines). Thus we go through and replace <br
    // class="slides"> with <span class="story"> </span><br class="slides">
    function fettleLineBreaks(slidesContainer) {
        const slideModeLineBreaks = slidesContainer.querySelectorAll('br.slides');
        for (const lineBreak of slideModeLineBreaks) {
            const lineBreakSpace = document.createElement('span');
            lineBreakSpace.classList.add('story');
            lineBreakSpace.textContent = ' ';
            lineBreak.parentElement.insertBefore(lineBreakSpace, lineBreak);
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
            if (hasStrictDataBoolean(slide, 'pause')) {
                makeDirectlyContainedElementsPausable(slide);
            }
            for (const thing of slide.querySelectorAll('[data-pause]')) {
                // FIXME: this results in <p data-pause>text</p> becoming
                //        <p data-pause><span><span>text</span></span></p>
                if (thing.children.length === 0) {
                    wrapChildTextNodesInSpans(thing);
                }
                makeDirectlyContainedElementsPausable(thing);
            }
        }
    }
    function makeDirectlyContainedElementsPausable(thing) {
        for (const step of thing.children) {
            // If this step contains only one element, and _that_ element has
            // [data-pause] too, then we shouldn't make this one pausable, as it'll
            // end up with a double-pause.
            // There's a special case when the element contains a contentful text
            // node, as well as something else (such as when a list item contains
            // only some text and a nested list). In which case, the text node
            // should be wrapped in a <span>.
            wrapChildTextNodesInSpans(step);
            // TODO: Are there cases where this would break stuff?
            const containsOnePausableThing = step.children.length === 1 &&
                hasStrictDataBoolean(step.children[0], 'pause');
            if (!step.classList.contains('story') && !containsOnePausableThing) {
                step.setAttribute('data-story-slides-step', '');
            }
        }
    }
    function wrapChildTextNodesInSpans(element) {
        for (const node of Array.from(element.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
                const span = document.createElement('SPAN');
                // TODO: Check logic of the ! at the end of here
                span.appendChild(document.createTextNode(node.nodeValue));
                element.replaceChild(span, node);
            }
        }
    }
    //
    // Propagate classes
    //
    // FIXME: doc
    function propagateClasses(slidesContainer) {
        // NOTE: The makeSlidePart parameter  is needed because we _have_ to create
        //       wrappers for parts, becuase the part may be e.g. a heading that
        //       directly contains text, no other items.
        function propagateDown(query, properties, makeSlidePart) {
            for (const box of slidesContainer.querySelectorAll(query)) {
                if (box.classList.contains('story'))
                    continue;
                for (const property of properties) {
                    if (box.classList.contains(property)) {
                        for (const child of box.children) {
                            if (child.classList.contains('story'))
                                continue;
                            const classes = [property];
                            if (makeSlidePart &&
                                !child.classList.contains('slide-part')) {
                                classes.push('slide-part', 'no-part-padding');
                            }
                            child.classList.add(...classes);
                            addToMovedClasses(child, property, 'down');
                        }
                    }
                }
            }
        }
        propagateDown('.slide, [data-split]', verticalAndHorizontalPositions, true);
        propagateDown('[data-split]', ['no-part-padding'], false);
        function propagateUpAndRemove(query, properties, makeSlidePart, override) {
            for (const contained of slidesContainer.querySelectorAll(query)) {
                let propagated = false;
                for (const property of properties) {
                    if (contained.classList.contains(property)) {
                        if (override) {
                            properties.forEach(override => contained.parentElement.classList.remove(override));
                        }
                        contained.parentElement.classList.add(property);
                        addToMovedClasses(contained.parentElement, property, 'up');
                        contained.classList.remove(property);
                        addToRemovedClasses(contained, property);
                        if (contained.classList.length === 0) {
                            contained.removeAttribute('class');
                        }
                        propagated = true;
                        if (propagated && verticalPositions.includes(property)) {
                            // FIXME: THIS IS NOT TRUE; SOMETIMES IT CLASHES LIKE
                            //        ON THE OUTRO SLIDE.
                            // This won't clash with an existing split amount
                            // because it wasn't an explicit split part.
                            // TODO: neater check, when resolved why it clashes.
                            if (contained.parentElement.style.flexBasis === '') {
                                contained.parentElement.style.flexBasis = '100%';
                            }
                        }
                    }
                }
                if (propagated && makeSlidePart) {
                    if (!contained.parentElement.classList.contains('slide-part')) {
                        contained.parentElement.classList.add('slide-part', 'no-part-padding');
                    }
                }
            }
        }
        propagateUpAndRemove('.slide-padding-wrapper > *', verticalPositions, true, true);
        propagateUpAndRemove('.slide-padding-wrapper > *', horizontalPositions, true, true);
        propagateUpAndRemove('.slide-part > *', ['no-part-padding', 'no-split-padding'], false, false);
    }
    //
    // Constrain image sizes for easier slides mode layout
    //
    // FIXME: doc
    //
    // FIXME: make it work with horizontal image wrappers
    //
    // Setting overflow other than visible addresses this:
    //
    //  * https://stackoverflow.com/a/36231105/1485308
    //  * https://stackoverflow.com/a/49675259/1485308
    //
    // FIXME: support natural size in story mode? How about providing classes that
    //        cause it to set the image size to 50 75 100 vw/h?
    function constrainImages(slidesContainer) {
        // FIXME: doc .inline-images
        for (const image of slidesContainer.querySelectorAll('.inline-images img')) {
            image.classList.add('really-inline', 'natural-size');
        }
        for (const image of document.getElementsByTagName('IMG')) {
            // Check if the image is meant to be inline (block is the default)
            if (!image.parentElement.classList.contains('slide') &&
                hasTextSiblings(image)) {
                image.classList.add('really-inline', 'natural-size');
                continue;
            }
            const { definedWidth, definedHeight } = definedDimensions(image);
            if (definedWidth || definedHeight) {
                if (definedWidth)
                    image.classList.add('no-expand-height');
                if (definedHeight)
                    image.classList.add('no-expand-width');
            }
            // FIXME: images with height-xx or width-xx classes shouldn't have the
            //        function applied? What about images with height-xx, they
            //        still get expanded horizontally? Should that be stopped in
            //        code or CSS?
            if (!image.classList.contains('natural-size')
                && !(definedWidth || definedHeight)) {
                setUpImageSizing(image);
            }
        }
        // Images to be sized naturally need to know their intrinsic width
        for (const image of slidesContainer.querySelectorAll('img.really-inline, img.natural-size')) {
            // TODO: Use attr(width)?
            // Don't set the unit here as it breaks the CSS calculation
            image.style.setProperty('--width-px', String(image.width));
        }
    }
    // By default, images are made as large as possible. This requires that the
    // image's containers are sized appropriately.
    //
    // However, we can't just have all of the containers above being 100% height
    // and/or flexboxes as required, because if the image is actually sized to be a
    // specific number of pixels and that's less than the slide's height, having
    // all the containers be 100% will leave gaps around the image.
    //
    // We also try to be minimal with respect to adding extra flex boxes or
    // adjusting heights of existing blocks.
    //
    // If the author sets the "non-greedy-height" class on an image, then it won't
    // try to expand to fill all space, and neither should its containers.
    function setUpImageSizing(image) {
        // TODO: check for width not being 100% too
        const expandImage = window.getComputedStyle(image).height === '100%';
        const path = [];
        // Find all elements that contain the image, not including the slide
        let found = image;
        while (!found.parentElement.classList.contains('slide')) {
            found = found.parentElement;
            path.push(found);
        }
        if (path.length) {
            // The image's most distant ancestral container is a flex-item, as it's
            // directly contained in the slide.
            const furthest = path.pop();
            if (expandImage) {
                furthest.classList.add('grow-flex-item');
                if (path.length)
                    furthest.classList.add('grow-block');
            }
            // TODO: This needlessly adds the "grow-block" class to inline elements.
            const topDownPath = path.reverse();
            for (const element of topDownPath) {
                if (element.children.length > 1) {
                    element.classList.add('img-container');
                    // NOTE: This makes it so we have to be explicit (e.g. with the
                    //       "non-greedy-height" class) when we don't want the
                    //       image to grab all available vertical space.
                    if (expandImage && !element.classList.contains('horizontal')) {
                        element.classList.add('grow-block');
                    }
                }
                else if (expandImage) {
                    if (element.parentElement.classList.contains('slide-part') ||
                        element.parentElement.classList.contains('img-container')) {
                        element.classList.add('grow-flex-item');
                    }
                    element.classList.add('grow-block');
                }
            }
        }
    }
    function definedDimensions(image) {
        const result = { definedWidth: false, definedHeight: false };
        for (const klass of image.classList) {
            if (klass.startsWith('width-'))
                result.definedWidth = true;
            if (klass.startsWith('height-'))
                result.definedHeight = true;
        }
        return result;
    }
    //
    // Wrap tables for story mode
    //
    function wrapTablesForStoryMode(slidesContainer) {
        for (const table of slidesContainer.querySelectorAll('table')) {
            const wrapper = document.createElement('DIV');
            wrapper.className = 'table-wrapper';
            table.parentElement.insertBefore(wrapper, table);
            wrapper.appendChild(table);
            // This is needed if the wrapper is a flex item and the table isn't
            // being shown in either mode.
            for (const mode of ['story', 'slides']) {
                if (table.classList.contains(mode)) {
                    wrapper.classList.add(mode);
                }
            }
        }
    }
    //
    // Main entry point
    //
    function processContent(slidesContainer, slides) {
        makePaddingWrappers(slides);
        const doSplitsResult = doSplits(slidesContainer);
        giveSlidesExplicitNumbers(slides);
        makeSlidesProgrammaticallyFocusable(slides);
        fettleLineBreaks(slidesContainer);
        preparePauses(slides);
        propagateClasses(slidesContainer);
        constrainImages(slidesContainer);
        wrapTablesForStoryMode(slidesContainer);
        return doSplitsResult;
    }

    // NOTE: checking for overflowing slide content is done when a slide is shown,
    // as it requires the layout to be known. Therefore that check is done in
    // slides mode.
    // NOTE: Only exported for testing
    function checkDOMValidSlideElements(slides) {
        const allowedTagNames = new Set(['DIV', 'SECTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL']);
        const tagNameValidity = slides.map(slide => {
            if (!allowedTagNames.has(slide.tagName)) {
                error(`Slide made out of element '${slide.tagName}' is not supported. Must be one of:`, allowedTagNames);
                return false;
            }
            return true;
        });
        return tagNameValidity.every(result => result === true);
    }
    // NOTE: Only exported for testing
    function checkDOMSlideContainment(slides) {
        const container = document.getElementById('story-slides-slides-container');
        if (slides.length !== container.children.length) {
            // FIXME: Better wording
            error("The number of children of the slides container isn't the same "
                + 'as the number of slides. This could be due to putting story '
                + 'mode content outside of slides, having some slides outside of '
                + 'the slides contianer, or having other non-slide elements inside '
                + 'the container.');
            return false;
        }
        return true;
    }
    function checkSlidesModeSettings() {
        const slideAspectRaw = window.getComputedStyle(document.documentElement)
            .getPropertyValue('--slide-aspect-ratio');
        const aspectOK = checkGivenAspect(slideAspectRaw);
        const rootFontSizePercent = window.getComputedStyle(document.documentElement)
            .getPropertyValue('--slide-font-height-percent-of-slide');
        const fontSizeOK = checkGivenFontSize(rootFontSizePercent);
        return aspectOK && fontSizeOK;
    }
    // NOTE: Only exported for testing
    function checkGivenAspect(aspect) {
        if (!aspect) {
            error('Slide aspect ratio not given in CSS custom property --slide-aspect-ratio');
            return false;
        }
        const matches = aspect.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
        if (!(matches === null || matches === void 0 ? void 0 : matches[1]) || !(matches === null || matches === void 0 ? void 0 : matches[2])) {
            error('Slide aspect ratio not given in expected format "calc( x / y )"');
            return false;
        }
        return true;
    }
    // NOTE: Only exported for testing
    function checkGivenFontSize(size) {
        if (!size) {
            error('Font size not given in CSS custom property --slide-font-height-percent-of-slide');
            return false;
        }
        const convertedSize = Number(size);
        return !isNaN(convertedSize);
    }
    // Checks that are done on the DOM and can therefore be done in any mode
    function lintDOM(slides) {
        return checkDOMValidSlideElements(slides) &&
            checkDOMSlideContainment(slides);
    }
    // Checks that must be done with slides mode CSS active
    function lintSlides() {
        // TODO check for the padding variables - or provide defaults via internal
        //      names in the theme instead?
        return checkSlidesModeSettings();
    }

    class State {
        constructor() {
            this._previousSlideNumber = null; // 1-based to match how we call slides
            this._currentSlideNumber = null; // 1-based to match how we call slides
            this._slides = Array.from(document.getElementsByClassName('slide'));
            this._slidesContainer = document.getElementById('story-slides-slides-container');
            this._contentAndUI = document.getElementById('story-slides-main-content');
            this._initialTitle = document.title;
        }
        get startingUp() {
            return this._currentSlideNumber === null ? true : false;
        }
        get previousSlideNumber() {
            if (this._previousSlideNumber === null) {
                throw Error('previous slide is null');
            }
            return this._previousSlideNumber;
        }
        set previousSlideNumber(newNumber) {
            this.validateNumber(newNumber);
            this._previousSlideNumber = newNumber;
        }
        get currentSlideNumber() {
            if (this._currentSlideNumber === null) {
                throw Error('current slide is null');
            }
            return this._currentSlideNumber;
        }
        set currentSlideNumber(newNumber) {
            this.validateNumber(newNumber);
            this._currentSlideNumber = newNumber;
        }
        slide(number) {
            this.validateNumber(number);
            return this._slides[number - 1];
        }
        get rawSlides() {
            if (this._currentSlideNumber === null) {
                return this._slides;
            }
            throw Error('rawSlides must only be accessed during start-up');
        }
        get numSlides() {
            return this._slides.length;
        }
        get currentSlide() {
            if (this._currentSlideNumber === null) {
                throw Error('current slide is null');
            }
            return this._slides[this._currentSlideNumber - 1];
        }
        get slidesContainer() {
            return this._slidesContainer;
        }
        get initialTitle() {
            return this._initialTitle;
        }
        get contentAndUI() {
            return this._contentAndUI;
        }
        validateNumber(number) {
            if (!(number >= 1 && number <= this._slides.length)) {
                throw Error(`Given slide number ${number} is out of bounds.`);
            }
        }
        toString() {
            return `<${this._currentSlideNumber} of ${this.numSlides} "${this._initialTitle}" p:${this._previousSlideNumber}>`;
        }
    }

    var uiAnnouncer = "<div id=\"story-slides-announcer\" role=\"log\" aria-live=\"assertive\" class=\"visually-hidden\"></div>\n";

    var uiScreens = "<div class=\"story-slides-ui\">\n\t<div id=\"story-slides-screen-errors\" hidden>\n\t\t<h1>Content errors detected</h1>\n\t\t<p>An error, or errors, were detected in your presentation's content&mdash;open the browser console for more info.</p>\n\t</div>\n\n\t<div id=\"story-slides-screen-intro\" hidden>\n\t\t<h1 id=\"story-slides-screen-intro-heading\"></h1>\n\t\t<fieldset>\n\t\t\t<legend>Read presentation as&hellip;</legend>\n\t\t\t<div id=\"story-slides-grid\">\n\t\t\t\t<h2>Story</h2>\n\t\t\t\t<div id=\"story-slides-desc-story\">\n\t\t\t\t\t<p>The real content of a talk is often not in the slides, but in what's said around them. Story mode shows you not only what was projected, but the explanation behind it too.</p>\n\t\t\t\t</div>\n\t\t\t\t<button id=\"story-slides-choose-story\" aria-describedby=\"story-slides-desc-story\">Story (recommended)</button>\n\n\t\t\t\t<h2>Slides</h2>\n\t\t\t\t<div id=\"story-slides-desc-slides\">\n\t\t\t\t\t<p>Slides mode shows you just the slides as presented.</p>\n\t\t\t\t</div>\n\t\t\t\t<button id=\"story-slides-choose-slides\" aria-describedby=\"story-slides-desc-slides story-slides-desc-help\">Slides</button>\n\t\t\t</div>\n\t\t</fieldset>\n\t</div>\n\n\t<!-- FIXME: VoiceOver (Mac) says \"StorySlides mode keyboard shortcuts\" -->\n\t<div id=\"story-slides-dialog-keys\" role=\"dialog\" tabindex=\"-1\" aria-labelledby=\"story-slides-dialog-keys-heading\" class=\"story-slides-dialog\" hidden>\n\t\t<button class=\"close\" aria-label=\"Close\">&#x2715;</button>\n\t\t<h1 id=\"story-slides-dialog-keys-heading\"><span class=\"story\">Story</span><span class=\"slides\">Slides</span> <span class=\"wide\">mode </span>help</h1>\n\t\t<details>\n\t\t\t<summary>Accessibility information</summary>\n\t\t\t<p class=\"story\">If you're using a screen reader, story mode can be navigated like any web page (with browse mode/the virtual cursor turned on).</p>\n\t\t\t<p><span class=\"story\">However</span><span class=\"slides\">If you're using a screen reader</span>, please disable browse mode/the virtual cursor when in slides mode, so that you can use the <span class=\"story\">provided</span> shortcut keys<span class=\"slides\"> below</span> to navigate.<span class=\"story\"> Those keys are displayed when first entering slides mode (they're different to the story mode keys below).</span></p>\n\t\t\t<details>\n\t\t\t\t<summary>Default keys to toggle browse mode/the virtual cursor</summary>\n\t\t\t\t<dl>\n\t\t\t\t\t<dt>JAWS</dt>\n\t\t\t\t\t<dd>Press <kbd>Insert</kbd> plus <kbd>Z</kbd></dd>\n\t\t\t\t\t<dt>NVDA</dt>\n\t\t\t\t\t<dd>Press the NVDA key plus <kbd>Space</kbd> (the NVDA key is usually <kbd>Insert</kbd> or <kbd>Caps Lock</kbd>).</dd>\n\t\t\t\t\t<dt>VoiceOver (Mac)</dt>\n\t\t\t\t\t<dd>Ensure <em>Quick Nav</em> is turned off. Press both <kbd>Left</kbd> and <kbd>Right</kbd> arrow keys together to toggle <em>Quick Nav</em>.</dd>\n\t\t\t\t</dl>\n\t\t\t</details>\n\t\t\t<p><span class=\"story\">In slides mode, the</span><span class=\"slides\">The</span> contents of slides will be announced as they appear. On slides with complex content, such as tables, you can always switch back to browse mode/use the virtual cursor to navigate that content.</p>\n\t\t\t<p class=\"slides\">Story mode can be navigated like any web page, with browse mode/the virtual cursor turned on, so you can easily move around.</p>\n\t\t</details>\n\t\t<p class=\"slides have-touch\">\n\t\t\t<span>&#x261E;</span>\n\t\t\t<span>Tap near the left or right edge of the screen to move to the previous or next slide. If you have a keyboard attached, you can use the following shortcuts.</span>\n\t\t</p>\n\t\t<table>\n\t\t\t<caption><span class=\"story\">Story</span><span class=\"slides\">Slides</span> mode keyboard shortcuts</caption>\n\t\t\t<thead>\n\t\t\t\t<tr>\n\t\t\t\t\t<th><p>Key</p></th>\n\t\t\t\t\t<th><p>Action</p></th>\n\t\t\t\t</tr>\n\t\t\t</thead>\n\t\t\t<tbody>\n\t\t\t\t<tr class=\"slides\">\n\t\t\t\t\t<th scope=\"row\"><kbd>S</kbd></th>\n\t\t\t\t\t<td><p>Switch to story mode.</p></td>\n\t\t\t\t</tr>\n\t\t\t\t<tr class=\"slides\">\n\t\t\t\t\t<th scope=\"row\"><kbd>F</kbd></th>\n\t\t\t\t\t<td><p>Toggle full-screen slide view<span class=\"mobile-assumed\"> (not supported on iPhone)</span>.</p></td>\n\t\t\t\t</tr>\n\t\t\t\t<tr>\n\t\t\t\t\t<th scope=\"row\"><span class=\"story\"><kbd>Alt</kbd>+</span><kbd>G</kbd></th>\n\t\t\t\t\t<td><p>Go to<span class=\"story\"> the story behind a</span> slide by number (opens a dialog).</p></td>\n\t\t\t\t</tr>\n\t\t\t\t<tr>\n\t\t\t\t\t<th scope=\"row\"><kbd>Escape</kbd></th>\n\t\t\t\t\t<td>\n\t\t\t\t\t\t<p>Close an open dialog.</p>\n\t\t\t\t\t\t<p class=\"story\">If no dialog is open, go to slides mode.</p>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>\n\t\t\t\t<tr class=\"slides\">\n\t\t\t\t\t<th scope=\"row\"><kbd>P</kbd></th>\n\t\t\t\t\t<td><p>If you're running a screen reader, announce the current slide progress as a percentage, followed by the current slide number and the total number of slides.</p></td>\n\t\t\t\t</tr>\n\t\t\t\t<tr>\n\t\t\t\t\t<th scope=\"row\"><kbd aria-hidden=\"true\">?</kbd><span class=\"visually-hidden\">question mark</span><span class=\"slides\"> <kbd>H</kbd></span></th>\n\t\t\t\t\t<td><p>Show this dialog.</p></td>\n\t\t\t\t</tr>\n\t\t\t\t<tr>\n\t\t\t\t\t<th scope=\"row\"><span class=\"story\"><kbd>Alt</kbd>+</span><kbd>M</kbd></th>\n\t\t\t\t\t<td><p>Open the presentation's menu, which lets you access features via buttons instead of keyboard shortcuts.</p></td>\n\t\t\t\t</tr>\n\t\t\t\t<tr class=\"slides\">\n\t\t\t\t\t<th scope=\"row\"><kbd>&rarr;</kbd> <kbd>&darr;</kbd> <kbd>Page&nbsp;Down</kbd></th>\n\t\t\t\t\t<td>\n\t\t\t\t\t\t<p>Next slide.</p>\n\t\t\t\t\t\t<p>To prevent flashing, transitions are rate-limited. To rapidly move between slides, use the &quot;go&quot; feature.</p>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>\n\t\t\t\t<tr class=\"slides\">\n\t\t\t\t\t<th scope=\"row\"><kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>Page&nbsp;Up</kbd></th>\n\t\t\t\t\t<td>\n\t\t\t\t\t\t<p>Previous slide.</p>\n\t\t\t\t\t\t<p>To prevent flashing, transitions are rate-limited. To rapidly move between slides, use the &quot;go&quot; feature.</p>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>\n\t\t\t</tbody>\n\t\t</table>\n\t</div>\n\n\t<div id=\"story-slides-dialog-go\" role=\"dialog\" tabindex=\"-1\" aria-labelledby=\"story-slides-dialog-go-heading\" class=\"story-slides-dialog\" hidden>\n\t\t<button class=\"close\" aria-label=\"Close\">&#x2715;</button>\n\t\t<h1 id=\"story-slides-dialog-go-heading\">Go</h1>\n\t\t<form id=\"story-slides-go-form\">\n\t\t\t<label for=\"story-slides-go-input\">Go to<span class=\"story\"> the story for</span> slide:</label>\n\t\t\t<input id=\"story-slides-go-input\" aria-describedby=\"story-slides-go-description\">\n\t\t\t<p id=\"story-slides-go-description\">Current: <span id=\"story-slides-slide-current\"></span> of <span id=\"story-slides-slide-last\"></span></p>\n\t\t\t<div class=\"confirm-buttons\">\n\t\t\t\t<button type=\"submit\">Go</button>\n\t\t\t</div>\n\t\t</form>\n\t</div>\n\n\t<div id=\"story-slides-dialog-menu\" role=\"dialog\" tabindex=\"-1\" aria-labelledby=\"story-slides-dialog-menu-heading\" class=\"story-slides-dialog\" hidden>\n\t\t<button class=\"close\" aria-label=\"Close\">&#x2715;</button>\n\t\t<h1 id=\"story-slides-dialog-menu-heading\"><span class=\"story\">Story</span><span class=\"slides\">Slides</span> mode</h1>\n\t\t<div class=\"menu\">\n\t\t\t<button id=\"story-slides-button-keys\">\n\t\t\t\tHelp<span class=\"slides have-touch\">, gestures and shortcut&nbsp;keys</span><span class=\"story-or-no-touch-slides\"> and shortcut keys</span>\n\t\t\t</button>\n\t\t\t<button id=\"story-slides-button-go\">Go</button>\n\t\t\t<button class=\"slides\" id=\"story-slides-button-fullscreen\">Toggle full-screen</button>\n\t\t\t<button class=\"story\" id=\"story-slides-button-mode-slides\" aria-describedby=\"story-slides-mode-slides-explainer\">Switch to slides mode</button>\n\t\t\t<button class=\"slides\" id=\"story-slides-button-mode-story\" aria-describedby=\"story-slides-mode-story-explainer\">Switch to story mode</button>\n\t\t</div>\n\t\t<p class=\"story\" id=\"story-slides-mode-slides-explainer\">Slides mode displays each slide one at a time, as they would be projected for the audience. The extra information present in story mode is not displayed.</p>\n\t\t<p class=\"slides\" id=\"story-slides-mode-story-explainer\">Story mode allows you to read the presentation as a document, rather than a collection of separate slides, and includes extra background information.</p>\n\t</div>\n</div>\n";

    var uiSlideAfter = "<div class=\"story-slides-ui slides\">\n\t<button class=\"have-touch\" id=\"story-slides-button-next\" aria-label=\"Next\"><span>&rarr;</span></button>\n\t<div id=\"story-slides-progress\"><div></div></div>\n</div>\n";

    var uiSlideBefore = "<div class=\"story-slides-ui\">\n\t<button class=\"story-or-mobile-assumed\" id=\"story-slides-button-menu\" aria-label=\"Menu\">&#x2630;</button>\n\t<button class=\"slides have-touch\" id=\"story-slides-button-previous\" aria-label=\"Previous\"><span>&larr;</span></button>\n</div>\n";

    // Story Slides overall things that need addressing
    if (!window.requestIdleCallback) {
        window.requestIdleCallback = function (callback) {
            setTimeout(callback, 500);
            return 42;
        };
    }
    function main() {
        debug('starting...');
        // Let the legacy script know it doesn't need to do anything
        document.documentElement.setAttribute('data-story-slides-is-running', '');
        injectUI(document.body, uiSlideBefore, uiSlideAfter, uiScreens, uiAnnouncer);
        initDialogsWithActivateSlidesFunc(activateSlide);
        initMakeKeyHandlerModeSlides(switchToMode);
        initMakeKeyHandlerModeStory(switchToMode);
        window.storySlidesState = new State();
        // Do all checks and DOM processing in slides mode, as the processing,
        // particularly image sizing, needs window.getComputedStyle()...
        // FIXME: is that true about getComputedStyle()?
        freezeBackground();
        toggleStyleSheetsForMode('slides');
        const lintSlidesResult = lintSlides();
        const lintDOMResult = lintDOM(window.storySlidesState.rawSlides);
        const doSplitsResult = processContent(window.storySlidesState.slidesContainer, window.storySlidesState.rawSlides);
        // TODO: Re-combine lint checks
        const lintResult = lintSlidesResult && lintDOMResult && doSplitsResult;
        const previousMode = getMode();
        if (!lintResult || !previousMode || previousMode === 'story') {
            toggleStyleSheetsForMode('story');
        }
        unFreezeBackgroundAndShowBody();
        if (lintResult) {
            startUp(window.storySlidesState, previousMode);
        }
        else {
            document.getElementById('story-slides-screen-errors').hidden = false;
        }
    }
    // TODO: Need getComputedStyle()?
    function freezeBackground() {
        const backgroundColour = window.getComputedStyle(document.documentElement)
            .getPropertyValue('--background-colour');
        const backgroundColor = window.getComputedStyle(document.documentElement)
            .getPropertyValue('--background-color');
        const colour = backgroundColour !== null && backgroundColour !== void 0 ? backgroundColour : backgroundColor;
        document.documentElement.style.setProperty('--background-colour', colour);
    }
    function unFreezeBackgroundAndShowBody() {
        document.documentElement.style.removeProperty('--background-colour');
        document.body.style.display = 'block';
    }
    function startUp(state, previousMode) {
        debug('linting successful; starting up; previousMode:', previousMode);
        if (previousMode) {
            // FIXME: try putting a wait here; no body content should be shown
            //        because the body is still empty.
            startUpInMode(state, previousMode);
        }
        else {
            document.getElementById('story-slides-screen-intro-heading').innerText = state.initialTitle;
            document.getElementById('story-slides-choose-story').addEventListener('click', () => startUpInMode(state, 'story'));
            document.getElementById('story-slides-choose-slides').addEventListener('click', () => startUpInMode(state, 'slides'));
            document.getElementById('story-slides-screen-intro').hidden = false;
        }
    }
    function startUpInMode(state, mode) {
        registerClickHandlersAndGlobalEventListeners(state);
        document.getElementById('story-slides-screen-intro').remove();
        state.contentAndUI.hidden = false;
        // FIXME: try putting a wait here; think flash could, in theory, be caused.
        switchToMode(state, mode, true);
        debug('ready');
    }
    main();

})();
