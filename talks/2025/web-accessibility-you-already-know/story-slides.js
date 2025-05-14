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

Copyright © 2019-2023 Matthew Tylee Atkinson

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

"use strict";
(() => {
  // src/code/utils.ts
  var modes = ["story", "slides"];
  var storageKeyMode = window.location.pathname + ".mode";
  var debug = window.console.debug.bind(window.console.debug, "Story Slides:");
  var error = window.console.error.bind(window.console.error, "Story Slides:");
  function hasStrictDataBoolean(element, attrName) {
    return element.getAttribute("data-" + attrName) === "";
  }
  function getMode() {
    const saved = window.sessionStorage.getItem(storageKeyMode);
    const mode = modes.find((value) => value === saved);
    if (mode)
      return mode;
    return null;
  }
  var setMode = (mode) => window.sessionStorage.setItem(storageKeyMode, mode);
  function debugOptionsToString(options) {
    const debug2 = [];
    for (const key of Object.keys(options)) {
      debug2.push(`${key}: ${options[key]}`);
    }
    return debug2.join("; ");
  }
  function slideNumberFromElement(element) {
    const isSlide = (candidate) => candidate.classList.contains("slide");
    let found = element;
    while (found !== document.body && !isSlide(found)) {
      found = found.parentElement;
    }
    if (found === document.body)
      return null;
    return Number(found.getAttribute("data-slide-number"));
  }
  function progressPercent(currentSlideNumber, numberOfSlides) {
    return Math.round(currentSlideNumber / numberOfSlides * 100);
  }
  function updateActiveSlide(presentation, options) {
    debug("updateActiveSlide():", debugOptionsToString(options));
    const progress = document.querySelector("#story-slides-progress > div");
    if (progress) {
      const percent = progressPercent(options.newNumber, presentation.numberOfSlides);
      progress.style.width = `${Math.round(percent)}%`;
    }
    const hash = options.hash ?? `#${options.newNumber}`;
    document.title = `Slide ${options.newNumber} - ${presentation.initialTitle}`;
    if (window.history.state) {
      if (window.history.state.slideNumber === options.newNumber) {
        if (options.force) {
          debug("forced to update same-slide history entry");
          window.history.replaceState(
            { slideNumber: options.newNumber },
            document.title,
            hash
          );
        } else {
          debug("not adding same slide to history");
        }
      } else {
        debug("existing history.state: adding new entry");
        const state = {
          slideNumber: options.newNumber
        };
        window.history.pushState(state, document.title, hash);
      }
    } else {
      debug("no history.state: updating entry");
      window.history.replaceState(
        { slideNumber: options.newNumber },
        document.title,
        hash
      );
    }
    if (!presentation.isStartingUp) {
      debug("setting previous slide number to", presentation.currentSlideNumber);
      presentation.previousSlideNumber = presentation.currentSlideNumber;
    }
    debug("setting current slide number to", options.newNumber);
    presentation.currentSlideNumber = options.newNumber;
    presentation.slideWasChanged();
  }

  // src/code/content-processing.ts
  var verticalPositions = ["top", "middle", "bottom"];
  var horizontalPositions = [
    "left",
    "position-left",
    "centre",
    "position-centre",
    "center",
    "position-center",
    "right",
    "position-right"
  ];
  var verticalAndHorizontalPositions = [...verticalPositions, ...horizontalPositions];
  function hasTextSiblings(element) {
    let test = element;
    while (test.previousSibling) {
      test = test.previousSibling;
      if (test.nodeType === Node.TEXT_NODE && test.nodeValue.trim())
        return true;
    }
    test = element;
    while (test.nextSibling) {
      test = test.nextSibling;
      if (test.nodeType === Node.TEXT_NODE && test.nodeValue.trim())
        return true;
    }
    return false;
  }
  var numNonStoryElements = (elements) => elements.filter(
    (element) => !element.classList.contains("story")
  ).length;
  function addToMovedClasses(element, className, direction) {
    const attr = "data-classes-propagated-from-" + (direction === "down" ? "above" : "below");
    element.setAttribute(attr, (element.getAttribute(attr) ?? "") + (element.getAttribute(attr) ? " " : "") + className);
  }
  function addToRemovedClasses(element, className) {
    element.setAttribute(
      "data-classes-moved-up",
      element.getAttribute("data-classes-moved-up") ?? (element.getAttribute("data-classes-moved-up") ? " " : "") + className
    );
  }
  function injectUI(fixture, preSlide, postSlide, screens, announcer, overflow2) {
    const mainContent = document.createElement("div");
    mainContent.id = "story-slides-main-content";
    mainContent.hidden = true;
    const dummyTopUI = document.createElement("div");
    dummyTopUI.innerHTML = preSlide;
    const slidesContainer = document.createElement("div");
    slidesContainer.id = "story-slides-slides-container";
    while (fixture.childNodes.length > 0) {
      slidesContainer.appendChild(fixture.childNodes[0]);
    }
    const dummyBottomUI = document.createElement("div");
    dummyBottomUI.innerHTML = postSlide;
    const dummyMainUI = document.createElement("div");
    dummyMainUI.innerHTML = screens;
    const dummyAnnouncer = document.createElement("div");
    dummyAnnouncer.innerHTML = announcer;
    mainContent.appendChild(dummyTopUI.children[0]);
    mainContent.appendChild(slidesContainer);
    mainContent.appendChild(dummyBottomUI.children[0]);
    fixture.appendChild(mainContent);
    fixture.appendChild(dummyMainUI.children[0]);
    fixture.appendChild(dummyAnnouncer.children[0]);
    if (overflow2) {
      const dummyOverflowIndicator = document.createElement("div");
      dummyOverflowIndicator.innerHTML = overflow2;
      fixture.appendChild(dummyOverflowIndicator.children[0]);
    }
    for (const script of fixture.querySelectorAll("script")) {
      fixture.appendChild(script);
    }
  }
  function makePaddingWrappers(slides2) {
    const padSlides = Array.from(slides2).filter((slide) => slide.tagName !== "FIGURE" && !slide.classList.contains("no-padding") || // NOTE: need this next one becuase we have to pad the flexboxes
    horizontalPositions.some((pos) => slide.classList.contains(pos)));
    for (const slide of padSlides) {
      if (slide.tagName.match(/H[1-6]/)) {
        const firstTextNode = Array.from(slide.childNodes).filter(
          (node) => node.nodeType === Node.TEXT_NODE
        )[0].nodeValue?.trim();
        if (firstTextNode) {
          const wrapper = document.createElement("DIV");
          while (slide.childNodes.length > 0) {
            wrapper.appendChild(slide.childNodes[0]);
          }
          slide.appendChild(wrapper);
        }
      }
      const elements = Array.from(slide.children).filter((element) => window.getComputedStyle(element).position !== "absolute");
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element.classList.contains("story")) {
          const wrapper = document.createElement("DIV");
          if (!slide.classList.contains("no-padding")) {
            const classes = [];
            classes.push("slide-padding-wrapper");
            if (i === 0)
              classes.push("slide-padding-wrapper-first");
            if (i < elements.length - 1 || i > 0)
              classes.push("slide-padding-wrapper-middle");
            if (i === elements.length - 1)
              classes.push("slide-padding-wrapper-last");
            wrapper.classList.add(...classes);
          }
          element.parentElement.insertBefore(wrapper, element);
          wrapper.appendChild(element);
        }
      }
    }
  }
  function doSplits(slidesContainer) {
    const containers = slidesContainer.querySelectorAll("[data-split]");
    let allOK = true;
    for (const container of containers) {
      const elements = Array.from(container.children);
      if (elements.length === 1) {
        error("Split container", container, "has only one child - no split is necessary.");
        allOK = false;
        continue;
      }
      const splitSizes = hasStrictDataBoolean(container, "split") ? [] : container.dataset.split.split(" ");
      const percentages = splitSizes.length > 0 ? checkSplitSizesAndCreateFlexBases(
        container,
        numNonStoryElements(elements),
        splitSizes
      ) : [];
      if (percentages) {
        processSplitContainer(container, percentages, elements);
      } else {
        allOK = false;
      }
    }
    return allOK;
  }
  function checkSplitSizesAndCreateFlexBases(container, numNonStoryElements2, splitSizes) {
    if (splitSizes.length !== numNonStoryElements2) {
      error("Unexpected number of split sizes given for split container. Was expecting", numNonStoryElements2, "but got", splitSizes.length, "for", container);
      return null;
    }
    const isSizeSpecifiers = splitSizes.every(
      (value) => value === "*" || value === "-"
    );
    if (isSizeSpecifiers) {
      return splitSizes.map((value) => value === "*" ? "100%" : "0%");
    }
    let sum = 0;
    const isPercentages = splitSizes.every((value) => {
      const gotNum = Number(value.slice(0, -1));
      if (gotNum) {
        sum += gotNum;
        return true;
      }
      return false;
    });
    if (!isPercentages) {
      error("Given data-split value is not a valid list of size specifiers nor percentages:", splitSizes, "for", container);
      return null;
    }
    if (sum !== 100) {
      error("Given data-split percentages don't add up to 100:", splitSizes, "for", container);
      return null;
    }
    return splitSizes;
  }
  function processSplitContainer(container, flexBases, elements) {
    let counter = 0;
    for (const child of elements) {
      if (!child.classList.contains("story")) {
        const splitCounter = counter + 1;
        const box = child.classList.contains("slide-padding-wrapper") ? child : document.createElement("DIV");
        const parity = splitCounter % 2 ? "odd" : "even";
        box.classList.add(
          `part-${splitCounter}`,
          `part-${parity}`,
          "slide-part"
        );
        if (flexBases.length > 0) {
          const basis = flexBases[counter];
          box.style.flexBasis = basis;
          if (basis !== "0%" && basis !== "100%") {
            box.style.flexShrink = "0";
          }
        }
        if (box !== child)
          box.appendChild(child);
        container.appendChild(box);
        counter++;
      } else {
        container.appendChild(child);
      }
    }
  }
  function giveSlidesExplicitNumbers(slides2) {
    for (let i = 0; i < slides2.length; i++) {
      slides2[i].setAttribute("data-slide-number", String(i + 1));
    }
  }
  function makeSlidesProgrammaticallyFocusable(slides2) {
    for (const slide of slides2) {
      slide.setAttribute("tabindex", "-1");
    }
  }
  function fettleLineBreaks(slidesContainer) {
    const slideModeLineBreaks = slidesContainer.querySelectorAll("br.slides");
    for (const lineBreak of slideModeLineBreaks) {
      const lineBreakSpace = document.createElement("span");
      lineBreakSpace.classList.add("story");
      lineBreakSpace.textContent = " ";
      lineBreak.parentElement.insertBefore(lineBreakSpace, lineBreak);
    }
  }
  function preparePauses(slides2) {
    for (const slide of slides2) {
      if (hasStrictDataBoolean(slide, "pause")) {
        makeDirectlyContainedElementsPausable(slide);
      }
      for (const thing of slide.querySelectorAll("[data-pause]")) {
        if (thing.children.length === 0) {
          wrapChildTextNodesInSpans(thing);
        }
        makeDirectlyContainedElementsPausable(thing);
      }
    }
  }
  function makeDirectlyContainedElementsPausable(thing) {
    for (const step of thing.children) {
      wrapChildTextNodesInSpans(step);
      const containsOnePausableThing = step.children.length === 1 && hasStrictDataBoolean(step.children[0], "pause");
      if (!step.classList.contains("story") && !containsOnePausableThing) {
        step.setAttribute("data-story-slides-step", "");
      }
    }
  }
  function wrapChildTextNodesInSpans(element) {
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
        const span = document.createElement("SPAN");
        span.appendChild(document.createTextNode(node.nodeValue));
        element.replaceChild(span, node);
      }
    }
  }
  function propagateDown(slidesContainer, query, properties, makeSlidePart) {
    for (const box of slidesContainer.querySelectorAll(query)) {
      if (box.classList.contains("story"))
        continue;
      for (const property of properties) {
        if (box.classList.contains(property)) {
          for (const child of box.children) {
            if (child.classList.contains("story"))
              continue;
            const classes = [property];
            if (makeSlidePart && !child.classList.contains("slide-part")) {
              classes.push("slide-part", "no-part-padding");
            }
            child.classList.add(...classes);
            addToMovedClasses(child, property, "down");
          }
        }
      }
    }
  }
  function propagateUpAndRemove(slidesContainer, query, properties, makeSlidePart, override) {
    for (const contained of slidesContainer.querySelectorAll(query)) {
      let propagated = false;
      for (const property of properties) {
        if (contained.classList.contains(property)) {
          if (override) {
            properties.forEach((override2) => contained.parentElement.classList.remove(override2));
          }
          contained.parentElement.classList.add(property);
          addToMovedClasses(contained.parentElement, property, "up");
          contained.classList.remove(property);
          addToRemovedClasses(contained, property);
          if (contained.classList.length === 0) {
            contained.removeAttribute("class");
          }
          propagated = true;
          if (propagated && verticalPositions.includes(property)) {
            if (contained.parentElement.style.flexBasis === "") {
              contained.parentElement.style.flexBasis = "100%";
            }
          }
        }
      }
      if (propagated && makeSlidePart) {
        if (!contained.parentElement.classList.contains("slide-part")) {
          contained.parentElement.classList.add(
            "slide-part",
            "no-part-padding"
          );
        }
      }
    }
  }
  function propagateClasses(slidesContainer) {
    propagateDown(slidesContainer, ".slide, [data-split]", verticalAndHorizontalPositions, true);
    propagateDown(slidesContainer, "[data-split]", ["no-part-padding"], false);
    propagateUpAndRemove(slidesContainer, ".slide-padding-wrapper > *", verticalPositions, true, true);
    propagateUpAndRemove(slidesContainer, ".slide-padding-wrapper > *", horizontalPositions, true, true);
    propagateUpAndRemove(slidesContainer, ".slide-part > *", ["no-part-padding", "no-split-padding"], false, false);
  }
  function constrainImages(slidesContainer) {
    for (const image of slidesContainer.querySelectorAll(".inline-images img")) {
      image.classList.add("really-inline", "natural-size");
    }
    for (const image of document.getElementsByTagName("IMG")) {
      if (!image.parentElement.classList.contains("slide") && hasTextSiblings(image)) {
        image.classList.add("really-inline", "natural-size");
        continue;
      }
      const { definedWidth, definedHeight } = definedDimensions(image);
      if (definedWidth || definedHeight) {
        if (definedWidth)
          image.classList.add("no-expand-height");
        if (definedHeight)
          image.classList.add("no-expand-width");
      }
      if (!image.classList.contains("natural-size") && !(definedWidth || definedHeight)) {
        setUpImageSizing(image);
      }
    }
    for (const image of slidesContainer.querySelectorAll("img.really-inline, img.natural-size")) {
      image.style.setProperty("--width-px", String(image.width));
    }
  }
  function setUpImageSizing(image) {
    const expandImage = window.getComputedStyle(image).height === "100%";
    const path = [];
    let found = image;
    while (!found.parentElement.classList.contains("slide")) {
      found = found.parentElement;
      path.push(found);
    }
    if (path.length) {
      const furthest = path.pop();
      if (expandImage) {
        furthest.classList.add("grow-flex-item");
        if (path.length)
          furthest.classList.add("grow-block");
      }
      const topDownPath = path.reverse();
      for (const element of topDownPath) {
        if (element.children.length > 1) {
          element.classList.add("img-container");
          if (expandImage && !element.classList.contains("horizontal")) {
            element.classList.add("grow-block");
          }
        } else if (expandImage) {
          if (element.parentElement.classList.contains("slide-part") || element.parentElement.classList.contains("img-container")) {
            element.classList.add("grow-flex-item");
          }
          element.classList.add("grow-block");
        }
      }
    }
  }
  function definedDimensions(image) {
    const result = { definedWidth: false, definedHeight: false };
    for (const klass of image.classList) {
      if (klass.startsWith("width-"))
        result.definedWidth = true;
      if (klass.startsWith("height-"))
        result.definedHeight = true;
    }
    return result;
  }
  function wrapTablesForStoryMode(slidesContainer) {
    for (const table of slidesContainer.querySelectorAll("table")) {
      const wrapper = document.createElement("DIV");
      wrapper.className = "table-wrapper";
      table.parentElement.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      for (const mode of ["story", "slides"]) {
        if (table.classList.contains(mode)) {
          wrapper.classList.add(mode);
        }
      }
    }
  }
  function processContent(slidesContainer, slides2) {
    makePaddingWrappers(slides2);
    const doSplitsResult = doSplits(slidesContainer);
    giveSlidesExplicitNumbers(slides2);
    makeSlidesProgrammaticallyFocusable(slides2);
    fettleLineBreaks(slidesContainer);
    preparePauses(slides2);
    propagateClasses(slidesContainer);
    constrainImages(slidesContainer);
    wrapTablesForStoryMode(slidesContainer);
    return doSplitsResult;
  }

  // src/code/linting.ts
  function checkDOMValidSlideElements(slides2) {
    const allowedTagNames = /* @__PURE__ */ new Set(["DIV", "SECTION", "FIGURE", "H1", "H2", "H3", "H4", "H5", "H6", "OL", "UL"]);
    const tagNameValidity = slides2.map((slide) => {
      if (!allowedTagNames.has(slide.tagName)) {
        error(`Slide made out of element '${slide.tagName}' is not supported. Must be one of:`, allowedTagNames);
        return false;
      }
      return true;
    });
    return tagNameValidity.every((result) => result === true);
  }
  function checkDOMSlideContainment(slides2) {
    const container = document.getElementById("story-slides-slides-container");
    if (slides2.length !== container.children.length) {
      error("The number of children of the slides container isn't the same as the number of slides. This could be due to putting story mode content outside of slides, having some slides outside of the slides contianer, or having other non-slide elements inside the container.");
      return false;
    }
    return true;
  }
  function checkSlidesModeSettings() {
    const slideAspectRaw = window.getComputedStyle(document.documentElement).getPropertyValue("--slide-aspect-ratio");
    const aspectOK = checkGivenAspect(slideAspectRaw);
    const rootFontSizePercent = window.getComputedStyle(document.documentElement).getPropertyValue("--slide-font-height-percent-of-slide");
    const fontSizeOK = checkGivenFontSize(rootFontSizePercent);
    return aspectOK && fontSizeOK;
  }
  function checkGivenAspect(aspect) {
    if (!aspect) {
      error("Slide aspect ratio not given in CSS custom property --slide-aspect-ratio");
      return false;
    }
    const matches = aspect.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
    if (!matches?.[1] || !matches?.[2]) {
      error('Slide aspect ratio not given in expected format "calc( x / y )"');
      return false;
    }
    return true;
  }
  function checkGivenFontSize(size) {
    if (!size) {
      error("Font size not given in CSS custom property --slide-font-height-percent-of-slide");
      return false;
    }
    const convertedSize = Number(size);
    return !isNaN(convertedSize);
  }
  function lintDOM(slides2) {
    return checkDOMValidSlideElements(slides2) && checkDOMSlideContainment(slides2);
  }
  function lintSlides() {
    return checkSlidesModeSettings();
  }

  // src/code/dialog.ts
  var _presentation;
  var currentlyOpenDialog = null;
  var codeToRun = null;
  var previousActiveElement = null;
  var setRunAfterClosingDialog = (run) => codeToRun = run;
  var isDialogOpen = () => currentlyOpenDialog !== null;
  function runCodeAfterClosingDialog() {
    if (codeToRun) {
      codeToRun();
      codeToRun = null;
    }
  }
  var nonDialogContent;
  var dialogKeys;
  var dialogMenu;
  var dialogGo;
  function makeGoSubmitHandler(presentation) {
    return function goSubmitHandler(event) {
      event.preventDefault();
      const number = Number(document.getElementById(
        "story-slides-go-input"
      ).value);
      if (number > 0 && number <= presentation.numberOfSlides) {
        if (number !== presentation.currentSlideNumber) {
          hideOpenDialog(false);
          presentation.activateSlide(number);
        } else {
          previousActiveElement = presentation.currentSlide;
          hideOpenDialog();
        }
      } else {
        hideOpenDialog();
      }
    };
  }
  function getDialog(name) {
    const map = {
      "go": dialogGo,
      "keys": dialogKeys,
      "menu": dialogMenu
    };
    if (!Object.keys(map).includes(name)) {
      throw Error(`Invalid dialog '${name}'`);
    }
    return map[name];
  }
  function showOrToggleDialog(name, replaceExistingDialog = false) {
    if (currentlyOpenDialog && !replaceExistingDialog) {
      throw Error("showOrToggleDialog(): A dialog is open");
    }
    if (!currentlyOpenDialog && replaceExistingDialog) {
      throw Error("showOrToggleDialog(): No dialog is open");
    }
    if (!replaceExistingDialog) {
      previousActiveElement = document.activeElement;
    } else {
      currentlyOpenDialog.hidden = true;
    }
    const dialog2 = getDialog(name);
    if (name === "go") {
      document.getElementById("story-slides-slide-last").innerText = String(_presentation.numberOfSlides);
      document.getElementById("story-slides-slide-current").innerText = String(_presentation.currentSlideNumber);
    }
    document.body.style.overflow = "hidden";
    dialog2.scrollTop = 0;
    dialog2.hidden = false;
    nonDialogContent.setAttribute("inert", "");
    nonDialogContent.setAttribute("aria-hidden", "true");
    currentlyOpenDialog = dialog2;
    if (name !== "go") {
      dialog2.focus();
    } else {
      document.getElementById("story-slides-go-input").focus();
    }
  }
  function hideOpenDialog(restoreFocus = true) {
    if (!currentlyOpenDialog)
      throw Error("No dialog is open");
    currentlyOpenDialog.hidden = true;
    if (currentlyOpenDialog === dialogGo) {
      document.getElementById("story-slides-go-input").value = "";
    } else if (currentlyOpenDialog === dialogKeys) {
      document.querySelectorAll("details").forEach(
        (details) => details.removeAttribute("open")
      );
    }
    document.body.style.overflow = "";
    nonDialogContent.removeAttribute("inert");
    nonDialogContent.removeAttribute("aria-hidden");
    if (restoreFocus === true) {
      (function(element) {
        setTimeout(function() {
          if (window.getComputedStyle(element).display === "none") {
            document.body.focus();
          } else {
            element.focus();
          }
        }, 0);
      })(previousActiveElement);
    }
    previousActiveElement = null;
    currentlyOpenDialog = null;
    runCodeAfterClosingDialog();
  }
  var dialog = (presentation) => {
    presentation.addEventListener("starting-up", () => {
      debug("was initDialogsWithActivateSlidesFunc()");
      _presentation = presentation;
      nonDialogContent = document.getElementById("story-slides-main-content");
      dialogKeys = document.getElementById("story-slides-dialog-keys");
      dialogMenu = document.getElementById("story-slides-dialog-menu");
      dialogGo = document.getElementById("story-slides-dialog-go");
      const buttons = document.querySelectorAll(".story-slides-ui button.close");
      for (const button of buttons) {
        button.addEventListener("click", () => hideOpenDialog());
      }
      document.getElementById("story-slides-go-form").addEventListener(
        "submit",
        makeGoSubmitHandler(presentation)
      );
      const onMac = navigator.userAgent.indexOf("Mac") > -1;
      if (onMac) {
        for (const kbd of dialogKeys.getElementsByTagName("kbd")) {
          if (kbd.innerText === "Alt")
            kbd.innerText = "Option";
        }
      }
    });
  };

  // src/code/slides.ts
  var HELP_SHOWN = window.location.pathname + ".story-slides-help-shown";
  var ANNOUNCE_REMOVE_DELAY = 1e3;
  var KEY_HANDLER_THROTTLE = 500;
  var SLIDE_SETTLE_DELAY = 1e3;
  var keyHandlerModeSlides;
  function setUpModeSlides(presentation, showSlide) {
    if (!keyHandlerModeSlides)
      throw Error("No slides mode key handler set");
    window.addEventListener("resize", slidesViewportHandler);
    slidesViewportHandler();
    presentation.slidesContainer.setAttribute("aria-live", "assertive");
    document.body.style.visibility = "visible";
    function registerKeyHandlerAndRunCode() {
      setTimeout(() => {
        showSlide();
        setTimeout(() => {
          document.addEventListener("keydown", keyHandlerModeSlides);
        }, KEY_HANDLER_THROTTLE);
      }, SLIDE_SETTLE_DELAY);
    }
    if (window.sessionStorage.getItem(HELP_SHOWN) !== "yes") {
      setRunAfterClosingDialog(registerKeyHandlerAndRunCode);
      showOrToggleDialog("keys");
      window.sessionStorage.setItem(HELP_SHOWN, "yes");
    } else {
      registerKeyHandlerAndRunCode();
    }
  }
  function tearDownModeSlides(presentation) {
    if (!keyHandlerModeSlides)
      throw Error("No slides mode key handler set");
    presentation.currentSlide.classList.remove("active");
    if (screenfull.isEnabled) {
      screenfull.exit();
    }
    if (isDialogOpen())
      hideOpenDialog();
    document.removeEventListener("keydown", keyHandlerModeSlides);
    window.removeEventListener("resize", slidesViewportHandler);
    presentation.slidesContainer.removeAttribute("aria-live");
  }
  function moveToPreviousSlide(presentation) {
    const num = previousSlideNumber(presentation.numberOfSlides, presentation.currentSlideNumber);
    activateSlideInSlidesMode(presentation, { newNumber: num });
  }
  function revealStepOrMoveToNextSlide(presentation) {
    if (revealStepAndCheckIfReadyForNextSlide(presentation.currentSlide)) {
      const num = nextSlideNumber(presentation.numberOfSlides, presentation.currentSlideNumber);
      if (num !== null) {
        activateSlideInSlidesMode(presentation, { newNumber: num });
      }
    }
  }
  function activateSlideInSlidesMode(presentation, options) {
    debug("activateSlideInSlidesMode():", debugOptionsToString(options));
    const { newNumber } = options;
    if (!presentation.isStartingUp) {
      presentation.currentSlide.classList.remove("active");
    }
    presentation.slide(newNumber).classList.add("active");
    updateActiveSlide(presentation, options);
  }
  function slidesViewportHandler() {
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = document.documentElement.clientHeight;
    const viewAspect = viewWidth / viewHeight;
    const slideAspectRaw = window.getComputedStyle(document.documentElement).getPropertyValue("--slide-aspect-ratio");
    const matches = slideAspectRaw.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
    const slideAspect = Number(matches[1]) / Number(matches[2]);
    let slideHeight = null;
    let slideWidth = null;
    if (viewAspect >= slideAspect) {
      slideHeight = viewHeight;
      slideWidth = viewHeight * slideAspect;
    } else {
      slideWidth = viewWidth;
      slideHeight = viewWidth / slideAspect;
    }
    document.documentElement.style.setProperty("--computed-slide-height", slideHeight + "px");
    document.documentElement.style.setProperty("--computed-slide-width", slideWidth + "px");
    const verticalMargin = (window.innerHeight - slideHeight) / 2;
    const horizontalMargin = (window.innerWidth - slideWidth) / 2;
    document.documentElement.style.setProperty(
      "--computed-vertical-margin",
      (verticalMargin > 0 ? verticalMargin : 0) + "px"
    );
    document.documentElement.style.setProperty(
      "--computed-horizontal-margin",
      (horizontalMargin > 0 ? horizontalMargin : 0) + "px"
    );
    const rootFontSizePercent = Number(
      window.getComputedStyle(document.documentElement).getPropertyValue("--slide-font-height-percent-of-slide")
    );
    const realRootFontSize = slideHeight * (rootFontSizePercent / 100);
    document.documentElement.style.setProperty("--computed-base-font-size", realRootFontSize + "px");
  }
  function toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    } else {
      window.alert("fullscreen mode is not available");
    }
  }
  function revealStepAndCheckIfReadyForNextSlide(slide) {
    const nextHiddenThing = slide.querySelector("[data-story-slides-step]");
    if (nextHiddenThing) {
      nextHiddenThing.removeAttribute("data-story-slides-step");
      return false;
    }
    return true;
  }
  var last = performance.now();
  function throttle(callback) {
    return function(event) {
      const now = performance.now();
      if (now > last + KEY_HANDLER_THROTTLE) {
        last = now;
        callback(event);
      }
    };
  }
  function announce(text) {
    const announcer = document.getElementById("story-slides-announcer");
    debug(`announcing '${text}'`);
    announcer.innerText = text;
    setTimeout(() => announcer.innerText = "", ANNOUNCE_REMOVE_DELAY);
  }
  function previousSlideNumber(numSlides, currentNumber) {
    return currentNumber > 1 ? currentNumber - 1 : numSlides;
  }
  function nextSlideNumber(numSlides, currentNumber) {
    return currentNumber % numSlides + 1;
  }
  var slides = (presentation) => {
    presentation.addEventListener("starting-up", () => {
      debug("was registerSlidesModeClickAndFullscreenHandlers()");
      if (screenfull.isEnabled) {
        document.getElementById("story-slides-button-fullscreen").addEventListener("click", () => {
          if (isDialogOpen())
            hideOpenDialog();
          toggleFullscreen();
        });
      } else {
        document.getElementById("story-slides-button-fullscreen").remove();
      }
      document.getElementById("story-slides-button-next").addEventListener(
        "click",
        () => revealStepOrMoveToNextSlide(presentation)
      );
      document.getElementById("story-slides-button-previous").addEventListener(
        "click",
        () => moveToPreviousSlide(presentation)
      );
      debug("was initMakeKeyHandlerModeSlides()");
      function theActualKeyHandler(event) {
        if (event.isComposing || event.keyCode === 229)
          return;
        if (event.ctrlKey || event.metaKey)
          return;
        switch (event.key) {
          case "ArrowLeft":
          case "ArrowUp":
          case "PageUp":
            if (!isDialogOpen())
              moveToPreviousSlide(presentation);
            break;
          case "ArrowRight":
          case "ArrowDown":
          case "PageDown":
            if (!isDialogOpen()) {
              revealStepOrMoveToNextSlide(presentation);
            }
            break;
          case "f":
            if (!isDialogOpen())
              toggleFullscreen();
            break;
          case "s":
            if (!isDialogOpen()) {
              presentation.switchToModeStory();
            }
            break;
          case "g":
            if (!isDialogOpen()) {
              event.preventDefault();
              showOrToggleDialog("go");
            }
            break;
          case "?":
          case "h":
            if (!isDialogOpen())
              showOrToggleDialog("keys");
            break;
          case "Escape":
            if (isDialogOpen()) {
              hideOpenDialog();
            }
            break;
          case "p":
            if (!isDialogOpen()) {
              const current = presentation.currentSlideNumber;
              const total = presentation.numberOfSlides;
              const percent = progressPercent(current, total);
              announce(`${percent}%, slide ${current} of ${total}`);
            }
            break;
          case "m":
            if (!isDialogOpen())
              showOrToggleDialog("menu");
        }
      }
      if (window.storySlidesNoThrottle) {
        keyHandlerModeSlides = theActualKeyHandler;
      } else {
        keyHandlerModeSlides = throttle(theActualKeyHandler);
      }
    });
  };

  // src/code/story.ts
  var storyModeScrollTimeout;
  var scrollCameFromMe = false;
  var keyHandlerModeStory;
  var realStoryModeScrollHandler;
  function activateSlideInStoryMode(presentation, options) {
    debug("activateSlideInStoryMode():", debugOptionsToString(options));
    const { newNumber } = options;
    if (!options.triggeredByScroll) {
      scrollCameFromMe = true;
      if (newNumber === 1) {
        if (window.pageYOffset > 0) {
          window.scrollTo(0, 0);
        } else {
          scrollCameFromMe = false;
        }
        window.requestIdleCallback(() => {
          document.body.style.visibility = "visible";
          presentation.slide(newNumber).focus({ preventScroll: true });
        });
      } else {
        window.requestIdleCallback(() => {
          presentation.slide(newNumber).scrollIntoView(true);
          window.requestIdleCallback(() => {
            document.body.style.visibility = "visible";
            presentation.slide(newNumber).focus({ preventScroll: true });
          });
        });
      }
    }
    updateActiveSlide(presentation, options);
  }
  function setUpModeStory() {
    if (!keyHandlerModeStory)
      throw Error("No story mode key handler set");
    document.addEventListener("keydown", keyHandlerModeStory);
    document.addEventListener("scroll", scrollHandlerStoryMode);
  }
  function tearDownModeStory() {
    if (isDialogOpen())
      hideOpenDialog();
    if (!keyHandlerModeStory)
      throw Error("No story mode key handler set");
    document.removeEventListener("keydown", keyHandlerModeStory);
    document.removeEventListener("scroll", scrollHandlerStoryMode);
  }
  function scrollHandlerStoryMode() {
    if (storyModeScrollTimeout)
      clearTimeout(storyModeScrollTimeout);
    storyModeScrollTimeout = setTimeout(realStoryModeScrollHandler, 250);
  }
  function scanForSlideNumber() {
    let height = window.innerHeight / 4;
    let slideNumber = null;
    do {
      height = height - 10;
      const found = document.elementFromPoint(window.innerWidth / 2, height);
      slideNumber = slideNumberFromElement(found);
    } while (!slideNumber && height > 0);
    return slideNumber;
  }
  var story = (presentation) => {
    presentation.addEventListener("starting-up", () => {
      debug("was initMakeKeyHandlerModeStory()");
      keyHandlerModeStory = function(event) {
        if (event.isComposing || event.keyCode === 229)
          return;
        switch (event.key) {
          case "Escape":
            if (isDialogOpen()) {
              if (isDialogOpen())
                hideOpenDialog();
            } else {
              presentation.switchToModeSlides();
            }
            break;
          case "g":
            if (!event.altKey)
              break;
          case "\xA9":
            if (!isDialogOpen()) {
              event.preventDefault();
              showOrToggleDialog("go");
            }
            break;
          case "?":
            if (!isDialogOpen())
              showOrToggleDialog("keys");
            break;
          case "m":
            if (!event.altKey)
              break;
          case "\xB5":
            if (!isDialogOpen())
              showOrToggleDialog("menu");
        }
      };
      realStoryModeScrollHandler = () => {
        if (scrollCameFromMe) {
          scrollCameFromMe = false;
        } else {
          activateSlideInStoryMode(presentation, {
            newNumber: scanForSlideNumber() ?? 1,
            triggeredByScroll: true
          });
        }
      };
    });
  };

  // src/code/shared.ts
  function handlePopOrLoad(presentation, historyState) {
    debug("handlePopOrLoad(): hl:", window.history.length, "historyState:", historyState);
    if (historyState === null) {
      debug("handlePopOrLoad(): no previous state\u2014activate slide from hash");
      activateSlideFromHash(presentation);
    } else {
      debug("handlePopOrLoad(): have previous state");
      activateSlide(presentation, {
        newNumber: historyState.slideNumber
        // state previously pushed
      });
    }
  }
  function activateSlideFromHash(presentation) {
    debug(`activateSlideFromHash(): ${presentation}`);
    if (!window.location.hash) {
      activateSlide(presentation, { newNumber: 1 });
      return;
    }
    const found = document.getElementById(window.location.hash.slice(1));
    if (found) {
      if (found.classList.contains("slide")) {
        activateSlide(presentation, {
          hash: window.location.hash,
          newNumber: Number(found.getAttribute("data-slide-number"))
        });
      } else if (presentation.isStartingUp || getMode() === "slides") {
        const newNumber = slideNumberFromElement(found);
        debug(`Element ${window.location.hash}'s slide is ${newNumber}`);
        activateSlide(presentation, {
          hash: window.location.hash,
          newNumber: newNumber ?? (presentation.isStartingUp ? 1 : presentation.currentSlideNumber)
        });
      } else {
      }
    } else {
      const numberMatch = window.location.hash.match(/^#(\d+)$/);
      const newNumber = numberMatch ? Number(numberMatch[1]) : 0;
      if (newNumber >= 1 && newNumber <= presentation.numberOfSlides) {
        activateSlide(presentation, { newNumber });
      } else if (presentation.isStartingUp) {
        activateSlide(presentation, { newNumber: 1 });
      } else {
        activateSlide(presentation, {
          force: true,
          newNumber: presentation.currentSlideNumber
        });
      }
    }
  }
  function activateSlide(presentation, options) {
    const mode = getMode();
    if (!mode || mode === "story") {
      activateSlideInStoryMode(presentation, options);
    } else {
      activateSlideInSlidesMode(presentation, options);
    }
  }
  function toggleStyleSheetsForMode(mode, callback) {
    for (const styleSheet of document.styleSheets) {
      if (styleSheet.href) {
        const name = baseName(styleSheet.href);
        const sheetMode = name.endsWith(".story.css") ? "story" : name.endsWith(".slides.css") ? "slides" : null;
        if (sheetMode)
          styleSheet.disabled = sheetMode !== mode;
      }
    }
    document.documentElement.className = `mode-${mode}`;
    if (callback)
      window.requestIdleCallback(callback);
  }
  function baseName(href) {
    return href.split("/").pop();
  }
  var shared = (presentation) => {
    presentation.addEventListener("starting-up", () => {
      debug("was registerClickHandlersAndGlobalEventListeners()");
      window.addEventListener("popstate", (event) => {
        handlePopOrLoad(presentation, event.state);
      });
      document.getElementById("story-slides-button-go").addEventListener(
        "click",
        () => showOrToggleDialog("go", true)
      );
      document.getElementById("story-slides-button-keys").addEventListener(
        "click",
        () => showOrToggleDialog("keys", true)
      );
      document.getElementById("story-slides-button-menu").addEventListener(
        "click",
        () => showOrToggleDialog("menu")
      );
      document.getElementById("story-slides-button-mode-slides").addEventListener(
        "click",
        () => presentation.switchToModeSlides()
      );
      document.getElementById("story-slides-button-mode-story").addEventListener(
        "click",
        () => presentation.switchToModeStory()
      );
    });
    presentation.addEventListener("switch-to-mode", (event) => {
      const { mode, startUp } = event.detail;
      debug("switchToMode():", mode, startUp ? "(startup)" : "(running)");
      if (!startUp && getMode() === mode) {
        throw Error(`Already in ${mode} mode; not switching.`);
      }
      document.body.style.visibility = "hidden";
      if (!startUp) {
        if (mode === "story") {
          tearDownModeSlides(presentation);
        } else {
          tearDownModeStory();
        }
      }
      setMode(mode);
      if (mode === "story") {
        toggleStyleSheetsForMode(mode, () => {
          setUpModeStory();
          handlePopOrLoad(presentation, window.history.state);
        });
      } else {
        toggleStyleSheetsForMode(mode);
        setUpModeSlides(
          presentation,
          () => handlePopOrLoad(presentation, window.history.state)
        );
      }
    });
    presentation.addEventListener("activate-slide", (event) => {
      const detail = event.detail;
      debug("on activate-slide: activating:", detail.newNumber);
      activateSlide(presentation, detail);
    });
  };

  // src/ui/announcer.html
  var announcer_default = '<div id="story-slides-announcer" role="log" aria-live="assertive" class="visually-hidden"></div>\n';

  // src/ui/overflow-indicator.html
  var overflow_indicator_default = `<div id="story-slides-overflow-indicator" role="region" aria-label="Overflow checker" class="result-unknown">
	<!-- TODO: make a separate span for the symbol? -->
	<span id="story-slides-overflow-indicator-readout" role="status" aria-live="polite">~</span>
	<details>
		<summary aria-label="Information">i</summary>
		<div>
			<p>This tells you if the current slide's content is overflowing.</p>
			<p><strong>WARNING:</strong> the slide can only be checked as rendered by this browser and operating system. Overflow may occur in other browsers, and on other platforms.</p>
			<p><strong>To remove the overflow indicator:</strong> add a <code>data-no-overflow-check</code> attribute to the <code>&lt;script&gt;</code> element that calls <code>story-slides.js</code>.</p>
		</div>
	</details>
</div>
`;

  // src/ui/screens-dialogs.html
  var screens_dialogs_default = `<div class="story-slides-ui">
	<div id="story-slides-screen-errors" hidden>
		<h1>Content errors detected</h1>
		<p>An error, or errors, were detected in your presentation's content&mdash;open the browser console for more info.</p>
	</div>

	<div id="story-slides-screen-intro" hidden>
		<h1 id="story-slides-screen-intro-heading"></h1>
		<fieldset>
			<legend>Read presentation as&hellip;</legend>
			<div id="story-slides-grid">
				<h2>Story</h2>
				<div id="story-slides-desc-story">
					<p>The real content of a talk is often not in the slides, but in what's said around them. Story mode shows you not only what was projected, but the explanation behind it too.</p>
				</div>
				<button id="story-slides-choose-story" aria-describedby="story-slides-desc-story">Story (recommended)</button>

				<h2>Slides</h2>
				<div id="story-slides-desc-slides">
					<p>Slides mode shows you just the slides as presented.</p>
				</div>
				<button id="story-slides-choose-slides" aria-describedby="story-slides-desc-slides story-slides-desc-help">Slides</button>
			</div>
		</fieldset>
	</div>

	<!-- FIXME: VoiceOver (Mac) says "StorySlides mode keyboard shortcuts" -->
	<div id="story-slides-dialog-keys" role="dialog" tabindex="-1" aria-labelledby="story-slides-dialog-keys-heading" class="story-slides-dialog" hidden>
		<button class="close" aria-label="Close">&#x2715;</button>
		<h1 id="story-slides-dialog-keys-heading"><span class="story">Story</span><span class="slides">Slides</span> <span class="wide">mode </span>help</h1>
		<details>
			<summary>Accessibility information</summary>
			<p class="story">If you're using a screen reader, story mode can be navigated like any web page (with browse mode/the virtual cursor turned on).</p>
			<p><span class="story">However</span><span class="slides">If you're using a screen reader</span>, please disable browse mode/the virtual cursor when in slides mode, so that you can use the <span class="story">provided</span> shortcut keys<span class="slides"> below</span> to navigate.<span class="story"> Those keys are displayed when first entering slides mode (they're different to the story mode keys below).</span></p>
			<details>
				<summary>Default keys to toggle browse mode/the virtual cursor</summary>
				<dl>
					<dt>JAWS</dt>
					<dd>Press <kbd>Insert</kbd> plus <kbd>Z</kbd></dd>
					<dt>NVDA</dt>
					<dd>Press the NVDA key plus <kbd>Space</kbd> (the NVDA key is usually <kbd>Insert</kbd> or <kbd>Caps Lock</kbd>).</dd>
					<dt>VoiceOver (Mac)</dt>
					<dd>Ensure <em>Quick Nav</em> is turned off. Press both <kbd>Left</kbd> and <kbd>Right</kbd> arrow keys together to toggle <em>Quick Nav</em>.</dd>
				</dl>
			</details>
			<p><span class="story">In slides mode, the</span><span class="slides">The</span> contents of slides will be announced as they appear. On slides with complex content, such as tables, you can always switch back to browse mode/use the virtual cursor to navigate that content.</p>
			<p class="slides">Story mode can be navigated like any web page, with browse mode/the virtual cursor turned on, so you can easily move around.</p>
		</details>
		<p class="slides have-touch">
			<span>&#x261E;</span>
			<span>Tap near the left or right edge of the screen to move to the previous or next slide. If you have a keyboard attached, you can use the following shortcuts.</span>
		</p>
		<table>
			<caption><span class="story">Story</span><span class="slides">Slides</span> mode keyboard shortcuts</caption>
			<thead>
				<tr>
					<th><p>Key</p></th>
					<th><p>Action</p></th>
				</tr>
			</thead>
			<tbody>
				<tr class="slides">
					<th scope="row"><kbd>S</kbd></th>
					<td><p>Switch to story mode.</p></td>
				</tr>
				<tr class="slides">
					<th scope="row"><kbd>F</kbd></th>
					<td><p>Toggle full-screen slide view<span class="mobile-assumed"> (not supported on iPhone)</span>.</p></td>
				</tr>
				<tr>
					<th scope="row"><span class="story"><kbd>Alt</kbd>+</span><kbd>G</kbd></th>
					<td><p>Go to<span class="story"> the story behind a</span> slide by number (opens a dialog).</p></td>
				</tr>
				<tr>
					<th scope="row"><kbd>Escape</kbd></th>
					<td>
						<p>Close an open dialog.</p>
						<p class="story">If no dialog is open, go to slides mode.</p>
					</td>
				</tr>
				<tr class="slides">
					<th scope="row"><kbd>P</kbd></th>
					<td><p>If you're running a screen reader, announce the current slide progress as a percentage, followed by the current slide number and the total number of slides.</p></td>
				</tr>
				<tr>
					<th scope="row"><kbd aria-hidden="true">?</kbd><span class="visually-hidden">question mark</span><span class="slides"> <kbd>H</kbd></span></th>
					<td><p>Show this dialog.</p></td>
				</tr>
				<tr>
					<th scope="row"><span class="story"><kbd>Alt</kbd>+</span><kbd>M</kbd></th>
					<td><p>Open the presentation's menu, which lets you access features via buttons instead of keyboard shortcuts.</p></td>
				</tr>
				<tr class="slides">
					<th scope="row"><kbd>&rarr;</kbd> <kbd>&darr;</kbd> <kbd>Page&nbsp;Down</kbd></th>
					<td>
						<p>Next slide.</p>
						<p>To prevent flashing, transitions are rate-limited. To rapidly move between slides, use the &quot;go&quot; feature.</p>
					</td>
				</tr>
				<tr class="slides">
					<th scope="row"><kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>Page&nbsp;Up</kbd></th>
					<td>
						<p>Previous slide.</p>
						<p>To prevent flashing, transitions are rate-limited. To rapidly move between slides, use the &quot;go&quot; feature.</p>
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div id="story-slides-dialog-go" role="dialog" tabindex="-1" aria-labelledby="story-slides-dialog-go-heading" class="story-slides-dialog" hidden>
		<button class="close" aria-label="Close">&#x2715;</button>
		<h1 id="story-slides-dialog-go-heading">Go</h1>
		<form id="story-slides-go-form">
			<label for="story-slides-go-input">Go to<span class="story"> the story for</span> slide:</label>
			<input id="story-slides-go-input" aria-describedby="story-slides-go-description">
			<p id="story-slides-go-description">Current: <span id="story-slides-slide-current"></span> of <span id="story-slides-slide-last"></span></p>
			<div class="confirm-buttons">
				<button type="submit">Go</button>
			</div>
		</form>
	</div>

	<div id="story-slides-dialog-menu" role="dialog" tabindex="-1" aria-labelledby="story-slides-dialog-menu-heading" class="story-slides-dialog" hidden>
		<button class="close" aria-label="Close">&#x2715;</button>
		<h1 id="story-slides-dialog-menu-heading"><span class="story">Story</span><span class="slides">Slides</span> mode</h1>
		<div class="menu">
			<button id="story-slides-button-keys">
				Help<span class="slides have-touch">, gestures and shortcut&nbsp;keys</span><span class="story-or-no-touch-slides"> and shortcut keys</span>
			</button>
			<button id="story-slides-button-go">Go</button>
			<button class="slides" id="story-slides-button-fullscreen">Toggle full-screen</button>
			<button class="story" id="story-slides-button-mode-slides" aria-describedby="story-slides-mode-slides-explainer">Switch to slides mode</button>
			<button class="slides" id="story-slides-button-mode-story" aria-describedby="story-slides-mode-story-explainer">Switch to story mode</button>
		</div>
		<p class="story" id="story-slides-mode-slides-explainer">Slides mode displays each slide one at a time, as they would be projected for the audience. The extra information present in story mode is not displayed.</p>
		<p class="slides" id="story-slides-mode-story-explainer">Story mode allows you to read the presentation as a document, rather than a collection of separate slides, and includes extra background information.</p>
	</div>
</div>
`;

  // src/ui/slide-after.html
  var slide_after_default = '<div class="story-slides-ui slides">\n	<button class="have-touch" id="story-slides-button-next" aria-label="Next"><span>&rarr;</span></button>\n	<div id="story-slides-progress"><div></div></div>\n</div>\n';

  // src/ui/slide-before.html
  var slide_before_default = '<div class="story-slides-ui">\n	<button class="story-or-mobile-assumed" id="story-slides-button-menu" aria-label="Menu">&#x2630;</button>\n	<button class="slides have-touch" id="story-slides-button-previous" aria-label="Previous"><span>&larr;</span></button>\n</div>\n';

  // src/code/story-slides.ts
  var StorySlides = class extends EventTarget {
    constructor(checkOverflow) {
      super();
      this._checkOverflow = checkOverflow;
      this._currentSlideNumber = null;
      this._initialTitle = document.title;
      this._previousSlideNumber = null;
      this._screenfull = screenfull;
      this._slides = Array.from(document.getElementsByClassName(
        "slide"
      ));
      this._slidesContainer = document.getElementById("story-slides-slides-container");
      if (screenfull.isEnabled) {
        this._screenfull.on(
          "change",
          () => this.dispatch("fullscreen-change")
        );
      }
    }
    //
    // Actions
    //
    startUp(previousMode) {
      debug("linting successful; starting up; previousMode:", previousMode);
      if (previousMode) {
        this.startUpInMode(previousMode);
      } else {
        this.showIntroScreen();
      }
    }
    showIntroScreen() {
      document.getElementById("story-slides-screen-intro-heading").innerText = this._initialTitle;
      document.getElementById("story-slides-choose-story").addEventListener(
        "click",
        () => this.startUpInMode("story")
      );
      document.getElementById("story-slides-choose-slides").addEventListener(
        "click",
        () => this.startUpInMode("slides")
      );
      document.getElementById("story-slides-screen-intro").hidden = false;
    }
    dispatch(name) {
      debug("DISPATCH:", name);
      this.dispatchEvent(new Event(name));
    }
    custom(name, details) {
      debug("CUSTOM:", name);
      this.dispatchEvent(new CustomEvent(name, { detail: details }));
    }
    startUpInMode(mode) {
      this.dispatch("starting-up");
      document.getElementById("story-slides-screen-intro").remove();
      document.getElementById("story-slides-main-content").hidden = false;
      this.custom("switch-to-mode", { mode, startUp: true });
      debug("ready");
    }
    switchToModeStory() {
      this.custom("switch-to-mode", { mode: "story" });
    }
    switchToModeSlides() {
      this.custom("switch-to-mode", { mode: "slides" });
    }
    activateSlide(number) {
      const options = { newNumber: number };
      this.custom("activate-slide", options);
    }
    slideWasChanged() {
      this.dispatch("slide-was-changed");
    }
    validateNumber(number) {
      if (!(number >= 1 && number <= this._slides.length)) {
        throw Error(`Given slide number ${number} is out of bounds.`);
      }
    }
    //
    // State
    //
    get checkOverflow() {
      return this._checkOverflow;
    }
    get currentSlide() {
      if (this._currentSlideNumber === null) {
        throw Error("current slide is null");
      }
      return this._slides[this._currentSlideNumber - 1];
    }
    get currentSlideNumber() {
      if (this._currentSlideNumber === null) {
        throw Error("current slide is null");
      }
      return this._currentSlideNumber;
    }
    set currentSlideNumber(newNumber) {
      this.validateNumber(newNumber);
      this._currentSlideNumber = newNumber;
    }
    get initialTitle() {
      return this._initialTitle;
    }
    get isFullscreenEnabled() {
      return this._screenfull.isEnabled;
    }
    get isModeSlides() {
      return getMode() === "slides";
    }
    get isStartingUp() {
      return this._currentSlideNumber === null ? true : false;
    }
    get numberOfSlides() {
      return this._slides.length;
    }
    get previousSlideNumber() {
      if (this._previousSlideNumber === null) {
        throw Error("previous slide is null");
      }
      return this._previousSlideNumber;
    }
    set previousSlideNumber(newNumber) {
      this.validateNumber(newNumber);
      this._previousSlideNumber = newNumber;
    }
    slide(number) {
      this.validateNumber(number);
      return this._slides[number - 1];
    }
    get slidesContainer() {
      return this._slidesContainer;
    }
    get rawSlides() {
      if (this.isStartingUp) {
        return this._slides;
      }
      throw Error("rawSlides must only be accessed during start-up");
    }
    toString() {
      return `<${this._currentSlideNumber} of ${this.numberOfSlides} "${this._initialTitle}" p:${this._previousSlideNumber}>`;
    }
  };

  // src/code/overflow.ts
  var FULLSCREEN_OVERFLOW_CHECK_DELAY = 250;
  function isOverflowing(element) {
    const horizontalOverflow = element.scrollWidth - element.clientWidth;
    const verticalOverflow = element.scrollHeight - element.clientHeight;
    if (horizontalOverflow > 0 || verticalOverflow > 0) {
      return {
        "horizontal": horizontalOverflow > 0 ? horizontalOverflow : 0,
        "vertical": verticalOverflow > 0 ? verticalOverflow : 0
      };
    }
    return null;
  }
  var asString = (overflow2) => [
    overflow2.horizontal ? `${overflow2.horizontal}px too wide` : null,
    overflow2.vertical ? `${overflow2.vertical}px too tall` : null
  ].filter(Boolean).join("; ");
  var overflow = (presentation) => {
    const indicator = document.getElementById("story-slides-overflow-indicator");
    const readout = document.getElementById(
      "story-slides-overflow-indicator-readout"
    );
    function checkAndReport() {
      const slideNumber = presentation.currentSlideNumber;
      const overflow2 = isOverflowing(presentation.currentSlide);
      if (overflow2) {
        console.error(`Slide ${slideNumber} is overflowing:`, overflow2);
        indicator.setAttribute("class", "result-overflow");
        readout.innerText = "\u2717 " + asString(overflow2);
      } else {
        debug(`slide ${slideNumber} is not overflowing`);
        indicator.setAttribute("class", "result-ok");
        readout.innerText = "\u2714";
      }
    }
    function handleModeSwitch(event) {
      const { mode } = event.detail;
      if (mode === "slides") {
        presentation.addEventListener("slide-was-changed", checkAndReport);
      } else {
        indicator.setAttribute("class", "result-unknown");
        readout.innerText = "~";
        presentation.removeEventListener("slide-was-changed", checkAndReport);
      }
    }
    presentation.addEventListener("starting-up", () => {
      if (!presentation.checkOverflow)
        return;
      presentation.addEventListener("switch-to-mode", handleModeSwitch);
      presentation.addEventListener("fullscreen-change", () => {
        setTimeout(checkAndReport, FULLSCREEN_OVERFLOW_CHECK_DELAY);
      });
    });
  };

  // src/code/main.ts
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(callback) {
      setTimeout(callback, 500);
      return 42;
    };
  }
  function main() {
    debug("starting...");
    document.documentElement.setAttribute("data-story-slides-is-running", "");
    const checkOverflow = !hasStrictDataBoolean(
      document.currentScript,
      "no-overflow-check"
    );
    injectUI(
      document.body,
      slide_before_default,
      slide_after_default,
      screens_dialogs_default,
      announcer_default,
      checkOverflow ? overflow_indicator_default : null
    );
    const presentation = new StorySlides(checkOverflow);
    freezeBackground();
    toggleStyleSheetsForMode("slides");
    const lintSlidesResult = lintSlides();
    const lintDOMResult = lintDOM(presentation.rawSlides);
    const doSplitsResult = processContent(
      presentation.slidesContainer,
      presentation.rawSlides
    );
    const lintOK = lintSlidesResult && lintDOMResult && doSplitsResult;
    const previousMode = getMode();
    if (!lintOK || !previousMode || previousMode === "story") {
      toggleStyleSheetsForMode("story");
    }
    unFreezeBackgroundAndShowBody();
    dialog(presentation);
    overflow(presentation);
    shared(presentation);
    slides(presentation);
    story(presentation);
    if (lintOK) {
      presentation.startUp(previousMode);
    } else {
      document.getElementById("story-slides-screen-errors").hidden = false;
    }
  }
  function freezeBackground() {
    const backgroundColour = window.getComputedStyle(document.documentElement).getPropertyValue("--background-colour");
    const backgroundColor = window.getComputedStyle(document.documentElement).getPropertyValue("--background-color");
    const colour = backgroundColour ?? backgroundColor;
    document.documentElement.style.setProperty("--background-colour", colour);
  }
  function unFreezeBackgroundAndShowBody() {
    document.documentElement.style.removeProperty("--background-colour");
    document.body.style.display = "block";
  }
  main();
})();
//# sourceMappingURL=story-slides.js.map
