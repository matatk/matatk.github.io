/*!
* screenfull
* v5.1.0 - 2020-12-24
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

/* MARKED + MARKDOWN LICENCE
# License information

## Contribution License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## Marked

Copyright (c) 2018+, MarkedJS (https://github.com/markedjs/)
Copyright (c) 2011-2018, Christopher Jeffrey (https://github.com/chjj/)

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

## Markdown

Copyright © 2004, John Gruber
http://daringfireball.net/
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name “Markdown” nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

This software is provided by the copyright holders and contributors “as is” and any express or implied warranties, including, but not limited to, the implied warranties of merchantability and fitness for a particular purpose are disclaimed. In no event shall the copyright owner or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this software, even if advised of the possibility of such damage.
*/

(function () {
	'use strict';

	const storageKeyMode = window.location.pathname + '.mode';


	//
	// Functions that rely on state
	//

	// NOTE: These two are here to avoid code being imported both ways between
	//       story/slides and shared.

	function updateActiveSlide(options) {
		options.state.currentIndex = options.newIndex;
		updateProgress(
			options.state.slides,
			options.state.currentIndex,
			options.state.initialTitle,
			options.restoringPreviousState !== true);
	}

	function progressPercent(state) {
		return Math.round(((state.currentIndex + 1) / state.numSlides) * 100)
	}


	//
	// Functions that do not rely on state
	//

	const debug = window.console.debug.bind(window.console.debug, 'Story Slides:');
	const error = window.console.error.bind(window.console.error, 'Story Slides:');

	function hasStrictDataBoolean(element, attrName) {
		return element.dataset[attrName] === ''
	}

	function announce(text) {
		const announcer = document.getElementById('story-slides-announcer');
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
		// TODO: The author could've removed the progress indicator.
		const progress = document.querySelector('#story-slides-progress > div');
		if (progress) {
			const percent = progressPercent(slides);
			progress.style.width = `${Math.round(percent)}%`;
		}

		const slideNumber = currentIndex + 1;
		const hash = `#slide-${slideNumber}`;

		document.title = `Slide ${slideNumber} - ${initialTitle}`;

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

	// NOTE: Only exported for testing
	function checkSetActiveSlideOptions(options) {
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

	// NOTE: Only exported for testing
	function validateMode(mode) {
		if (mode === 'slides' || mode === 'story') return mode
		throw new Error(`Mode '${mode}' isn't valid`)
	}

	/*! @license DOMPurify 2.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/2.3.1/LICENSE */

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	var hasOwnProperty = Object.hasOwnProperty,
	    setPrototypeOf = Object.setPrototypeOf,
	    isFrozen = Object.isFrozen,
	    getPrototypeOf = Object.getPrototypeOf,
	    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	var freeze = Object.freeze,
	    seal = Object.seal,
	    create = Object.create; // eslint-disable-line import/no-mutable-exports

	var _ref = typeof Reflect !== 'undefined' && Reflect,
	    apply = _ref.apply,
	    construct = _ref.construct;

	if (!apply) {
	  apply = function apply(fun, thisValue, args) {
	    return fun.apply(thisValue, args);
	  };
	}

	if (!freeze) {
	  freeze = function freeze(x) {
	    return x;
	  };
	}

	if (!seal) {
	  seal = function seal(x) {
	    return x;
	  };
	}

	if (!construct) {
	  construct = function construct(Func, args) {
	    return new (Function.prototype.bind.apply(Func, [null].concat(_toConsumableArray(args))))();
	  };
	}

	var arrayForEach = unapply(Array.prototype.forEach);
	var arrayPop = unapply(Array.prototype.pop);
	var arrayPush = unapply(Array.prototype.push);

	var stringToLowerCase = unapply(String.prototype.toLowerCase);
	var stringMatch = unapply(String.prototype.match);
	var stringReplace = unapply(String.prototype.replace);
	var stringIndexOf = unapply(String.prototype.indexOf);
	var stringTrim = unapply(String.prototype.trim);

	var regExpTest = unapply(RegExp.prototype.test);

	var typeErrorCreate = unconstruct(TypeError);

	function unapply(func) {
	  return function (thisArg) {
	    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      args[_key - 1] = arguments[_key];
	    }

	    return apply(func, thisArg, args);
	  };
	}

	function unconstruct(func) {
	  return function () {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    return construct(func, args);
	  };
	}

	/* Add properties to a lookup table */
	function addToSet(set, array) {
	  if (setPrototypeOf) {
	    // Make 'in' and truthy checks like Boolean(set.constructor)
	    // independent of any properties defined on Object.prototype.
	    // Prevent prototype setters from intercepting set as a this value.
	    setPrototypeOf(set, null);
	  }

	  var l = array.length;
	  while (l--) {
	    var element = array[l];
	    if (typeof element === 'string') {
	      var lcElement = stringToLowerCase(element);
	      if (lcElement !== element) {
	        // Config presets (e.g. tags.js, attrs.js) are immutable.
	        if (!isFrozen(array)) {
	          array[l] = lcElement;
	        }

	        element = lcElement;
	      }
	    }

	    set[element] = true;
	  }

	  return set;
	}

	/* Shallow clone an object */
	function clone(object) {
	  var newObject = create(null);

	  var property = void 0;
	  for (property in object) {
	    if (apply(hasOwnProperty, object, [property])) {
	      newObject[property] = object[property];
	    }
	  }

	  return newObject;
	}

	/* IE10 doesn't support __lookupGetter__ so lets'
	 * simulate it. It also automatically checks
	 * if the prop is function or getter and behaves
	 * accordingly. */
	function lookupGetter(object, prop) {
	  while (object !== null) {
	    var desc = getOwnPropertyDescriptor(object, prop);
	    if (desc) {
	      if (desc.get) {
	        return unapply(desc.get);
	      }

	      if (typeof desc.value === 'function') {
	        return unapply(desc.value);
	      }
	    }

	    object = getPrototypeOf(object);
	  }

	  function fallbackValue(element) {
	    console.warn('fallback value for', element);
	    return null;
	  }

	  return fallbackValue;
	}

	var html = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'select', 'shadow', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);

	// SVG
	var svg = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);

	var svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);

	// List of SVG elements that are disallowed by default.
	// We still need to know them so that we can do namespace
	// checks properly in case one wants to add them to
	// allow-list.
	var svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'fedropshadow', 'feimage', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);

	var mathMl = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover']);

	// Similarly to SVG, we want to know all MathML elements,
	// even those that we disallow by default.
	var mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);

	var text = freeze(['#text']);

	var html$1 = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'pattern', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'xmlns', 'slot']);

	var svg$1 = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'targetx', 'targety', 'transform', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);

	var mathMl$1 = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);

	var xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

	// eslint-disable-next-line unicorn/better-regex
	var MUSTACHE_EXPR = seal(/\{\{[\s\S]*|[\s\S]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
	var ERB_EXPR = seal(/<%[\s\S]*|[\s\S]*%>/gm);
	var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]/); // eslint-disable-line no-useless-escape
	var ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
	var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
	);
	var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
	var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
	);

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	var getGlobal = function getGlobal() {
	  return typeof window === 'undefined' ? null : window;
	};

	/**
	 * Creates a no-op policy for internal use only.
	 * Don't export this function outside this module!
	 * @param {?TrustedTypePolicyFactory} trustedTypes The policy factory.
	 * @param {Document} document The document object (to determine policy name suffix)
	 * @return {?TrustedTypePolicy} The policy created (or null, if Trusted Types
	 * are not supported).
	 */
	var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, document) {
	  if ((typeof trustedTypes === 'undefined' ? 'undefined' : _typeof(trustedTypes)) !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
	    return null;
	  }

	  // Allow the callers to control the unique policy name
	  // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
	  // Policy creation with duplicate names throws in Trusted Types.
	  var suffix = null;
	  var ATTR_NAME = 'data-tt-policy-suffix';
	  if (document.currentScript && document.currentScript.hasAttribute(ATTR_NAME)) {
	    suffix = document.currentScript.getAttribute(ATTR_NAME);
	  }

	  var policyName = 'dompurify' + (suffix ? '#' + suffix : '');

	  try {
	    return trustedTypes.createPolicy(policyName, {
	      createHTML: function createHTML(html$$1) {
	        return html$$1;
	      }
	    });
	  } catch (_) {
	    // Policy creation failed (most likely another DOMPurify script has
	    // already run). Skip creating the policy, as this will only cause errors
	    // if TT are enforced.
	    console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
	    return null;
	  }
	};

	function createDOMPurify() {
	  var window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();

	  var DOMPurify = function DOMPurify(root) {
	    return createDOMPurify(root);
	  };

	  /**
	   * Version label, exposed for easier checks
	   * if DOMPurify is up to date or not
	   */
	  DOMPurify.version = '2.3.1';

	  /**
	   * Array of elements that DOMPurify removed during sanitation.
	   * Empty if nothing was removed.
	   */
	  DOMPurify.removed = [];

	  if (!window || !window.document || window.document.nodeType !== 9) {
	    // Not running in a browser, provide a factory function
	    // so that you can pass your own Window
	    DOMPurify.isSupported = false;

	    return DOMPurify;
	  }

	  var originalDocument = window.document;

	  var document = window.document;
	  var DocumentFragment = window.DocumentFragment,
	      HTMLTemplateElement = window.HTMLTemplateElement,
	      Node = window.Node,
	      Element = window.Element,
	      NodeFilter = window.NodeFilter,
	      _window$NamedNodeMap = window.NamedNodeMap,
	      NamedNodeMap = _window$NamedNodeMap === undefined ? window.NamedNodeMap || window.MozNamedAttrMap : _window$NamedNodeMap,
	      Text = window.Text,
	      Comment = window.Comment,
	      DOMParser = window.DOMParser,
	      trustedTypes = window.trustedTypes;


	  var ElementPrototype = Element.prototype;

	  var cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
	  var getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
	  var getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
	  var getParentNode = lookupGetter(ElementPrototype, 'parentNode');

	  // As per issue #47, the web-components registry is inherited by a
	  // new document created via createHTMLDocument. As per the spec
	  // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
	  // a new empty registry is used when creating a template contents owner
	  // document, so we use that as our parent document to ensure nothing
	  // is inherited.
	  if (typeof HTMLTemplateElement === 'function') {
	    var template = document.createElement('template');
	    if (template.content && template.content.ownerDocument) {
	      document = template.content.ownerDocument;
	    }
	  }

	  var trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, originalDocument);
	  var emptyHTML = trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML('') : '';

	  var _document = document,
	      implementation = _document.implementation,
	      createNodeIterator = _document.createNodeIterator,
	      createDocumentFragment = _document.createDocumentFragment,
	      getElementsByTagName = _document.getElementsByTagName;
	  var importNode = originalDocument.importNode;


	  var documentMode = {};
	  try {
	    documentMode = clone(document).documentMode ? document.documentMode : {};
	  } catch (_) {}

	  var hooks = {};

	  /**
	   * Expose whether this browser supports running the full DOMPurify.
	   */
	  DOMPurify.isSupported = typeof getParentNode === 'function' && implementation && typeof implementation.createHTMLDocument !== 'undefined' && documentMode !== 9;

	  var MUSTACHE_EXPR$$1 = MUSTACHE_EXPR,
	      ERB_EXPR$$1 = ERB_EXPR,
	      DATA_ATTR$$1 = DATA_ATTR,
	      ARIA_ATTR$$1 = ARIA_ATTR,
	      IS_SCRIPT_OR_DATA$$1 = IS_SCRIPT_OR_DATA,
	      ATTR_WHITESPACE$$1 = ATTR_WHITESPACE;
	  var IS_ALLOWED_URI$$1 = IS_ALLOWED_URI;

	  /**
	   * We consider the elements and attributes below to be safe. Ideally
	   * don't add any new ones but feel free to remove unwanted ones.
	   */

	  /* allowed element names */

	  var ALLOWED_TAGS = null;
	  var DEFAULT_ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(html), _toConsumableArray$1(svg), _toConsumableArray$1(svgFilters), _toConsumableArray$1(mathMl), _toConsumableArray$1(text)));

	  /* Allowed attribute names */
	  var ALLOWED_ATTR = null;
	  var DEFAULT_ALLOWED_ATTR = addToSet({}, [].concat(_toConsumableArray$1(html$1), _toConsumableArray$1(svg$1), _toConsumableArray$1(mathMl$1), _toConsumableArray$1(xml)));

	  /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
	  var FORBID_TAGS = null;

	  /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
	  var FORBID_ATTR = null;

	  /* Decide if ARIA attributes are okay */
	  var ALLOW_ARIA_ATTR = true;

	  /* Decide if custom data attributes are okay */
	  var ALLOW_DATA_ATTR = true;

	  /* Decide if unknown protocols are okay */
	  var ALLOW_UNKNOWN_PROTOCOLS = false;

	  /* Output should be safe for common template engines.
	   * This means, DOMPurify removes data attributes, mustaches and ERB
	   */
	  var SAFE_FOR_TEMPLATES = false;

	  /* Decide if document with <html>... should be returned */
	  var WHOLE_DOCUMENT = false;

	  /* Track whether config is already set on this instance of DOMPurify. */
	  var SET_CONFIG = false;

	  /* Decide if all elements (e.g. style, script) must be children of
	   * document.body. By default, browsers might move them to document.head */
	  var FORCE_BODY = false;

	  /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
	   * string (or a TrustedHTML object if Trusted Types are supported).
	   * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
	   */
	  var RETURN_DOM = false;

	  /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
	   * string  (or a TrustedHTML object if Trusted Types are supported) */
	  var RETURN_DOM_FRAGMENT = false;

	  /* If `RETURN_DOM` or `RETURN_DOM_FRAGMENT` is enabled, decide if the returned DOM
	   * `Node` is imported into the current `Document`. If this flag is not enabled the
	   * `Node` will belong (its ownerDocument) to a fresh `HTMLDocument`, created by
	   * DOMPurify.
	   *
	   * This defaults to `true` starting DOMPurify 2.2.0. Note that setting it to `false`
	   * might cause XSS from attacks hidden in closed shadowroots in case the browser
	   * supports Declarative Shadow: DOM https://web.dev/declarative-shadow-dom/
	   */
	  var RETURN_DOM_IMPORT = true;

	  /* Try to return a Trusted Type object instead of a string, return a string in
	   * case Trusted Types are not supported  */
	  var RETURN_TRUSTED_TYPE = false;

	  /* Output should be free from DOM clobbering attacks? */
	  var SANITIZE_DOM = true;

	  /* Keep element content when removing element? */
	  var KEEP_CONTENT = true;

	  /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
	   * of importing it into a new Document and returning a sanitized copy */
	  var IN_PLACE = false;

	  /* Allow usage of profiles like html, svg and mathMl */
	  var USE_PROFILES = {};

	  /* Tags to ignore content of when KEEP_CONTENT is true */
	  var FORBID_CONTENTS = null;
	  var DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);

	  /* Tags that are safe for data: URIs */
	  var DATA_URI_TAGS = null;
	  var DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);

	  /* Attributes safe for values like "javascript:" */
	  var URI_SAFE_ATTRIBUTES = null;
	  var DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);

	  var MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
	  var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	  var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
	  /* Document namespace */
	  var NAMESPACE = HTML_NAMESPACE;
	  var IS_EMPTY_INPUT = false;

	  /* Keep a reference to config to pass to hooks */
	  var CONFIG = null;

	  /* Ideally, do not touch anything below this line */
	  /* ______________________________________________ */

	  var formElement = document.createElement('form');

	  /**
	   * _parseConfig
	   *
	   * @param  {Object} cfg optional config literal
	   */
	  // eslint-disable-next-line complexity
	  var _parseConfig = function _parseConfig(cfg) {
	    if (CONFIG && CONFIG === cfg) {
	      return;
	    }

	    /* Shield configuration object from tampering */
	    if (!cfg || (typeof cfg === 'undefined' ? 'undefined' : _typeof(cfg)) !== 'object') {
	      cfg = {};
	    }

	    /* Shield configuration object from prototype pollution */
	    cfg = clone(cfg);

	    /* Set configuration parameters */
	    ALLOWED_TAGS = 'ALLOWED_TAGS' in cfg ? addToSet({}, cfg.ALLOWED_TAGS) : DEFAULT_ALLOWED_TAGS;
	    ALLOWED_ATTR = 'ALLOWED_ATTR' in cfg ? addToSet({}, cfg.ALLOWED_ATTR) : DEFAULT_ALLOWED_ATTR;
	    URI_SAFE_ATTRIBUTES = 'ADD_URI_SAFE_ATTR' in cfg ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR) : DEFAULT_URI_SAFE_ATTRIBUTES;
	    DATA_URI_TAGS = 'ADD_DATA_URI_TAGS' in cfg ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS) : DEFAULT_DATA_URI_TAGS;
	    FORBID_CONTENTS = 'FORBID_CONTENTS' in cfg ? addToSet({}, cfg.FORBID_CONTENTS) : DEFAULT_FORBID_CONTENTS;
	    FORBID_TAGS = 'FORBID_TAGS' in cfg ? addToSet({}, cfg.FORBID_TAGS) : {};
	    FORBID_ATTR = 'FORBID_ATTR' in cfg ? addToSet({}, cfg.FORBID_ATTR) : {};
	    USE_PROFILES = 'USE_PROFILES' in cfg ? cfg.USE_PROFILES : false;
	    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
	    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
	    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
	    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
	    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
	    RETURN_DOM = cfg.RETURN_DOM || false; // Default false
	    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
	    RETURN_DOM_IMPORT = cfg.RETURN_DOM_IMPORT !== false; // Default true
	    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
	    FORCE_BODY = cfg.FORCE_BODY || false; // Default false
	    SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
	    KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
	    IN_PLACE = cfg.IN_PLACE || false; // Default false
	    IS_ALLOWED_URI$$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI$$1;
	    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
	    if (SAFE_FOR_TEMPLATES) {
	      ALLOW_DATA_ATTR = false;
	    }

	    if (RETURN_DOM_FRAGMENT) {
	      RETURN_DOM = true;
	    }

	    /* Parse profile info */
	    if (USE_PROFILES) {
	      ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(text)));
	      ALLOWED_ATTR = [];
	      if (USE_PROFILES.html === true) {
	        addToSet(ALLOWED_TAGS, html);
	        addToSet(ALLOWED_ATTR, html$1);
	      }

	      if (USE_PROFILES.svg === true) {
	        addToSet(ALLOWED_TAGS, svg);
	        addToSet(ALLOWED_ATTR, svg$1);
	        addToSet(ALLOWED_ATTR, xml);
	      }

	      if (USE_PROFILES.svgFilters === true) {
	        addToSet(ALLOWED_TAGS, svgFilters);
	        addToSet(ALLOWED_ATTR, svg$1);
	        addToSet(ALLOWED_ATTR, xml);
	      }

	      if (USE_PROFILES.mathMl === true) {
	        addToSet(ALLOWED_TAGS, mathMl);
	        addToSet(ALLOWED_ATTR, mathMl$1);
	        addToSet(ALLOWED_ATTR, xml);
	      }
	    }

	    /* Merge configuration parameters */
	    if (cfg.ADD_TAGS) {
	      if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
	        ALLOWED_TAGS = clone(ALLOWED_TAGS);
	      }

	      addToSet(ALLOWED_TAGS, cfg.ADD_TAGS);
	    }

	    if (cfg.ADD_ATTR) {
	      if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
	        ALLOWED_ATTR = clone(ALLOWED_ATTR);
	      }

	      addToSet(ALLOWED_ATTR, cfg.ADD_ATTR);
	    }

	    if (cfg.ADD_URI_SAFE_ATTR) {
	      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR);
	    }

	    if (cfg.FORBID_CONTENTS) {
	      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
	        FORBID_CONTENTS = clone(FORBID_CONTENTS);
	      }

	      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS);
	    }

	    /* Add #text in case KEEP_CONTENT is set to true */
	    if (KEEP_CONTENT) {
	      ALLOWED_TAGS['#text'] = true;
	    }

	    /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
	    if (WHOLE_DOCUMENT) {
	      addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
	    }

	    /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
	    if (ALLOWED_TAGS.table) {
	      addToSet(ALLOWED_TAGS, ['tbody']);
	      delete FORBID_TAGS.tbody;
	    }

	    // Prevent further manipulation of configuration.
	    // Not available in IE8, Safari 5, etc.
	    if (freeze) {
	      freeze(cfg);
	    }

	    CONFIG = cfg;
	  };

	  var MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ['mi', 'mo', 'mn', 'ms', 'mtext']);

	  var HTML_INTEGRATION_POINTS = addToSet({}, ['foreignobject', 'desc', 'title', 'annotation-xml']);

	  /* Keep track of all possible SVG and MathML tags
	   * so that we can perform the namespace checks
	   * correctly. */
	  var ALL_SVG_TAGS = addToSet({}, svg);
	  addToSet(ALL_SVG_TAGS, svgFilters);
	  addToSet(ALL_SVG_TAGS, svgDisallowed);

	  var ALL_MATHML_TAGS = addToSet({}, mathMl);
	  addToSet(ALL_MATHML_TAGS, mathMlDisallowed);

	  /**
	   *
	   *
	   * @param  {Element} element a DOM element whose namespace is being checked
	   * @returns {boolean} Return false if the element has a
	   *  namespace that a spec-compliant parser would never
	   *  return. Return true otherwise.
	   */
	  var _checkValidNamespace = function _checkValidNamespace(element) {
	    var parent = getParentNode(element);

	    // In JSDOM, if we're inside shadow DOM, then parentNode
	    // can be null. We just simulate parent in this case.
	    if (!parent || !parent.tagName) {
	      parent = {
	        namespaceURI: HTML_NAMESPACE,
	        tagName: 'template'
	      };
	    }

	    var tagName = stringToLowerCase(element.tagName);
	    var parentTagName = stringToLowerCase(parent.tagName);

	    if (element.namespaceURI === SVG_NAMESPACE) {
	      // The only way to switch from HTML namespace to SVG
	      // is via <svg>. If it happens via any other tag, then
	      // it should be killed.
	      if (parent.namespaceURI === HTML_NAMESPACE) {
	        return tagName === 'svg';
	      }

	      // The only way to switch from MathML to SVG is via
	      // svg if parent is either <annotation-xml> or MathML
	      // text integration points.
	      if (parent.namespaceURI === MATHML_NAMESPACE) {
	        return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
	      }

	      // We only allow elements that are defined in SVG
	      // spec. All others are disallowed in SVG namespace.
	      return Boolean(ALL_SVG_TAGS[tagName]);
	    }

	    if (element.namespaceURI === MATHML_NAMESPACE) {
	      // The only way to switch from HTML namespace to MathML
	      // is via <math>. If it happens via any other tag, then
	      // it should be killed.
	      if (parent.namespaceURI === HTML_NAMESPACE) {
	        return tagName === 'math';
	      }

	      // The only way to switch from SVG to MathML is via
	      // <math> and HTML integration points
	      if (parent.namespaceURI === SVG_NAMESPACE) {
	        return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
	      }

	      // We only allow elements that are defined in MathML
	      // spec. All others are disallowed in MathML namespace.
	      return Boolean(ALL_MATHML_TAGS[tagName]);
	    }

	    if (element.namespaceURI === HTML_NAMESPACE) {
	      // The only way to switch from SVG to HTML is via
	      // HTML integration points, and from MathML to HTML
	      // is via MathML text integration points
	      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
	        return false;
	      }

	      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
	        return false;
	      }

	      // Certain elements are allowed in both SVG and HTML
	      // namespace. We need to specify them explicitly
	      // so that they don't get erronously deleted from
	      // HTML namespace.
	      var commonSvgAndHTMLElements = addToSet({}, ['title', 'style', 'font', 'a', 'script']);

	      // We disallow tags that are specific for MathML
	      // or SVG and should never appear in HTML namespace
	      return !ALL_MATHML_TAGS[tagName] && (commonSvgAndHTMLElements[tagName] || !ALL_SVG_TAGS[tagName]);
	    }

	    // The code should never reach this place (this means
	    // that the element somehow got namespace that is not
	    // HTML, SVG or MathML). Return false just in case.
	    return false;
	  };

	  /**
	   * _forceRemove
	   *
	   * @param  {Node} node a DOM node
	   */
	  var _forceRemove = function _forceRemove(node) {
	    arrayPush(DOMPurify.removed, { element: node });
	    try {
	      // eslint-disable-next-line unicorn/prefer-dom-node-remove
	      node.parentNode.removeChild(node);
	    } catch (_) {
	      try {
	        node.outerHTML = emptyHTML;
	      } catch (_) {
	        node.remove();
	      }
	    }
	  };

	  /**
	   * _removeAttribute
	   *
	   * @param  {String} name an Attribute name
	   * @param  {Node} node a DOM node
	   */
	  var _removeAttribute = function _removeAttribute(name, node) {
	    try {
	      arrayPush(DOMPurify.removed, {
	        attribute: node.getAttributeNode(name),
	        from: node
	      });
	    } catch (_) {
	      arrayPush(DOMPurify.removed, {
	        attribute: null,
	        from: node
	      });
	    }

	    node.removeAttribute(name);

	    // We void attribute values for unremovable "is"" attributes
	    if (name === 'is' && !ALLOWED_ATTR[name]) {
	      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
	        try {
	          _forceRemove(node);
	        } catch (_) {}
	      } else {
	        try {
	          node.setAttribute(name, '');
	        } catch (_) {}
	      }
	    }
	  };

	  /**
	   * _initDocument
	   *
	   * @param  {String} dirty a string of dirty markup
	   * @return {Document} a DOM, filled with the dirty markup
	   */
	  var _initDocument = function _initDocument(dirty) {
	    /* Create a HTML document */
	    var doc = void 0;
	    var leadingWhitespace = void 0;

	    if (FORCE_BODY) {
	      dirty = '<remove></remove>' + dirty;
	    } else {
	      /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
	      var matches = stringMatch(dirty, /^[\r\n\t ]+/);
	      leadingWhitespace = matches && matches[0];
	    }

	    var dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
	    /*
	     * Use the DOMParser API by default, fallback later if needs be
	     * DOMParser not work for svg when has multiple root element.
	     */
	    if (NAMESPACE === HTML_NAMESPACE) {
	      try {
	        doc = new DOMParser().parseFromString(dirtyPayload, 'text/html');
	      } catch (_) {}
	    }

	    /* Use createHTMLDocument in case DOMParser is not available */
	    if (!doc || !doc.documentElement) {
	      doc = implementation.createDocument(NAMESPACE, 'template', null);
	      try {
	        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? '' : dirtyPayload;
	      } catch (_) {
	        // Syntax error if dirtyPayload is invalid xml
	      }
	    }

	    var body = doc.body || doc.documentElement;

	    if (dirty && leadingWhitespace) {
	      body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
	    }

	    /* Work on whole document or just its body */
	    if (NAMESPACE === HTML_NAMESPACE) {
	      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
	    }

	    return WHOLE_DOCUMENT ? doc.documentElement : body;
	  };

	  /**
	   * _createIterator
	   *
	   * @param  {Document} root document/fragment to create iterator for
	   * @return {Iterator} iterator instance
	   */
	  var _createIterator = function _createIterator(root) {
	    return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT, null, false);
	  };

	  /**
	   * _isClobbered
	   *
	   * @param  {Node} elm element to check for clobbering attacks
	   * @return {Boolean} true if clobbered, false if safe
	   */
	  var _isClobbered = function _isClobbered(elm) {
	    if (elm instanceof Text || elm instanceof Comment) {
	      return false;
	    }

	    if (typeof elm.nodeName !== 'string' || typeof elm.textContent !== 'string' || typeof elm.removeChild !== 'function' || !(elm.attributes instanceof NamedNodeMap) || typeof elm.removeAttribute !== 'function' || typeof elm.setAttribute !== 'function' || typeof elm.namespaceURI !== 'string' || typeof elm.insertBefore !== 'function') {
	      return true;
	    }

	    return false;
	  };

	  /**
	   * _isNode
	   *
	   * @param  {Node} obj object to check whether it's a DOM node
	   * @return {Boolean} true is object is a DOM node
	   */
	  var _isNode = function _isNode(object) {
	    return (typeof Node === 'undefined' ? 'undefined' : _typeof(Node)) === 'object' ? object instanceof Node : object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string';
	  };

	  /**
	   * _executeHook
	   * Execute user configurable hooks
	   *
	   * @param  {String} entryPoint  Name of the hook's entry point
	   * @param  {Node} currentNode node to work on with the hook
	   * @param  {Object} data additional hook parameters
	   */
	  var _executeHook = function _executeHook(entryPoint, currentNode, data) {
	    if (!hooks[entryPoint]) {
	      return;
	    }

	    arrayForEach(hooks[entryPoint], function (hook) {
	      hook.call(DOMPurify, currentNode, data, CONFIG);
	    });
	  };

	  /**
	   * _sanitizeElements
	   *
	   * @protect nodeName
	   * @protect textContent
	   * @protect removeChild
	   *
	   * @param   {Node} currentNode to check for permission to exist
	   * @return  {Boolean} true if node was killed, false if left alive
	   */
	  var _sanitizeElements = function _sanitizeElements(currentNode) {
	    var content = void 0;

	    /* Execute a hook if present */
	    _executeHook('beforeSanitizeElements', currentNode, null);

	    /* Check if element is clobbered or can clobber */
	    if (_isClobbered(currentNode)) {
	      _forceRemove(currentNode);
	      return true;
	    }

	    /* Check if tagname contains Unicode */
	    if (stringMatch(currentNode.nodeName, /[\u0080-\uFFFF]/)) {
	      _forceRemove(currentNode);
	      return true;
	    }

	    /* Now let's check the element's type and name */
	    var tagName = stringToLowerCase(currentNode.nodeName);

	    /* Execute a hook if present */
	    _executeHook('uponSanitizeElement', currentNode, {
	      tagName: tagName,
	      allowedTags: ALLOWED_TAGS
	    });

	    /* Detect mXSS attempts abusing namespace confusion */
	    if (!_isNode(currentNode.firstElementChild) && (!_isNode(currentNode.content) || !_isNode(currentNode.content.firstElementChild)) && regExpTest(/<[/\w]/g, currentNode.innerHTML) && regExpTest(/<[/\w]/g, currentNode.textContent)) {
	      _forceRemove(currentNode);
	      return true;
	    }

	    /* Mitigate a problem with templates inside select */
	    if (tagName === 'select' && regExpTest(/<template/i, currentNode.innerHTML)) {
	      _forceRemove(currentNode);
	      return true;
	    }

	    /* Remove element if anything forbids its presence */
	    if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
	      /* Keep content except for bad-listed elements */
	      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
	        var parentNode = getParentNode(currentNode) || currentNode.parentNode;
	        var childNodes = getChildNodes(currentNode) || currentNode.childNodes;

	        if (childNodes && parentNode) {
	          var childCount = childNodes.length;

	          for (var i = childCount - 1; i >= 0; --i) {
	            parentNode.insertBefore(cloneNode(childNodes[i], true), getNextSibling(currentNode));
	          }
	        }
	      }

	      _forceRemove(currentNode);
	      return true;
	    }

	    /* Check whether element has a valid namespace */
	    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
	      _forceRemove(currentNode);
	      return true;
	    }

	    if ((tagName === 'noscript' || tagName === 'noembed') && regExpTest(/<\/no(script|embed)/i, currentNode.innerHTML)) {
	      _forceRemove(currentNode);
	      return true;
	    }

	    /* Sanitize element content to be template-safe */
	    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === 3) {
	      /* Get the element's text content */
	      content = currentNode.textContent;
	      content = stringReplace(content, MUSTACHE_EXPR$$1, ' ');
	      content = stringReplace(content, ERB_EXPR$$1, ' ');
	      if (currentNode.textContent !== content) {
	        arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
	        currentNode.textContent = content;
	      }
	    }

	    /* Execute a hook if present */
	    _executeHook('afterSanitizeElements', currentNode, null);

	    return false;
	  };

	  /**
	   * _isValidAttribute
	   *
	   * @param  {string} lcTag Lowercase tag name of containing element.
	   * @param  {string} lcName Lowercase attribute name.
	   * @param  {string} value Attribute value.
	   * @return {Boolean} Returns true if `value` is valid, otherwise false.
	   */
	  // eslint-disable-next-line complexity
	  var _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
	    /* Make sure attribute cannot clobber */
	    if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
	      return false;
	    }

	    /* Allow valid data-* attributes: At least one character after "-"
	        (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
	        XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
	        We don't need to check the value; it's always URI safe. */
	    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR$$1, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$$1, lcName)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
	      return false;

	      /* Check value is safe. First, is attr inert? If so, is safe */
	    } else if (URI_SAFE_ATTRIBUTES[lcName]) ; else if (regExpTest(IS_ALLOWED_URI$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ; else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if (!value) ; else {
	      return false;
	    }

	    return true;
	  };

	  /**
	   * _sanitizeAttributes
	   *
	   * @protect attributes
	   * @protect nodeName
	   * @protect removeAttribute
	   * @protect setAttribute
	   *
	   * @param  {Node} currentNode to sanitize
	   */
	  var _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
	    var attr = void 0;
	    var value = void 0;
	    var lcName = void 0;
	    var l = void 0;
	    /* Execute a hook if present */
	    _executeHook('beforeSanitizeAttributes', currentNode, null);

	    var attributes = currentNode.attributes;

	    /* Check if we have attributes; if not we might have a text node */

	    if (!attributes) {
	      return;
	    }

	    var hookEvent = {
	      attrName: '',
	      attrValue: '',
	      keepAttr: true,
	      allowedAttributes: ALLOWED_ATTR
	    };
	    l = attributes.length;

	    /* Go backwards over all attributes; safely remove bad ones */
	    while (l--) {
	      attr = attributes[l];
	      var _attr = attr,
	          name = _attr.name,
	          namespaceURI = _attr.namespaceURI;

	      value = stringTrim(attr.value);
	      lcName = stringToLowerCase(name);

	      /* Execute a hook if present */
	      hookEvent.attrName = lcName;
	      hookEvent.attrValue = value;
	      hookEvent.keepAttr = true;
	      hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
	      _executeHook('uponSanitizeAttribute', currentNode, hookEvent);
	      value = hookEvent.attrValue;
	      /* Did the hooks approve of the attribute? */
	      if (hookEvent.forceKeepAttr) {
	        continue;
	      }

	      /* Remove attribute */
	      _removeAttribute(name, currentNode);

	      /* Did the hooks approve of the attribute? */
	      if (!hookEvent.keepAttr) {
	        continue;
	      }

	      /* Work around a security issue in jQuery 3.0 */
	      if (regExpTest(/\/>/i, value)) {
	        _removeAttribute(name, currentNode);
	        continue;
	      }

	      /* Sanitize attribute content to be template-safe */
	      if (SAFE_FOR_TEMPLATES) {
	        value = stringReplace(value, MUSTACHE_EXPR$$1, ' ');
	        value = stringReplace(value, ERB_EXPR$$1, ' ');
	      }

	      /* Is `value` valid for this attribute? */
	      var lcTag = currentNode.nodeName.toLowerCase();
	      if (!_isValidAttribute(lcTag, lcName, value)) {
	        continue;
	      }

	      /* Handle invalid data-* attribute set by try-catching it */
	      try {
	        if (namespaceURI) {
	          currentNode.setAttributeNS(namespaceURI, name, value);
	        } else {
	          /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
	          currentNode.setAttribute(name, value);
	        }

	        arrayPop(DOMPurify.removed);
	      } catch (_) {}
	    }

	    /* Execute a hook if present */
	    _executeHook('afterSanitizeAttributes', currentNode, null);
	  };

	  /**
	   * _sanitizeShadowDOM
	   *
	   * @param  {DocumentFragment} fragment to iterate over recursively
	   */
	  var _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
	    var shadowNode = void 0;
	    var shadowIterator = _createIterator(fragment);

	    /* Execute a hook if present */
	    _executeHook('beforeSanitizeShadowDOM', fragment, null);

	    while (shadowNode = shadowIterator.nextNode()) {
	      /* Execute a hook if present */
	      _executeHook('uponSanitizeShadowNode', shadowNode, null);

	      /* Sanitize tags and elements */
	      if (_sanitizeElements(shadowNode)) {
	        continue;
	      }

	      /* Deep shadow DOM detected */
	      if (shadowNode.content instanceof DocumentFragment) {
	        _sanitizeShadowDOM(shadowNode.content);
	      }

	      /* Check attributes, sanitize if necessary */
	      _sanitizeAttributes(shadowNode);
	    }

	    /* Execute a hook if present */
	    _executeHook('afterSanitizeShadowDOM', fragment, null);
	  };

	  /**
	   * Sanitize
	   * Public method providing core sanitation functionality
	   *
	   * @param {String|Node} dirty string or DOM node
	   * @param {Object} configuration object
	   */
	  // eslint-disable-next-line complexity
	  DOMPurify.sanitize = function (dirty, cfg) {
	    var body = void 0;
	    var importedNode = void 0;
	    var currentNode = void 0;
	    var oldNode = void 0;
	    var returnNode = void 0;
	    /* Make sure we have a string to sanitize.
	      DO NOT return early, as this will return the wrong type if
	      the user has requested a DOM object rather than a string */
	    IS_EMPTY_INPUT = !dirty;
	    if (IS_EMPTY_INPUT) {
	      dirty = '<!-->';
	    }

	    /* Stringify, in case dirty is an object */
	    if (typeof dirty !== 'string' && !_isNode(dirty)) {
	      // eslint-disable-next-line no-negated-condition
	      if (typeof dirty.toString !== 'function') {
	        throw typeErrorCreate('toString is not a function');
	      } else {
	        dirty = dirty.toString();
	        if (typeof dirty !== 'string') {
	          throw typeErrorCreate('dirty is not a string, aborting');
	        }
	      }
	    }

	    /* Check we can run. Otherwise fall back or ignore */
	    if (!DOMPurify.isSupported) {
	      if (_typeof(window.toStaticHTML) === 'object' || typeof window.toStaticHTML === 'function') {
	        if (typeof dirty === 'string') {
	          return window.toStaticHTML(dirty);
	        }

	        if (_isNode(dirty)) {
	          return window.toStaticHTML(dirty.outerHTML);
	        }
	      }

	      return dirty;
	    }

	    /* Assign config vars */
	    if (!SET_CONFIG) {
	      _parseConfig(cfg);
	    }

	    /* Clean up removed elements */
	    DOMPurify.removed = [];

	    /* Check if dirty is correctly typed for IN_PLACE */
	    if (typeof dirty === 'string') {
	      IN_PLACE = false;
	    }

	    if (IN_PLACE) ; else if (dirty instanceof Node) {
	      /* If dirty is a DOM element, append to an empty document to avoid
	         elements being stripped by the parser */
	      body = _initDocument('<!---->');
	      importedNode = body.ownerDocument.importNode(dirty, true);
	      if (importedNode.nodeType === 1 && importedNode.nodeName === 'BODY') {
	        /* Node is already a body, use as is */
	        body = importedNode;
	      } else if (importedNode.nodeName === 'HTML') {
	        body = importedNode;
	      } else {
	        // eslint-disable-next-line unicorn/prefer-dom-node-append
	        body.appendChild(importedNode);
	      }
	    } else {
	      /* Exit directly if we have nothing to do */
	      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
	      // eslint-disable-next-line unicorn/prefer-includes
	      dirty.indexOf('<') === -1) {
	        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
	      }

	      /* Initialize the document to work on */
	      body = _initDocument(dirty);

	      /* Check we have a DOM node from the data */
	      if (!body) {
	        return RETURN_DOM ? null : emptyHTML;
	      }
	    }

	    /* Remove first element node (ours) if FORCE_BODY is set */
	    if (body && FORCE_BODY) {
	      _forceRemove(body.firstChild);
	    }

	    /* Get node iterator */
	    var nodeIterator = _createIterator(IN_PLACE ? dirty : body);

	    /* Now start iterating over the created document */
	    while (currentNode = nodeIterator.nextNode()) {
	      /* Fix IE's strange behavior with manipulated textNodes #89 */
	      if (currentNode.nodeType === 3 && currentNode === oldNode) {
	        continue;
	      }

	      /* Sanitize tags and elements */
	      if (_sanitizeElements(currentNode)) {
	        continue;
	      }

	      /* Shadow DOM detected, sanitize it */
	      if (currentNode.content instanceof DocumentFragment) {
	        _sanitizeShadowDOM(currentNode.content);
	      }

	      /* Check attributes, sanitize if necessary */
	      _sanitizeAttributes(currentNode);

	      oldNode = currentNode;
	    }

	    oldNode = null;

	    /* If we sanitized `dirty` in-place, return it. */
	    if (IN_PLACE) {
	      return dirty;
	    }

	    /* Return sanitized string or DOM */
	    if (RETURN_DOM) {
	      if (RETURN_DOM_FRAGMENT) {
	        returnNode = createDocumentFragment.call(body.ownerDocument);

	        while (body.firstChild) {
	          // eslint-disable-next-line unicorn/prefer-dom-node-append
	          returnNode.appendChild(body.firstChild);
	        }
	      } else {
	        returnNode = body;
	      }

	      if (RETURN_DOM_IMPORT) {
	        /*
	          AdoptNode() is not used because internal state is not reset
	          (e.g. the past names map of a HTMLFormElement), this is safe
	          in theory but we would rather not risk another attack vector.
	          The state that is cloned by importNode() is explicitly defined
	          by the specs.
	        */
	        returnNode = importNode.call(originalDocument, returnNode, true);
	      }

	      return returnNode;
	    }

	    var serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;

	    /* Sanitize final string template-safe */
	    if (SAFE_FOR_TEMPLATES) {
	      serializedHTML = stringReplace(serializedHTML, MUSTACHE_EXPR$$1, ' ');
	      serializedHTML = stringReplace(serializedHTML, ERB_EXPR$$1, ' ');
	    }

	    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
	  };

	  /**
	   * Public method to set the configuration once
	   * setConfig
	   *
	   * @param {Object} cfg configuration object
	   */
	  DOMPurify.setConfig = function (cfg) {
	    _parseConfig(cfg);
	    SET_CONFIG = true;
	  };

	  /**
	   * Public method to remove the configuration
	   * clearConfig
	   *
	   */
	  DOMPurify.clearConfig = function () {
	    CONFIG = null;
	    SET_CONFIG = false;
	  };

	  /**
	   * Public method to check if an attribute value is valid.
	   * Uses last set config, if any. Otherwise, uses config defaults.
	   * isValidAttribute
	   *
	   * @param  {string} tag Tag name of containing element.
	   * @param  {string} attr Attribute name.
	   * @param  {string} value Attribute value.
	   * @return {Boolean} Returns true if `value` is valid. Otherwise, returns false.
	   */
	  DOMPurify.isValidAttribute = function (tag, attr, value) {
	    /* Initialize shared config vars if necessary. */
	    if (!CONFIG) {
	      _parseConfig({});
	    }

	    var lcTag = stringToLowerCase(tag);
	    var lcName = stringToLowerCase(attr);
	    return _isValidAttribute(lcTag, lcName, value);
	  };

	  /**
	   * AddHook
	   * Public method to add DOMPurify hooks
	   *
	   * @param {String} entryPoint entry point for the hook to add
	   * @param {Function} hookFunction function to execute
	   */
	  DOMPurify.addHook = function (entryPoint, hookFunction) {
	    if (typeof hookFunction !== 'function') {
	      return;
	    }

	    hooks[entryPoint] = hooks[entryPoint] || [];
	    arrayPush(hooks[entryPoint], hookFunction);
	  };

	  /**
	   * RemoveHook
	   * Public method to remove a DOMPurify hook at a given entryPoint
	   * (pops it from the stack of hooks if more are present)
	   *
	   * @param {String} entryPoint entry point for the hook to remove
	   */
	  DOMPurify.removeHook = function (entryPoint) {
	    if (hooks[entryPoint]) {
	      arrayPop(hooks[entryPoint]);
	    }
	  };

	  /**
	   * RemoveHooks
	   * Public method to remove all DOMPurify hooks at a given entryPoint
	   *
	   * @param  {String} entryPoint entry point for the hooks to remove
	   */
	  DOMPurify.removeHooks = function (entryPoint) {
	    if (hooks[entryPoint]) {
	      hooks[entryPoint] = [];
	    }
	  };

	  /**
	   * RemoveAllHooks
	   * Public method to remove all DOMPurify hooks
	   *
	   */
	  DOMPurify.removeAllHooks = function () {
	    hooks = {};
	  };

	  return DOMPurify;
	}

	var purify = createDOMPurify();

	/**
	 * marked - a markdown parser
	 * Copyright (c) 2011-2021, Christopher Jeffrey. (MIT Licensed)
	 * https://github.com/markedjs/marked
	 */

	/**
	 * DO NOT EDIT THIS FILE
	 * The code in this file is generated from files in ./src/
	 */

	var defaults$5 = {exports: {}};

	function getDefaults$1() {
	  return {
	    baseUrl: null,
	    breaks: false,
	    extensions: null,
	    gfm: true,
	    headerIds: true,
	    headerPrefix: '',
	    highlight: null,
	    langPrefix: 'language-',
	    mangle: true,
	    pedantic: false,
	    renderer: null,
	    sanitize: false,
	    sanitizer: null,
	    silent: false,
	    smartLists: false,
	    smartypants: false,
	    tokenizer: null,
	    walkTokens: null,
	    xhtml: false
	  };
	}

	function changeDefaults$1(newDefaults) {
	  defaults$5.exports.defaults = newDefaults;
	}

	defaults$5.exports = {
	  defaults: getDefaults$1(),
	  getDefaults: getDefaults$1,
	  changeDefaults: changeDefaults$1
	};

	/**
	 * Helpers
	 */

	const escapeTest = /[&<>"']/;
	const escapeReplace = /[&<>"']/g;
	const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
	const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
	const escapeReplacements = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  "'": '&#39;'
	};
	const getEscapeReplacement = (ch) => escapeReplacements[ch];
	function escape$3(html, encode) {
	  if (encode) {
	    if (escapeTest.test(html)) {
	      return html.replace(escapeReplace, getEscapeReplacement);
	    }
	  } else {
	    if (escapeTestNoEncode.test(html)) {
	      return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
	    }
	  }

	  return html;
	}

	const unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

	function unescape$1(html) {
	  // explicitly match decimal, hex, and named HTML entities
	  return html.replace(unescapeTest, (_, n) => {
	    n = n.toLowerCase();
	    if (n === 'colon') return ':';
	    if (n.charAt(0) === '#') {
	      return n.charAt(1) === 'x'
	        ? String.fromCharCode(parseInt(n.substring(2), 16))
	        : String.fromCharCode(+n.substring(1));
	    }
	    return '';
	  });
	}

	const caret = /(^|[^\[])\^/g;
	function edit$1(regex, opt) {
	  regex = regex.source || regex;
	  opt = opt || '';
	  const obj = {
	    replace: (name, val) => {
	      val = val.source || val;
	      val = val.replace(caret, '$1');
	      regex = regex.replace(name, val);
	      return obj;
	    },
	    getRegex: () => {
	      return new RegExp(regex, opt);
	    }
	  };
	  return obj;
	}

	const nonWordAndColonTest = /[^\w:]/g;
	const originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
	function cleanUrl$1(sanitize, base, href) {
	  if (sanitize) {
	    let prot;
	    try {
	      prot = decodeURIComponent(unescape$1(href))
	        .replace(nonWordAndColonTest, '')
	        .toLowerCase();
	    } catch (e) {
	      return null;
	    }
	    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
	      return null;
	    }
	  }
	  if (base && !originIndependentUrl.test(href)) {
	    href = resolveUrl(base, href);
	  }
	  try {
	    href = encodeURI(href).replace(/%25/g, '%');
	  } catch (e) {
	    return null;
	  }
	  return href;
	}

	const baseUrls = {};
	const justDomain = /^[^:]+:\/*[^/]*$/;
	const protocol = /^([^:]+:)[\s\S]*$/;
	const domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

	function resolveUrl(base, href) {
	  if (!baseUrls[' ' + base]) {
	    // we can ignore everything in base after the last slash of its path component,
	    // but we might need to add _that_
	    // https://tools.ietf.org/html/rfc3986#section-3
	    if (justDomain.test(base)) {
	      baseUrls[' ' + base] = base + '/';
	    } else {
	      baseUrls[' ' + base] = rtrim$1(base, '/', true);
	    }
	  }
	  base = baseUrls[' ' + base];
	  const relativeBase = base.indexOf(':') === -1;

	  if (href.substring(0, 2) === '//') {
	    if (relativeBase) {
	      return href;
	    }
	    return base.replace(protocol, '$1') + href;
	  } else if (href.charAt(0) === '/') {
	    if (relativeBase) {
	      return href;
	    }
	    return base.replace(domain, '$1') + href;
	  } else {
	    return base + href;
	  }
	}

	const noopTest$1 = { exec: function noopTest() {} };

	function merge$2(obj) {
	  let i = 1,
	    target,
	    key;

	  for (; i < arguments.length; i++) {
	    target = arguments[i];
	    for (key in target) {
	      if (Object.prototype.hasOwnProperty.call(target, key)) {
	        obj[key] = target[key];
	      }
	    }
	  }

	  return obj;
	}

	function splitCells$1(tableRow, count) {
	  // ensure that every cell-delimiting pipe has a space
	  // before it to distinguish it from an escaped pipe
	  const row = tableRow.replace(/\|/g, (match, offset, str) => {
	      let escaped = false,
	        curr = offset;
	      while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
	      if (escaped) {
	        // odd number of slashes means | is escaped
	        // so we leave it alone
	        return '|';
	      } else {
	        // add space before unescaped |
	        return ' |';
	      }
	    }),
	    cells = row.split(/ \|/);
	  let i = 0;

	  // First/last cell in a row cannot be empty if it has no leading/trailing pipe
	  if (!cells[0].trim()) { cells.shift(); }
	  if (!cells[cells.length - 1].trim()) { cells.pop(); }

	  if (cells.length > count) {
	    cells.splice(count);
	  } else {
	    while (cells.length < count) cells.push('');
	  }

	  for (; i < cells.length; i++) {
	    // leading or trailing whitespace is ignored per the gfm spec
	    cells[i] = cells[i].trim().replace(/\\\|/g, '|');
	  }
	  return cells;
	}

	// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
	// /c*$/ is vulnerable to REDOS.
	// invert: Remove suffix of non-c chars instead. Default falsey.
	function rtrim$1(str, c, invert) {
	  const l = str.length;
	  if (l === 0) {
	    return '';
	  }

	  // Length of suffix matching the invert condition.
	  let suffLen = 0;

	  // Step left until we fail to match the invert condition.
	  while (suffLen < l) {
	    const currChar = str.charAt(l - suffLen - 1);
	    if (currChar === c && !invert) {
	      suffLen++;
	    } else if (currChar !== c && invert) {
	      suffLen++;
	    } else {
	      break;
	    }
	  }

	  return str.substr(0, l - suffLen);
	}

	function findClosingBracket$1(str, b) {
	  if (str.indexOf(b[1]) === -1) {
	    return -1;
	  }
	  const l = str.length;
	  let level = 0,
	    i = 0;
	  for (; i < l; i++) {
	    if (str[i] === '\\') {
	      i++;
	    } else if (str[i] === b[0]) {
	      level++;
	    } else if (str[i] === b[1]) {
	      level--;
	      if (level < 0) {
	        return i;
	      }
	    }
	  }
	  return -1;
	}

	function checkSanitizeDeprecation$1(opt) {
	  if (opt && opt.sanitize && !opt.silent) {
	    console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
	  }
	}

	// copied from https://stackoverflow.com/a/5450113/806777
	function repeatString$1(pattern, count) {
	  if (count < 1) {
	    return '';
	  }
	  let result = '';
	  while (count > 1) {
	    if (count & 1) {
	      result += pattern;
	    }
	    count >>= 1;
	    pattern += pattern;
	  }
	  return result + pattern;
	}

	var helpers = {
	  escape: escape$3,
	  unescape: unescape$1,
	  edit: edit$1,
	  cleanUrl: cleanUrl$1,
	  resolveUrl,
	  noopTest: noopTest$1,
	  merge: merge$2,
	  splitCells: splitCells$1,
	  rtrim: rtrim$1,
	  findClosingBracket: findClosingBracket$1,
	  checkSanitizeDeprecation: checkSanitizeDeprecation$1,
	  repeatString: repeatString$1
	};

	const { defaults: defaults$4 } = defaults$5.exports;
	const {
	  rtrim,
	  splitCells,
	  escape: escape$2,
	  findClosingBracket
	} = helpers;

	function outputLink(cap, link, raw, lexer) {
	  const href = link.href;
	  const title = link.title ? escape$2(link.title) : null;
	  const text = cap[1].replace(/\\([\[\]])/g, '$1');

	  if (cap[0].charAt(0) !== '!') {
	    lexer.state.inLink = true;
	    const token = {
	      type: 'link',
	      raw,
	      href,
	      title,
	      text,
	      tokens: lexer.inlineTokens(text, [])
	    };
	    lexer.state.inLink = false;
	    return token;
	  } else {
	    return {
	      type: 'image',
	      raw,
	      href,
	      title,
	      text: escape$2(text)
	    };
	  }
	}

	function indentCodeCompensation(raw, text) {
	  const matchIndentToCode = raw.match(/^(\s+)(?:```)/);

	  if (matchIndentToCode === null) {
	    return text;
	  }

	  const indentToCode = matchIndentToCode[1];

	  return text
	    .split('\n')
	    .map(node => {
	      const matchIndentInNode = node.match(/^\s+/);
	      if (matchIndentInNode === null) {
	        return node;
	      }

	      const [indentInNode] = matchIndentInNode;

	      if (indentInNode.length >= indentToCode.length) {
	        return node.slice(indentToCode.length);
	      }

	      return node;
	    })
	    .join('\n');
	}

	/**
	 * Tokenizer
	 */
	var Tokenizer_1 = class Tokenizer {
	  constructor(options) {
	    this.options = options || defaults$4;
	  }

	  space(src) {
	    const cap = this.rules.block.newline.exec(src);
	    if (cap) {
	      if (cap[0].length > 1) {
	        return {
	          type: 'space',
	          raw: cap[0]
	        };
	      }
	      return { raw: '\n' };
	    }
	  }

	  code(src) {
	    const cap = this.rules.block.code.exec(src);
	    if (cap) {
	      const text = cap[0].replace(/^ {1,4}/gm, '');
	      return {
	        type: 'code',
	        raw: cap[0],
	        codeBlockStyle: 'indented',
	        text: !this.options.pedantic
	          ? rtrim(text, '\n')
	          : text
	      };
	    }
	  }

	  fences(src) {
	    const cap = this.rules.block.fences.exec(src);
	    if (cap) {
	      const raw = cap[0];
	      const text = indentCodeCompensation(raw, cap[3] || '');

	      return {
	        type: 'code',
	        raw,
	        lang: cap[2] ? cap[2].trim() : cap[2],
	        text
	      };
	    }
	  }

	  heading(src) {
	    const cap = this.rules.block.heading.exec(src);
	    if (cap) {
	      let text = cap[2].trim();

	      // remove trailing #s
	      if (/#$/.test(text)) {
	        const trimmed = rtrim(text, '#');
	        if (this.options.pedantic) {
	          text = trimmed.trim();
	        } else if (!trimmed || / $/.test(trimmed)) {
	          // CommonMark requires space before trailing #s
	          text = trimmed.trim();
	        }
	      }

	      const token = {
	        type: 'heading',
	        raw: cap[0],
	        depth: cap[1].length,
	        text: text,
	        tokens: []
	      };
	      this.lexer.inline(token.text, token.tokens);
	      return token;
	    }
	  }

	  hr(src) {
	    const cap = this.rules.block.hr.exec(src);
	    if (cap) {
	      return {
	        type: 'hr',
	        raw: cap[0]
	      };
	    }
	  }

	  blockquote(src) {
	    const cap = this.rules.block.blockquote.exec(src);
	    if (cap) {
	      const text = cap[0].replace(/^ *> ?/gm, '');

	      return {
	        type: 'blockquote',
	        raw: cap[0],
	        tokens: this.lexer.blockTokens(text, []),
	        text
	      };
	    }
	  }

	  list(src) {
	    let cap = this.rules.block.list.exec(src);
	    if (cap) {
	      let raw, istask, ischecked, indent, i, blankLine, endsWithBlankLine,
	        line, lines, itemContents;

	      let bull = cap[1].trim();
	      const isordered = bull.length > 1;

	      const list = {
	        type: 'list',
	        raw: '',
	        ordered: isordered,
	        start: isordered ? +bull.slice(0, -1) : '',
	        loose: false,
	        items: []
	      };

	      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;

	      if (this.options.pedantic) {
	        bull = isordered ? bull : '[*+-]';
	      }

	      // Get next list item
	      const itemRegex = new RegExp(`^( {0,3}${bull})((?: [^\\n]*| *)(?:\\n[^\\n]*)*(?:\\n|$))`);

	      // Get each top-level item
	      while (src) {
	        if (this.rules.block.hr.test(src)) { // End list if we encounter an HR (possibly move into itemRegex?)
	          break;
	        }

	        if (!(cap = itemRegex.exec(src))) {
	          break;
	        }

	        lines = cap[2].split('\n');

	        if (this.options.pedantic) {
	          indent = 2;
	          itemContents = lines[0].trimLeft();
	        } else {
	          indent = cap[2].search(/[^ ]/); // Find first non-space char
	          indent = cap[1].length + (indent > 4 ? 1 : indent); // intented code blocks after 4 spaces; indent is always 1
	          itemContents = lines[0].slice(indent - cap[1].length);
	        }

	        blankLine = false;
	        raw = cap[0];

	        if (!lines[0] && /^ *$/.test(lines[1])) { // items begin with at most one blank line
	          raw = cap[1] + lines.slice(0, 2).join('\n') + '\n';
	          list.loose = true;
	          lines = [];
	        }

	        const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])`);

	        for (i = 1; i < lines.length; i++) {
	          line = lines[i];

	          if (this.options.pedantic) { // Re-align to follow commonmark nesting rules
	            line = line.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
	          }

	          // End list item if found start of new bullet
	          if (nextBulletRegex.test(line)) {
	            raw = cap[1] + lines.slice(0, i).join('\n') + '\n';
	            break;
	          }

	          // Until we encounter a blank line, item contents do not need indentation
	          if (!blankLine) {
	            if (!line.trim()) { // Check if current line is empty
	              blankLine = true;
	            }

	            // Dedent if possible
	            if (line.search(/[^ ]/) >= indent) {
	              itemContents += '\n' + line.slice(indent);
	            } else {
	              itemContents += '\n' + line;
	            }
	            continue;
	          }

	          // Dedent this line
	          if (line.search(/[^ ]/) >= indent || !line.trim()) {
	            itemContents += '\n' + line.slice(indent);
	            continue;
	          } else { // Line was not properly indented; end of this item
	            raw = cap[1] + lines.slice(0, i).join('\n') + '\n';
	            break;
	          }
	        }

	        if (!list.loose) {
	          // If the previous item ended with a blank line, the list is loose
	          if (endsWithBlankLine) {
	            list.loose = true;
	          } else if (/\n *\n *$/.test(raw)) {
	            endsWithBlankLine = true;
	          }
	        }

	        // Check for task list items
	        if (this.options.gfm) {
	          istask = /^\[[ xX]\] /.exec(itemContents);
	          if (istask) {
	            ischecked = istask[0] !== '[ ] ';
	            itemContents = itemContents.replace(/^\[[ xX]\] +/, '');
	          }
	        }

	        list.items.push({
	          type: 'list_item',
	          raw: raw,
	          task: !!istask,
	          checked: ischecked,
	          loose: false,
	          text: itemContents
	        });

	        list.raw += raw;
	        src = src.slice(raw.length);
	      }

	      // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic
	      list.items[list.items.length - 1].raw = raw.trimRight();
	      list.items[list.items.length - 1].text = itemContents.trimRight();
	      list.raw = list.raw.trimRight();

	      const l = list.items.length;

	      // Item child tokens handled here at end because we needed to have the final item to trim it first
	      for (i = 0; i < l; i++) {
	        this.lexer.state.top = false;
	        list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);
	        if (list.items[i].tokens.some(t => t.type === 'space')) {
	          list.loose = true;
	          list.items[i].loose = true;
	        }
	      }

	      return list;
	    }
	  }

	  html(src) {
	    const cap = this.rules.block.html.exec(src);
	    if (cap) {
	      const token = {
	        type: 'html',
	        raw: cap[0],
	        pre: !this.options.sanitizer
	          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
	        text: cap[0]
	      };
	      if (this.options.sanitize) {
	        token.type = 'paragraph';
	        token.text = this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape$2(cap[0]);
	        token.tokens = [];
	        this.lexer.inline(token.text, token.tokens);
	      }
	      return token;
	    }
	  }

	  def(src) {
	    const cap = this.rules.block.def.exec(src);
	    if (cap) {
	      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
	      const tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
	      return {
	        type: 'def',
	        tag,
	        raw: cap[0],
	        href: cap[2],
	        title: cap[3]
	      };
	    }
	  }

	  table(src) {
	    const cap = this.rules.block.table.exec(src);
	    if (cap) {
	      const item = {
	        type: 'table',
	        header: splitCells(cap[1]).map(c => { return { text: c }; }),
	        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
	        rows: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
	      };

	      if (item.header.length === item.align.length) {
	        item.raw = cap[0];

	        let l = item.align.length;
	        let i, j, k, row;
	        for (i = 0; i < l; i++) {
	          if (/^ *-+: *$/.test(item.align[i])) {
	            item.align[i] = 'right';
	          } else if (/^ *:-+: *$/.test(item.align[i])) {
	            item.align[i] = 'center';
	          } else if (/^ *:-+ *$/.test(item.align[i])) {
	            item.align[i] = 'left';
	          } else {
	            item.align[i] = null;
	          }
	        }

	        l = item.rows.length;
	        for (i = 0; i < l; i++) {
	          item.rows[i] = splitCells(item.rows[i], item.header.length).map(c => { return { text: c }; });
	        }

	        // parse child tokens inside headers and cells

	        // header child tokens
	        l = item.header.length;
	        for (j = 0; j < l; j++) {
	          item.header[j].tokens = [];
	          this.lexer.inlineTokens(item.header[j].text, item.header[j].tokens);
	        }

	        // cell child tokens
	        l = item.rows.length;
	        for (j = 0; j < l; j++) {
	          row = item.rows[j];
	          for (k = 0; k < row.length; k++) {
	            row[k].tokens = [];
	            this.lexer.inlineTokens(row[k].text, row[k].tokens);
	          }
	        }

	        return item;
	      }
	    }
	  }

	  lheading(src) {
	    const cap = this.rules.block.lheading.exec(src);
	    if (cap) {
	      const token = {
	        type: 'heading',
	        raw: cap[0],
	        depth: cap[2].charAt(0) === '=' ? 1 : 2,
	        text: cap[1],
	        tokens: []
	      };
	      this.lexer.inline(token.text, token.tokens);
	      return token;
	    }
	  }

	  paragraph(src) {
	    const cap = this.rules.block.paragraph.exec(src);
	    if (cap) {
	      const token = {
	        type: 'paragraph',
	        raw: cap[0],
	        text: cap[1].charAt(cap[1].length - 1) === '\n'
	          ? cap[1].slice(0, -1)
	          : cap[1],
	        tokens: []
	      };
	      this.lexer.inline(token.text, token.tokens);
	      return token;
	    }
	  }

	  text(src) {
	    const cap = this.rules.block.text.exec(src);
	    if (cap) {
	      const token = {
	        type: 'text',
	        raw: cap[0],
	        text: cap[0],
	        tokens: []
	      };
	      this.lexer.inline(token.text, token.tokens);
	      return token;
	    }
	  }

	  escape(src) {
	    const cap = this.rules.inline.escape.exec(src);
	    if (cap) {
	      return {
	        type: 'escape',
	        raw: cap[0],
	        text: escape$2(cap[1])
	      };
	    }
	  }

	  tag(src) {
	    const cap = this.rules.inline.tag.exec(src);
	    if (cap) {
	      if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
	        this.lexer.state.inLink = true;
	      } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
	        this.lexer.state.inLink = false;
	      }
	      if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
	        this.lexer.state.inRawBlock = true;
	      } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
	        this.lexer.state.inRawBlock = false;
	      }

	      return {
	        type: this.options.sanitize
	          ? 'text'
	          : 'html',
	        raw: cap[0],
	        inLink: this.lexer.state.inLink,
	        inRawBlock: this.lexer.state.inRawBlock,
	        text: this.options.sanitize
	          ? (this.options.sanitizer
	            ? this.options.sanitizer(cap[0])
	            : escape$2(cap[0]))
	          : cap[0]
	      };
	    }
	  }

	  link(src) {
	    const cap = this.rules.inline.link.exec(src);
	    if (cap) {
	      const trimmedUrl = cap[2].trim();
	      if (!this.options.pedantic && /^</.test(trimmedUrl)) {
	        // commonmark requires matching angle brackets
	        if (!(/>$/.test(trimmedUrl))) {
	          return;
	        }

	        // ending angle bracket cannot be escaped
	        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');
	        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
	          return;
	        }
	      } else {
	        // find closing parenthesis
	        const lastParenIndex = findClosingBracket(cap[2], '()');
	        if (lastParenIndex > -1) {
	          const start = cap[0].indexOf('!') === 0 ? 5 : 4;
	          const linkLen = start + cap[1].length + lastParenIndex;
	          cap[2] = cap[2].substring(0, lastParenIndex);
	          cap[0] = cap[0].substring(0, linkLen).trim();
	          cap[3] = '';
	        }
	      }
	      let href = cap[2];
	      let title = '';
	      if (this.options.pedantic) {
	        // split pedantic href and title
	        const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

	        if (link) {
	          href = link[1];
	          title = link[3];
	        }
	      } else {
	        title = cap[3] ? cap[3].slice(1, -1) : '';
	      }

	      href = href.trim();
	      if (/^</.test(href)) {
	        if (this.options.pedantic && !(/>$/.test(trimmedUrl))) {
	          // pedantic allows starting angle bracket without ending angle bracket
	          href = href.slice(1);
	        } else {
	          href = href.slice(1, -1);
	        }
	      }
	      return outputLink(cap, {
	        href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
	        title: title ? title.replace(this.rules.inline._escapes, '$1') : title
	      }, cap[0], this.lexer);
	    }
	  }

	  reflink(src, links) {
	    let cap;
	    if ((cap = this.rules.inline.reflink.exec(src))
	        || (cap = this.rules.inline.nolink.exec(src))) {
	      let link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
	      link = links[link.toLowerCase()];
	      if (!link || !link.href) {
	        const text = cap[0].charAt(0);
	        return {
	          type: 'text',
	          raw: text,
	          text
	        };
	      }
	      return outputLink(cap, link, cap[0], this.lexer);
	    }
	  }

	  emStrong(src, maskedSrc, prevChar = '') {
	    let match = this.rules.inline.emStrong.lDelim.exec(src);
	    if (!match) return;

	    // _ can't be between two alphanumerics. \p{L}\p{N} includes non-english alphabet/numbers as well
	    if (match[3] && prevChar.match(/[\p{L}\p{N}]/u)) return;

	    const nextChar = match[1] || match[2] || '';

	    if (!nextChar || (nextChar && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar)))) {
	      const lLength = match[0].length - 1;
	      let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;

	      const endReg = match[0][0] === '*' ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
	      endReg.lastIndex = 0;

	      // Clip maskedSrc to same section of string as src (move to lexer?)
	      maskedSrc = maskedSrc.slice(-1 * src.length + lLength);

	      while ((match = endReg.exec(maskedSrc)) != null) {
	        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];

	        if (!rDelim) continue; // skip single * in __abc*abc__

	        rLength = rDelim.length;

	        if (match[3] || match[4]) { // found another Left Delim
	          delimTotal += rLength;
	          continue;
	        } else if (match[5] || match[6]) { // either Left or Right Delim
	          if (lLength % 3 && !((lLength + rLength) % 3)) {
	            midDelimTotal += rLength;
	            continue; // CommonMark Emphasis Rules 9-10
	          }
	        }

	        delimTotal -= rLength;

	        if (delimTotal > 0) continue; // Haven't found enough closing delimiters

	        // Remove extra characters. *a*** -> *a*
	        rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);

	        // Create `em` if smallest delimiter has odd char count. *a***
	        if (Math.min(lLength, rLength) % 2) {
	          const text = src.slice(1, lLength + match.index + rLength);
	          return {
	            type: 'em',
	            raw: src.slice(0, lLength + match.index + rLength + 1),
	            text,
	            tokens: this.lexer.inlineTokens(text, [])
	          };
	        }

	        // Create 'strong' if smallest delimiter has even char count. **a***
	        const text = src.slice(2, lLength + match.index + rLength - 1);
	        return {
	          type: 'strong',
	          raw: src.slice(0, lLength + match.index + rLength + 1),
	          text,
	          tokens: this.lexer.inlineTokens(text, [])
	        };
	      }
	    }
	  }

	  codespan(src) {
	    const cap = this.rules.inline.code.exec(src);
	    if (cap) {
	      let text = cap[2].replace(/\n/g, ' ');
	      const hasNonSpaceChars = /[^ ]/.test(text);
	      const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
	      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
	        text = text.substring(1, text.length - 1);
	      }
	      text = escape$2(text, true);
	      return {
	        type: 'codespan',
	        raw: cap[0],
	        text
	      };
	    }
	  }

	  br(src) {
	    const cap = this.rules.inline.br.exec(src);
	    if (cap) {
	      return {
	        type: 'br',
	        raw: cap[0]
	      };
	    }
	  }

	  del(src) {
	    const cap = this.rules.inline.del.exec(src);
	    if (cap) {
	      return {
	        type: 'del',
	        raw: cap[0],
	        text: cap[2],
	        tokens: this.lexer.inlineTokens(cap[2], [])
	      };
	    }
	  }

	  autolink(src, mangle) {
	    const cap = this.rules.inline.autolink.exec(src);
	    if (cap) {
	      let text, href;
	      if (cap[2] === '@') {
	        text = escape$2(this.options.mangle ? mangle(cap[1]) : cap[1]);
	        href = 'mailto:' + text;
	      } else {
	        text = escape$2(cap[1]);
	        href = text;
	      }

	      return {
	        type: 'link',
	        raw: cap[0],
	        text,
	        href,
	        tokens: [
	          {
	            type: 'text',
	            raw: text,
	            text
	          }
	        ]
	      };
	    }
	  }

	  url(src, mangle) {
	    let cap;
	    if (cap = this.rules.inline.url.exec(src)) {
	      let text, href;
	      if (cap[2] === '@') {
	        text = escape$2(this.options.mangle ? mangle(cap[0]) : cap[0]);
	        href = 'mailto:' + text;
	      } else {
	        // do extended autolink path validation
	        let prevCapZero;
	        do {
	          prevCapZero = cap[0];
	          cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
	        } while (prevCapZero !== cap[0]);
	        text = escape$2(cap[0]);
	        if (cap[1] === 'www.') {
	          href = 'http://' + text;
	        } else {
	          href = text;
	        }
	      }
	      return {
	        type: 'link',
	        raw: cap[0],
	        text,
	        href,
	        tokens: [
	          {
	            type: 'text',
	            raw: text,
	            text
	          }
	        ]
	      };
	    }
	  }

	  inlineText(src, smartypants) {
	    const cap = this.rules.inline.text.exec(src);
	    if (cap) {
	      let text;
	      if (this.lexer.state.inRawBlock) {
	        text = this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape$2(cap[0])) : cap[0];
	      } else {
	        text = escape$2(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
	      }
	      return {
	        type: 'text',
	        raw: cap[0],
	        text
	      };
	    }
	  }
	};

	const {
	  noopTest,
	  edit,
	  merge: merge$1
	} = helpers;

	/**
	 * Block-Level Grammar
	 */
	const block$1 = {
	  newline: /^(?: *(?:\n|$))+/,
	  code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
	  fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
	  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
	  heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
	  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
	  list: /^( {0,3}bull)( [^\n]+?)?(?:\n|$)/,
	  html: '^ {0,3}(?:' // optional indentation
	    + '<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
	    + '|comment[^\\n]*(\\n+|$)' // (2)
	    + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
	    + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
	    + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
	    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (6)
	    + '|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) open tag
	    + '|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) closing tag
	    + ')',
	  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
	  table: noopTest,
	  lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
	  // regex template, placeholders will be replaced according to different paragraph
	  // interruption rules of commonmark and the original markdown spec:
	  _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html| +\n)[^\n]+)*)/,
	  text: /^[^\n]+/
	};

	block$1._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
	block$1._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
	block$1.def = edit(block$1.def)
	  .replace('label', block$1._label)
	  .replace('title', block$1._title)
	  .getRegex();

	block$1.bullet = /(?:[*+-]|\d{1,9}[.)])/;
	block$1.listItemStart = edit(/^( *)(bull) */)
	  .replace('bull', block$1.bullet)
	  .getRegex();

	block$1.list = edit(block$1.list)
	  .replace(/bull/g, block$1.bullet)
	  .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
	  .replace('def', '\\n+(?=' + block$1.def.source + ')')
	  .getRegex();

	block$1._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
	  + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
	  + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
	  + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
	  + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
	  + '|track|ul';
	block$1._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
	block$1.html = edit(block$1.html, 'i')
	  .replace('comment', block$1._comment)
	  .replace('tag', block$1._tag)
	  .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
	  .getRegex();

	block$1.paragraph = edit(block$1._paragraph)
	  .replace('hr', block$1.hr)
	  .replace('heading', ' {0,3}#{1,6} ')
	  .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
	  .replace('blockquote', ' {0,3}>')
	  .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
	  .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
	  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
	  .replace('tag', block$1._tag) // pars can be interrupted by type (6) html blocks
	  .getRegex();

	block$1.blockquote = edit(block$1.blockquote)
	  .replace('paragraph', block$1.paragraph)
	  .getRegex();

	/**
	 * Normal Block Grammar
	 */

	block$1.normal = merge$1({}, block$1);

	/**
	 * GFM Block Grammar
	 */

	block$1.gfm = merge$1({}, block$1.normal, {
	  table: '^ *([^\\n ].*\\|.*)\\n' // Header
	    + ' {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?' // Align
	    + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells
	});

	block$1.gfm.table = edit(block$1.gfm.table)
	  .replace('hr', block$1.hr)
	  .replace('heading', ' {0,3}#{1,6} ')
	  .replace('blockquote', ' {0,3}>')
	  .replace('code', ' {4}[^\\n]')
	  .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
	  .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
	  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
	  .replace('tag', block$1._tag) // tables can be interrupted by type (6) html blocks
	  .getRegex();

	/**
	 * Pedantic grammar (original John Gruber's loose markdown specification)
	 */

	block$1.pedantic = merge$1({}, block$1.normal, {
	  html: edit(
	    '^ *(?:comment *(?:\\n|\\s*$)'
	    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
	    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
	    .replace('comment', block$1._comment)
	    .replace(/tag/g, '(?!(?:'
	      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
	      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
	      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
	    .getRegex(),
	  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	  heading: /^(#{1,6})(.*)(?:\n+|$)/,
	  fences: noopTest, // fences not supported
	  paragraph: edit(block$1.normal._paragraph)
	    .replace('hr', block$1.hr)
	    .replace('heading', ' *#{1,6} *[^\n]')
	    .replace('lheading', block$1.lheading)
	    .replace('blockquote', ' {0,3}>')
	    .replace('|fences', '')
	    .replace('|list', '')
	    .replace('|html', '')
	    .getRegex()
	});

	/**
	 * Inline-Level Grammar
	 */
	const inline$1 = {
	  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
	  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
	  url: noopTest,
	  tag: '^comment'
	    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
	    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
	    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
	    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
	    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
	  link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
	  reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
	  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
	  reflinkSearch: 'reflink|nolink(?!\\()',
	  emStrong: {
	    lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
	    //        (1) and (2) can only be a Right Delimiter. (3) and (4) can only be Left.  (5) and (6) can be either Left or Right.
	    //        () Skip other delimiter (1) #***                   (2) a***#, a***                   (3) #***a, ***a                 (4) ***#              (5) #***#                 (6) a***a
	    rDelimAst: /\_\_[^_*]*?\*[^_*]*?\_\_|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
	    rDelimUnd: /\*\*[^_*]*?\_[^_*]*?\*\*|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/ // ^- Not allowed for _
	  },
	  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
	  br: /^( {2,}|\\)\n(?!\s*$)/,
	  del: noopTest,
	  text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
	  punctuation: /^([\spunctuation])/
	};

	// list of punctuation marks from CommonMark spec
	// without * and _ to handle the different emphasis markers * and _
	inline$1._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
	inline$1.punctuation = edit(inline$1.punctuation).replace(/punctuation/g, inline$1._punctuation).getRegex();

	// sequences em should skip over [title](link), `code`, <html>
	inline$1.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
	inline$1.escapedEmSt = /\\\*|\\_/g;

	inline$1._comment = edit(block$1._comment).replace('(?:-->|$)', '-->').getRegex();

	inline$1.emStrong.lDelim = edit(inline$1.emStrong.lDelim)
	  .replace(/punct/g, inline$1._punctuation)
	  .getRegex();

	inline$1.emStrong.rDelimAst = edit(inline$1.emStrong.rDelimAst, 'g')
	  .replace(/punct/g, inline$1._punctuation)
	  .getRegex();

	inline$1.emStrong.rDelimUnd = edit(inline$1.emStrong.rDelimUnd, 'g')
	  .replace(/punct/g, inline$1._punctuation)
	  .getRegex();

	inline$1._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

	inline$1._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
	inline$1._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
	inline$1.autolink = edit(inline$1.autolink)
	  .replace('scheme', inline$1._scheme)
	  .replace('email', inline$1._email)
	  .getRegex();

	inline$1._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

	inline$1.tag = edit(inline$1.tag)
	  .replace('comment', inline$1._comment)
	  .replace('attribute', inline$1._attribute)
	  .getRegex();

	inline$1._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
	inline$1._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
	inline$1._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

	inline$1.link = edit(inline$1.link)
	  .replace('label', inline$1._label)
	  .replace('href', inline$1._href)
	  .replace('title', inline$1._title)
	  .getRegex();

	inline$1.reflink = edit(inline$1.reflink)
	  .replace('label', inline$1._label)
	  .getRegex();

	inline$1.reflinkSearch = edit(inline$1.reflinkSearch, 'g')
	  .replace('reflink', inline$1.reflink)
	  .replace('nolink', inline$1.nolink)
	  .getRegex();

	/**
	 * Normal Inline Grammar
	 */

	inline$1.normal = merge$1({}, inline$1);

	/**
	 * Pedantic Inline Grammar
	 */

	inline$1.pedantic = merge$1({}, inline$1.normal, {
	  strong: {
	    start: /^__|\*\*/,
	    middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
	    endAst: /\*\*(?!\*)/g,
	    endUnd: /__(?!_)/g
	  },
	  em: {
	    start: /^_|\*/,
	    middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
	    endAst: /\*(?!\*)/g,
	    endUnd: /_(?!_)/g
	  },
	  link: edit(/^!?\[(label)\]\((.*?)\)/)
	    .replace('label', inline$1._label)
	    .getRegex(),
	  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
	    .replace('label', inline$1._label)
	    .getRegex()
	});

	/**
	 * GFM Inline Grammar
	 */

	inline$1.gfm = merge$1({}, inline$1.normal, {
	  escape: edit(inline$1.escape).replace('])', '~|])').getRegex(),
	  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
	  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
	  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
	  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
	  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
	});

	inline$1.gfm.url = edit(inline$1.gfm.url, 'i')
	  .replace('email', inline$1.gfm._extended_email)
	  .getRegex();
	/**
	 * GFM + Line Breaks Inline Grammar
	 */

	inline$1.breaks = merge$1({}, inline$1.gfm, {
	  br: edit(inline$1.br).replace('{2,}', '*').getRegex(),
	  text: edit(inline$1.gfm.text)
	    .replace('\\b_', '\\b_| {2,}\\n')
	    .replace(/\{2,\}/g, '*')
	    .getRegex()
	});

	var rules = {
	  block: block$1,
	  inline: inline$1
	};

	const Tokenizer$1 = Tokenizer_1;
	const { defaults: defaults$3 } = defaults$5.exports;
	const { block, inline } = rules;
	const { repeatString } = helpers;

	/**
	 * smartypants text replacement
	 */
	function smartypants(text) {
	  return text
	    // em-dashes
	    .replace(/---/g, '\u2014')
	    // en-dashes
	    .replace(/--/g, '\u2013')
	    // opening singles
	    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
	    // closing singles & apostrophes
	    .replace(/'/g, '\u2019')
	    // opening doubles
	    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
	    // closing doubles
	    .replace(/"/g, '\u201d')
	    // ellipses
	    .replace(/\.{3}/g, '\u2026');
	}

	/**
	 * mangle email addresses
	 */
	function mangle(text) {
	  let out = '',
	    i,
	    ch;

	  const l = text.length;
	  for (i = 0; i < l; i++) {
	    ch = text.charCodeAt(i);
	    if (Math.random() > 0.5) {
	      ch = 'x' + ch.toString(16);
	    }
	    out += '&#' + ch + ';';
	  }

	  return out;
	}

	/**
	 * Block Lexer
	 */
	var Lexer_1 = class Lexer {
	  constructor(options) {
	    this.tokens = [];
	    this.tokens.links = Object.create(null);
	    this.options = options || defaults$3;
	    this.options.tokenizer = this.options.tokenizer || new Tokenizer$1();
	    this.tokenizer = this.options.tokenizer;
	    this.tokenizer.options = this.options;
	    this.tokenizer.lexer = this;
	    this.inlineQueue = [];
	    this.state = {
	      inLink: false,
	      inRawBlock: false,
	      top: true
	    };

	    const rules = {
	      block: block.normal,
	      inline: inline.normal
	    };

	    if (this.options.pedantic) {
	      rules.block = block.pedantic;
	      rules.inline = inline.pedantic;
	    } else if (this.options.gfm) {
	      rules.block = block.gfm;
	      if (this.options.breaks) {
	        rules.inline = inline.breaks;
	      } else {
	        rules.inline = inline.gfm;
	      }
	    }
	    this.tokenizer.rules = rules;
	  }

	  /**
	   * Expose Rules
	   */
	  static get rules() {
	    return {
	      block,
	      inline
	    };
	  }

	  /**
	   * Static Lex Method
	   */
	  static lex(src, options) {
	    const lexer = new Lexer(options);
	    return lexer.lex(src);
	  }

	  /**
	   * Static Lex Inline Method
	   */
	  static lexInline(src, options) {
	    const lexer = new Lexer(options);
	    return lexer.inlineTokens(src);
	  }

	  /**
	   * Preprocessing
	   */
	  lex(src) {
	    src = src
	      .replace(/\r\n|\r/g, '\n')
	      .replace(/\t/g, '    ');

	    this.blockTokens(src, this.tokens);

	    let next;
	    while (next = this.inlineQueue.shift()) {
	      this.inlineTokens(next.src, next.tokens);
	    }

	    return this.tokens;
	  }

	  /**
	   * Lexing
	   */
	  blockTokens(src, tokens = []) {
	    if (this.options.pedantic) {
	      src = src.replace(/^ +$/gm, '');
	    }
	    let token, lastToken, cutSrc, lastParagraphClipped;

	    while (src) {
	      if (this.options.extensions
	        && this.options.extensions.block
	        && this.options.extensions.block.some((extTokenizer) => {
	          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
	            src = src.substring(token.raw.length);
	            tokens.push(token);
	            return true;
	          }
	          return false;
	        })) {
	        continue;
	      }

	      // newline
	      if (token = this.tokenizer.space(src)) {
	        src = src.substring(token.raw.length);
	        if (token.type) {
	          tokens.push(token);
	        }
	        continue;
	      }

	      // code
	      if (token = this.tokenizer.code(src)) {
	        src = src.substring(token.raw.length);
	        lastToken = tokens[tokens.length - 1];
	        // An indented code block cannot interrupt a paragraph.
	        if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
	          lastToken.raw += '\n' + token.raw;
	          lastToken.text += '\n' + token.text;
	          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
	        } else {
	          tokens.push(token);
	        }
	        continue;
	      }

	      // fences
	      if (token = this.tokenizer.fences(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // heading
	      if (token = this.tokenizer.heading(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // hr
	      if (token = this.tokenizer.hr(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // blockquote
	      if (token = this.tokenizer.blockquote(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // list
	      if (token = this.tokenizer.list(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // html
	      if (token = this.tokenizer.html(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // def
	      if (token = this.tokenizer.def(src)) {
	        src = src.substring(token.raw.length);
	        lastToken = tokens[tokens.length - 1];
	        if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
	          lastToken.raw += '\n' + token.raw;
	          lastToken.text += '\n' + token.raw;
	          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
	        } else if (!this.tokens.links[token.tag]) {
	          this.tokens.links[token.tag] = {
	            href: token.href,
	            title: token.title
	          };
	        }
	        continue;
	      }

	      // table (gfm)
	      if (token = this.tokenizer.table(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // lheading
	      if (token = this.tokenizer.lheading(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // top-level paragraph
	      // prevent paragraph consuming extensions by clipping 'src' to extension start
	      cutSrc = src;
	      if (this.options.extensions && this.options.extensions.startBlock) {
	        let startIndex = Infinity;
	        const tempSrc = src.slice(1);
	        let tempStart;
	        this.options.extensions.startBlock.forEach(function(getStartIndex) {
	          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
	          if (typeof tempStart === 'number' && tempStart >= 0) { startIndex = Math.min(startIndex, tempStart); }
	        });
	        if (startIndex < Infinity && startIndex >= 0) {
	          cutSrc = src.substring(0, startIndex + 1);
	        }
	      }
	      if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
	        lastToken = tokens[tokens.length - 1];
	        if (lastParagraphClipped && lastToken.type === 'paragraph') {
	          lastToken.raw += '\n' + token.raw;
	          lastToken.text += '\n' + token.text;
	          this.inlineQueue.pop();
	          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
	        } else {
	          tokens.push(token);
	        }
	        lastParagraphClipped = (cutSrc.length !== src.length);
	        src = src.substring(token.raw.length);
	        continue;
	      }

	      // text
	      if (token = this.tokenizer.text(src)) {
	        src = src.substring(token.raw.length);
	        lastToken = tokens[tokens.length - 1];
	        if (lastToken && lastToken.type === 'text') {
	          lastToken.raw += '\n' + token.raw;
	          lastToken.text += '\n' + token.text;
	          this.inlineQueue.pop();
	          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
	        } else {
	          tokens.push(token);
	        }
	        continue;
	      }

	      if (src) {
	        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
	        if (this.options.silent) {
	          console.error(errMsg);
	          break;
	        } else {
	          throw new Error(errMsg);
	        }
	      }
	    }

	    this.state.top = true;
	    return tokens;
	  }

	  inline(src, tokens) {
	    this.inlineQueue.push({ src, tokens });
	  }

	  /**
	   * Lexing/Compiling
	   */
	  inlineTokens(src, tokens = []) {
	    let token, lastToken, cutSrc;

	    // String with links masked to avoid interference with em and strong
	    let maskedSrc = src;
	    let match;
	    let keepPrevChar, prevChar;

	    // Mask out reflinks
	    if (this.tokens.links) {
	      const links = Object.keys(this.tokens.links);
	      if (links.length > 0) {
	        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
	          if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
	            maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
	          }
	        }
	      }
	    }
	    // Mask out other blocks
	    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
	      maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
	    }

	    // Mask out escaped em & strong delimiters
	    while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
	      maskedSrc = maskedSrc.slice(0, match.index) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
	    }

	    while (src) {
	      if (!keepPrevChar) {
	        prevChar = '';
	      }
	      keepPrevChar = false;

	      // extensions
	      if (this.options.extensions
	        && this.options.extensions.inline
	        && this.options.extensions.inline.some((extTokenizer) => {
	          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
	            src = src.substring(token.raw.length);
	            tokens.push(token);
	            return true;
	          }
	          return false;
	        })) {
	        continue;
	      }

	      // escape
	      if (token = this.tokenizer.escape(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // tag
	      if (token = this.tokenizer.tag(src)) {
	        src = src.substring(token.raw.length);
	        lastToken = tokens[tokens.length - 1];
	        if (lastToken && token.type === 'text' && lastToken.type === 'text') {
	          lastToken.raw += token.raw;
	          lastToken.text += token.text;
	        } else {
	          tokens.push(token);
	        }
	        continue;
	      }

	      // link
	      if (token = this.tokenizer.link(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // reflink, nolink
	      if (token = this.tokenizer.reflink(src, this.tokens.links)) {
	        src = src.substring(token.raw.length);
	        lastToken = tokens[tokens.length - 1];
	        if (lastToken && token.type === 'text' && lastToken.type === 'text') {
	          lastToken.raw += token.raw;
	          lastToken.text += token.text;
	        } else {
	          tokens.push(token);
	        }
	        continue;
	      }

	      // em & strong
	      if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // code
	      if (token = this.tokenizer.codespan(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // br
	      if (token = this.tokenizer.br(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // del (gfm)
	      if (token = this.tokenizer.del(src)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // autolink
	      if (token = this.tokenizer.autolink(src, mangle)) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // url (gfm)
	      if (!this.state.inLink && (token = this.tokenizer.url(src, mangle))) {
	        src = src.substring(token.raw.length);
	        tokens.push(token);
	        continue;
	      }

	      // text
	      // prevent inlineText consuming extensions by clipping 'src' to extension start
	      cutSrc = src;
	      if (this.options.extensions && this.options.extensions.startInline) {
	        let startIndex = Infinity;
	        const tempSrc = src.slice(1);
	        let tempStart;
	        this.options.extensions.startInline.forEach(function(getStartIndex) {
	          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
	          if (typeof tempStart === 'number' && tempStart >= 0) { startIndex = Math.min(startIndex, tempStart); }
	        });
	        if (startIndex < Infinity && startIndex >= 0) {
	          cutSrc = src.substring(0, startIndex + 1);
	        }
	      }
	      if (token = this.tokenizer.inlineText(cutSrc, smartypants)) {
	        src = src.substring(token.raw.length);
	        if (token.raw.slice(-1) !== '_') { // Track prevChar before string of ____ started
	          prevChar = token.raw.slice(-1);
	        }
	        keepPrevChar = true;
	        lastToken = tokens[tokens.length - 1];
	        if (lastToken && lastToken.type === 'text') {
	          lastToken.raw += token.raw;
	          lastToken.text += token.text;
	        } else {
	          tokens.push(token);
	        }
	        continue;
	      }

	      if (src) {
	        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
	        if (this.options.silent) {
	          console.error(errMsg);
	          break;
	        } else {
	          throw new Error(errMsg);
	        }
	      }
	    }

	    return tokens;
	  }
	};

	const { defaults: defaults$2 } = defaults$5.exports;
	const {
	  cleanUrl,
	  escape: escape$1
	} = helpers;

	/**
	 * Renderer
	 */
	var Renderer_1 = class Renderer {
	  constructor(options) {
	    this.options = options || defaults$2;
	  }

	  code(code, infostring, escaped) {
	    const lang = (infostring || '').match(/\S*/)[0];
	    if (this.options.highlight) {
	      const out = this.options.highlight(code, lang);
	      if (out != null && out !== code) {
	        escaped = true;
	        code = out;
	      }
	    }

	    code = code.replace(/\n$/, '') + '\n';

	    if (!lang) {
	      return '<pre><code>'
	        + (escaped ? code : escape$1(code, true))
	        + '</code></pre>\n';
	    }

	    return '<pre><code class="'
	      + this.options.langPrefix
	      + escape$1(lang, true)
	      + '">'
	      + (escaped ? code : escape$1(code, true))
	      + '</code></pre>\n';
	  }

	  blockquote(quote) {
	    return '<blockquote>\n' + quote + '</blockquote>\n';
	  }

	  html(html) {
	    return html;
	  }

	  heading(text, level, raw, slugger) {
	    if (this.options.headerIds) {
	      return '<h'
	        + level
	        + ' id="'
	        + this.options.headerPrefix
	        + slugger.slug(raw)
	        + '">'
	        + text
	        + '</h'
	        + level
	        + '>\n';
	    }
	    // ignore IDs
	    return '<h' + level + '>' + text + '</h' + level + '>\n';
	  }

	  hr() {
	    return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
	  }

	  list(body, ordered, start) {
	    const type = ordered ? 'ol' : 'ul',
	      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
	    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
	  }

	  listitem(text) {
	    return '<li>' + text + '</li>\n';
	  }

	  checkbox(checked) {
	    return '<input '
	      + (checked ? 'checked="" ' : '')
	      + 'disabled="" type="checkbox"'
	      + (this.options.xhtml ? ' /' : '')
	      + '> ';
	  }

	  paragraph(text) {
	    return '<p>' + text + '</p>\n';
	  }

	  table(header, body) {
	    if (body) body = '<tbody>' + body + '</tbody>';

	    return '<table>\n'
	      + '<thead>\n'
	      + header
	      + '</thead>\n'
	      + body
	      + '</table>\n';
	  }

	  tablerow(content) {
	    return '<tr>\n' + content + '</tr>\n';
	  }

	  tablecell(content, flags) {
	    const type = flags.header ? 'th' : 'td';
	    const tag = flags.align
	      ? '<' + type + ' align="' + flags.align + '">'
	      : '<' + type + '>';
	    return tag + content + '</' + type + '>\n';
	  }

	  // span level renderer
	  strong(text) {
	    return '<strong>' + text + '</strong>';
	  }

	  em(text) {
	    return '<em>' + text + '</em>';
	  }

	  codespan(text) {
	    return '<code>' + text + '</code>';
	  }

	  br() {
	    return this.options.xhtml ? '<br/>' : '<br>';
	  }

	  del(text) {
	    return '<del>' + text + '</del>';
	  }

	  link(href, title, text) {
	    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
	    if (href === null) {
	      return text;
	    }
	    let out = '<a href="' + escape$1(href) + '"';
	    if (title) {
	      out += ' title="' + title + '"';
	    }
	    out += '>' + text + '</a>';
	    return out;
	  }

	  image(href, title, text) {
	    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
	    if (href === null) {
	      return text;
	    }

	    let out = '<img src="' + href + '" alt="' + text + '"';
	    if (title) {
	      out += ' title="' + title + '"';
	    }
	    out += this.options.xhtml ? '/>' : '>';
	    return out;
	  }

	  text(text) {
	    return text;
	  }
	};

	/**
	 * TextRenderer
	 * returns only the textual part of the token
	 */

	var TextRenderer_1 = class TextRenderer {
	  // no need for block level renderers
	  strong(text) {
	    return text;
	  }

	  em(text) {
	    return text;
	  }

	  codespan(text) {
	    return text;
	  }

	  del(text) {
	    return text;
	  }

	  html(text) {
	    return text;
	  }

	  text(text) {
	    return text;
	  }

	  link(href, title, text) {
	    return '' + text;
	  }

	  image(href, title, text) {
	    return '' + text;
	  }

	  br() {
	    return '';
	  }
	};

	/**
	 * Slugger generates header id
	 */

	var Slugger_1 = class Slugger {
	  constructor() {
	    this.seen = {};
	  }

	  serialize(value) {
	    return value
	      .toLowerCase()
	      .trim()
	      // remove html tags
	      .replace(/<[!\/a-z].*?>/ig, '')
	      // remove unwanted chars
	      .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
	      .replace(/\s/g, '-');
	  }

	  /**
	   * Finds the next safe (unique) slug to use
	   */
	  getNextSafeSlug(originalSlug, isDryRun) {
	    let slug = originalSlug;
	    let occurenceAccumulator = 0;
	    if (this.seen.hasOwnProperty(slug)) {
	      occurenceAccumulator = this.seen[originalSlug];
	      do {
	        occurenceAccumulator++;
	        slug = originalSlug + '-' + occurenceAccumulator;
	      } while (this.seen.hasOwnProperty(slug));
	    }
	    if (!isDryRun) {
	      this.seen[originalSlug] = occurenceAccumulator;
	      this.seen[slug] = 0;
	    }
	    return slug;
	  }

	  /**
	   * Convert string to unique id
	   * @param {object} options
	   * @param {boolean} options.dryrun Generates the next unique slug without updating the internal accumulator.
	   */
	  slug(value, options = {}) {
	    const slug = this.serialize(value);
	    return this.getNextSafeSlug(slug, options.dryrun);
	  }
	};

	const Renderer$1 = Renderer_1;
	const TextRenderer$1 = TextRenderer_1;
	const Slugger$1 = Slugger_1;
	const { defaults: defaults$1 } = defaults$5.exports;
	const {
	  unescape
	} = helpers;

	/**
	 * Parsing & Compiling
	 */
	var Parser_1 = class Parser {
	  constructor(options) {
	    this.options = options || defaults$1;
	    this.options.renderer = this.options.renderer || new Renderer$1();
	    this.renderer = this.options.renderer;
	    this.renderer.options = this.options;
	    this.textRenderer = new TextRenderer$1();
	    this.slugger = new Slugger$1();
	  }

	  /**
	   * Static Parse Method
	   */
	  static parse(tokens, options) {
	    const parser = new Parser(options);
	    return parser.parse(tokens);
	  }

	  /**
	   * Static Parse Inline Method
	   */
	  static parseInline(tokens, options) {
	    const parser = new Parser(options);
	    return parser.parseInline(tokens);
	  }

	  /**
	   * Parse Loop
	   */
	  parse(tokens, top = true) {
	    let out = '',
	      i,
	      j,
	      k,
	      l2,
	      l3,
	      row,
	      cell,
	      header,
	      body,
	      token,
	      ordered,
	      start,
	      loose,
	      itemBody,
	      item,
	      checked,
	      task,
	      checkbox,
	      ret;

	    const l = tokens.length;
	    for (i = 0; i < l; i++) {
	      token = tokens[i];

	      // Run any renderer extensions
	      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
	        ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
	        if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(token.type)) {
	          out += ret || '';
	          continue;
	        }
	      }

	      switch (token.type) {
	        case 'space': {
	          continue;
	        }
	        case 'hr': {
	          out += this.renderer.hr();
	          continue;
	        }
	        case 'heading': {
	          out += this.renderer.heading(
	            this.parseInline(token.tokens),
	            token.depth,
	            unescape(this.parseInline(token.tokens, this.textRenderer)),
	            this.slugger);
	          continue;
	        }
	        case 'code': {
	          out += this.renderer.code(token.text,
	            token.lang,
	            token.escaped);
	          continue;
	        }
	        case 'table': {
	          header = '';

	          // header
	          cell = '';
	          l2 = token.header.length;
	          for (j = 0; j < l2; j++) {
	            cell += this.renderer.tablecell(
	              this.parseInline(token.header[j].tokens),
	              { header: true, align: token.align[j] }
	            );
	          }
	          header += this.renderer.tablerow(cell);

	          body = '';
	          l2 = token.rows.length;
	          for (j = 0; j < l2; j++) {
	            row = token.rows[j];

	            cell = '';
	            l3 = row.length;
	            for (k = 0; k < l3; k++) {
	              cell += this.renderer.tablecell(
	                this.parseInline(row[k].tokens),
	                { header: false, align: token.align[k] }
	              );
	            }

	            body += this.renderer.tablerow(cell);
	          }
	          out += this.renderer.table(header, body);
	          continue;
	        }
	        case 'blockquote': {
	          body = this.parse(token.tokens);
	          out += this.renderer.blockquote(body);
	          continue;
	        }
	        case 'list': {
	          ordered = token.ordered;
	          start = token.start;
	          loose = token.loose;
	          l2 = token.items.length;

	          body = '';
	          for (j = 0; j < l2; j++) {
	            item = token.items[j];
	            checked = item.checked;
	            task = item.task;

	            itemBody = '';
	            if (item.task) {
	              checkbox = this.renderer.checkbox(checked);
	              if (loose) {
	                if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
	                  item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
	                  if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
	                    item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
	                  }
	                } else {
	                  item.tokens.unshift({
	                    type: 'text',
	                    text: checkbox
	                  });
	                }
	              } else {
	                itemBody += checkbox;
	              }
	            }

	            itemBody += this.parse(item.tokens, loose);
	            body += this.renderer.listitem(itemBody, task, checked);
	          }

	          out += this.renderer.list(body, ordered, start);
	          continue;
	        }
	        case 'html': {
	          // TODO parse inline content if parameter markdown=1
	          out += this.renderer.html(token.text);
	          continue;
	        }
	        case 'paragraph': {
	          out += this.renderer.paragraph(this.parseInline(token.tokens));
	          continue;
	        }
	        case 'text': {
	          body = token.tokens ? this.parseInline(token.tokens) : token.text;
	          while (i + 1 < l && tokens[i + 1].type === 'text') {
	            token = tokens[++i];
	            body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
	          }
	          out += top ? this.renderer.paragraph(body) : body;
	          continue;
	        }

	        default: {
	          const errMsg = 'Token with "' + token.type + '" type was not found.';
	          if (this.options.silent) {
	            console.error(errMsg);
	            return;
	          } else {
	            throw new Error(errMsg);
	          }
	        }
	      }
	    }

	    return out;
	  }

	  /**
	   * Parse Inline Tokens
	   */
	  parseInline(tokens, renderer) {
	    renderer = renderer || this.renderer;
	    let out = '',
	      i,
	      token,
	      ret;

	    const l = tokens.length;
	    for (i = 0; i < l; i++) {
	      token = tokens[i];

	      // Run any renderer extensions
	      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
	        ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
	        if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(token.type)) {
	          out += ret || '';
	          continue;
	        }
	      }

	      switch (token.type) {
	        case 'escape': {
	          out += renderer.text(token.text);
	          break;
	        }
	        case 'html': {
	          out += renderer.html(token.text);
	          break;
	        }
	        case 'link': {
	          out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
	          break;
	        }
	        case 'image': {
	          out += renderer.image(token.href, token.title, token.text);
	          break;
	        }
	        case 'strong': {
	          out += renderer.strong(this.parseInline(token.tokens, renderer));
	          break;
	        }
	        case 'em': {
	          out += renderer.em(this.parseInline(token.tokens, renderer));
	          break;
	        }
	        case 'codespan': {
	          out += renderer.codespan(token.text);
	          break;
	        }
	        case 'br': {
	          out += renderer.br();
	          break;
	        }
	        case 'del': {
	          out += renderer.del(this.parseInline(token.tokens, renderer));
	          break;
	        }
	        case 'text': {
	          out += renderer.text(token.text);
	          break;
	        }
	        default: {
	          const errMsg = 'Token with "' + token.type + '" type was not found.';
	          if (this.options.silent) {
	            console.error(errMsg);
	            return;
	          } else {
	            throw new Error(errMsg);
	          }
	        }
	      }
	    }
	    return out;
	  }
	};

	const Lexer = Lexer_1;
	const Parser = Parser_1;
	const Tokenizer = Tokenizer_1;
	const Renderer = Renderer_1;
	const TextRenderer = TextRenderer_1;
	const Slugger = Slugger_1;
	const {
	  merge,
	  checkSanitizeDeprecation,
	  escape
	} = helpers;
	const {
	  getDefaults,
	  changeDefaults,
	  defaults
	} = defaults$5.exports;

	/**
	 * Marked
	 */
	function marked(src, opt, callback) {
	  // throw error in case of non string input
	  if (typeof src === 'undefined' || src === null) {
	    throw new Error('marked(): input parameter is undefined or null');
	  }
	  if (typeof src !== 'string') {
	    throw new Error('marked(): input parameter is of type '
	      + Object.prototype.toString.call(src) + ', string expected');
	  }

	  if (typeof opt === 'function') {
	    callback = opt;
	    opt = null;
	  }

	  opt = merge({}, marked.defaults, opt || {});
	  checkSanitizeDeprecation(opt);

	  if (callback) {
	    const highlight = opt.highlight;
	    let tokens;

	    try {
	      tokens = Lexer.lex(src, opt);
	    } catch (e) {
	      return callback(e);
	    }

	    const done = function(err) {
	      let out;

	      if (!err) {
	        try {
	          if (opt.walkTokens) {
	            marked.walkTokens(tokens, opt.walkTokens);
	          }
	          out = Parser.parse(tokens, opt);
	        } catch (e) {
	          err = e;
	        }
	      }

	      opt.highlight = highlight;

	      return err
	        ? callback(err)
	        : callback(null, out);
	    };

	    if (!highlight || highlight.length < 3) {
	      return done();
	    }

	    delete opt.highlight;

	    if (!tokens.length) return done();

	    let pending = 0;
	    marked.walkTokens(tokens, function(token) {
	      if (token.type === 'code') {
	        pending++;
	        setTimeout(() => {
	          highlight(token.text, token.lang, function(err, code) {
	            if (err) {
	              return done(err);
	            }
	            if (code != null && code !== token.text) {
	              token.text = code;
	              token.escaped = true;
	            }

	            pending--;
	            if (pending === 0) {
	              done();
	            }
	          });
	        }, 0);
	      }
	    });

	    if (pending === 0) {
	      done();
	    }

	    return;
	  }

	  try {
	    const tokens = Lexer.lex(src, opt);
	    if (opt.walkTokens) {
	      marked.walkTokens(tokens, opt.walkTokens);
	    }
	    return Parser.parse(tokens, opt);
	  } catch (e) {
	    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
	    if (opt.silent) {
	      return '<p>An error occurred:</p><pre>'
	        + escape(e.message + '', true)
	        + '</pre>';
	    }
	    throw e;
	  }
	}

	/**
	 * Options
	 */

	marked.options =
	marked.setOptions = function(opt) {
	  merge(marked.defaults, opt);
	  changeDefaults(marked.defaults);
	  return marked;
	};

	marked.getDefaults = getDefaults;

	marked.defaults = defaults;

	/**
	 * Use Extension
	 */

	marked.use = function(...args) {
	  const opts = merge({}, ...args);
	  const extensions = marked.defaults.extensions || { renderers: {}, childTokens: {} };
	  let hasExtensions;

	  args.forEach((pack) => {
	    // ==-- Parse "addon" extensions --== //
	    if (pack.extensions) {
	      hasExtensions = true;
	      pack.extensions.forEach((ext) => {
	        if (!ext.name) {
	          throw new Error('extension name required');
	        }
	        if (ext.renderer) { // Renderer extensions
	          const prevRenderer = extensions.renderers ? extensions.renderers[ext.name] : null;
	          if (prevRenderer) {
	            // Replace extension with func to run new extension but fall back if false
	            extensions.renderers[ext.name] = function(...args) {
	              let ret = ext.renderer.apply(this, args);
	              if (ret === false) {
	                ret = prevRenderer.apply(this, args);
	              }
	              return ret;
	            };
	          } else {
	            extensions.renderers[ext.name] = ext.renderer;
	          }
	        }
	        if (ext.tokenizer) { // Tokenizer Extensions
	          if (!ext.level || (ext.level !== 'block' && ext.level !== 'inline')) {
	            throw new Error("extension level must be 'block' or 'inline'");
	          }
	          if (extensions[ext.level]) {
	            extensions[ext.level].unshift(ext.tokenizer);
	          } else {
	            extensions[ext.level] = [ext.tokenizer];
	          }
	          if (ext.start) { // Function to check for start of token
	            if (ext.level === 'block') {
	              if (extensions.startBlock) {
	                extensions.startBlock.push(ext.start);
	              } else {
	                extensions.startBlock = [ext.start];
	              }
	            } else if (ext.level === 'inline') {
	              if (extensions.startInline) {
	                extensions.startInline.push(ext.start);
	              } else {
	                extensions.startInline = [ext.start];
	              }
	            }
	          }
	        }
	        if (ext.childTokens) { // Child tokens to be visited by walkTokens
	          extensions.childTokens[ext.name] = ext.childTokens;
	        }
	      });
	    }

	    // ==-- Parse "overwrite" extensions --== //
	    if (pack.renderer) {
	      const renderer = marked.defaults.renderer || new Renderer();
	      for (const prop in pack.renderer) {
	        const prevRenderer = renderer[prop];
	        // Replace renderer with func to run extension, but fall back if false
	        renderer[prop] = (...args) => {
	          let ret = pack.renderer[prop].apply(renderer, args);
	          if (ret === false) {
	            ret = prevRenderer.apply(renderer, args);
	          }
	          return ret;
	        };
	      }
	      opts.renderer = renderer;
	    }
	    if (pack.tokenizer) {
	      const tokenizer = marked.defaults.tokenizer || new Tokenizer();
	      for (const prop in pack.tokenizer) {
	        const prevTokenizer = tokenizer[prop];
	        // Replace tokenizer with func to run extension, but fall back if false
	        tokenizer[prop] = (...args) => {
	          let ret = pack.tokenizer[prop].apply(tokenizer, args);
	          if (ret === false) {
	            ret = prevTokenizer.apply(tokenizer, args);
	          }
	          return ret;
	        };
	      }
	      opts.tokenizer = tokenizer;
	    }

	    // ==-- Parse WalkTokens extensions --== //
	    if (pack.walkTokens) {
	      const walkTokens = marked.defaults.walkTokens;
	      opts.walkTokens = (token) => {
	        pack.walkTokens.call(this, token);
	        if (walkTokens) {
	          walkTokens(token);
	        }
	      };
	    }

	    if (hasExtensions) {
	      opts.extensions = extensions;
	    }

	    marked.setOptions(opts);
	  });
	};

	/**
	 * Run callback for every token
	 */

	marked.walkTokens = function(tokens, callback) {
	  for (const token of tokens) {
	    callback(token);
	    switch (token.type) {
	      case 'table': {
	        for (const cell of token.header) {
	          marked.walkTokens(cell.tokens, callback);
	        }
	        for (const row of token.rows) {
	          for (const cell of row) {
	            marked.walkTokens(cell.tokens, callback);
	          }
	        }
	        break;
	      }
	      case 'list': {
	        marked.walkTokens(token.items, callback);
	        break;
	      }
	      default: {
	        if (marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[token.type]) { // Walk any extensions
	          marked.defaults.extensions.childTokens[token.type].forEach(function(childTokens) {
	            marked.walkTokens(token[childTokens], callback);
	          });
	        } else if (token.tokens) {
	          marked.walkTokens(token.tokens, callback);
	        }
	      }
	    }
	  }
	};

	/**
	 * Parse Inline
	 */
	marked.parseInline = function(src, opt) {
	  // throw error in case of non string input
	  if (typeof src === 'undefined' || src === null) {
	    throw new Error('marked.parseInline(): input parameter is undefined or null');
	  }
	  if (typeof src !== 'string') {
	    throw new Error('marked.parseInline(): input parameter is of type '
	      + Object.prototype.toString.call(src) + ', string expected');
	  }

	  opt = merge({}, marked.defaults, opt || {});
	  checkSanitizeDeprecation(opt);

	  try {
	    const tokens = Lexer.lexInline(src, opt);
	    if (opt.walkTokens) {
	      marked.walkTokens(tokens, opt.walkTokens);
	    }
	    return Parser.parseInline(tokens, opt);
	  } catch (e) {
	    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
	    if (opt.silent) {
	      return '<p>An error occurred:</p><pre>'
	        + escape(e.message + '', true)
	        + '</pre>';
	    }
	    throw e;
	  }
	};

	/**
	 * Expose
	 */

	marked.Parser = Parser;
	marked.parser = Parser.parse;

	marked.Renderer = Renderer;
	marked.TextRenderer = TextRenderer;

	marked.Lexer = Lexer;
	marked.lexer = Lexer.lex;

	marked.Tokenizer = Tokenizer;

	marked.Slugger = Slugger;

	marked.parse = marked;

	var marked_1 = marked;

	const promolgate = [
		'top', 'middle', 'bottom',
		'left', 'center', 'centre', 'right'
	];


	//
	// Utilities
	//

	// NOTE: Only exported for testing
	function stripLeadingSpace(text) {
		const leadingSpaceMatches = text.match(/\n(\s*)\S/);
		if (leadingSpaceMatches) {
			const leadingSpace = leadingSpaceMatches[1];
			const breakAndLeadingSpace = RegExp('\n(' + leadingSpace + ')', 'g');
			return text.replace(breakAndLeadingSpace, '\n').trim()
		}
		return text
	}

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
			container.innerHTML = purify.sanitize(marked_1(markdown));
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
			if (hasStrictDataBoolean(slide, 'pause')) {
				makeDirectlyContainedElementsPausable(slide);
			}
			for (const thing of slide.querySelectorAll('[data-pause]')) {
				makeDirectlyContainedElementsPausable(thing);
			}
		}
	}

	function makeDirectlyContainedElementsPausable(thing) {
		for (const step of thing.children) {
			// If this step contains only one element, and _that_ element has
			// [data-pause] too, then we shouldn't make this one pausable, as it'll
			// end up with a double-pause.
			const containsOnePausableThing =
				step.children.length === 1 &&
				hasStrictDataBoolean(step.children[0], 'pause');

			if (!step.classList.contains('story') && !containsOnePausableThing) {
				step.setAttribute('data-story-slides-step', '');
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
	// Split sections are given the CSS classes part-<number> and also
	// part-(even|odd) as appropriate.
	//
	// If the slide had one of the 'promolgate' classes listed above, then the
	// split parts will recieve this too. This is done partly in code and partly in
	// CSS to keep both as simple as possible.
	//
	// Splitting only some of the content of a slide is supported.
	// TODO: IS IT?

	function doSplits() {
		const containers = document.querySelectorAll('[data-split]');
		let allOK = true;

		for (const container of containers) {
			const elements = Array.from(container.children);
			const numNonStoryElements = elements.filter((element) => {
				return !element.classList.contains('story')
			}).length;

			const splitSizes = hasStrictDataBoolean(container, 'split')
				? []
				: container.dataset.split.split(' ');

			const percentages = splitSizes.length > 0
				? checkSplitSizesAndCreateFlexBases(
					container, numNonStoryElements, splitSizes)
				: [];

			if (percentages) {
				processSplitContainer(container, percentages, elements);
			} else {
				allOK = false;
			}
		}

		return allOK
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
			return null
		}

		const isSizeSpecifiers = splitSizes.every(
			(value) => value === '*' || value === '-');

		if (isSizeSpecifiers) {
			return splitSizes.map((value) => value === '*' ? '100%' : '0%')
		}

		let sum = 0;
		const isPercentages = splitSizes.every((value) => {
			const gotNum = Number(value.slice(0, -1));
			if (gotNum) {
				sum += gotNum;
				return true
			}
			return false
		});

		if (!isPercentages) {
			error('Given data-split value is not a valid list of size specifiers nor percentages:', splitSizes, 'for', container);
			return null
		}

		if (sum !== 100) {
			error("Given data-split percentages don't add up to 100:", splitSizes, 'for', container);
			return null
		}

		return splitSizes
	}

	function processSplitContainer(container, flexBases, elements) {
		let counter = 0;

		for (const child of elements) {  // don't iterate over live collection
			if (!child.classList.contains('story')) {
				// Create a flexbox with author-requested height
				const splitCounter = counter + 1;  // the first split part is odd
				const box = document.createElement('DIV');  // check case in others
				box.classList.add(`part-${splitCounter}`);
				const parity = splitCounter % 2 ? 'odd' : 'even';
				box.classList.add('part-' + parity);
				box.appendChild(child);

				if (flexBases.length > 0) {
					box.style.flexBasis = flexBases[counter];
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
	// NOTE: This assumes that if you have a <figure> acting as a slide, you don't
	//       want any padding.
	function makeWrappersForPadding(slides) {
		const noPaddingSlides = Array.from(slides).filter((slide) =>
			slide.tagName !== 'FIGURE' && !slide.classList.contains('no-padding'));

		for (const slide of noPaddingSlides) {
			const elements = Array.from(slide.children).filter((element) =>
				window.getComputedStyle(element).position !== 'absolute');

			for (let i = 0; i < elements.length; i++) {
				const element = elements[i];

				if (!element.classList.contains('story')) {
					const wrapper = document.createElement('DIV');

					const classes = [];
					if (i === 0) classes.push('padding-wrapper-first');
					if (i < elements.length - 1 || i > 0) classes.push('padding-wrapper-middle');
					if (i === elements.length - 1) classes.push('padding-wrapper-last');
					for (const className of classes) {
						wrapper.classList.add(className);
					}

					for (const cssClass of promolgate) {
						if (element.classList.contains(cssClass)) {
							element.classList.remove(cssClass);
							wrapper.classList.add(cssClass);
						}
					}

					wrapper.appendChild(element);
					slide.appendChild(wrapper);
				} else {
					// As per the similar note above: preserve DOM order for story
					// mode content.
					slide.appendChild(element);
				}
			}
		}
	}

	// Note: checking for overflowing slide content is done when a slide is
	// shown, as it requires the layout to be known. Therefore that check is
	// done above.

	function checkDOMNoDuplidateIds() {
		const allIds = Array.from(document.querySelectorAll('[id]'), (e) => e.id);
		const uniqueIds = new Set(allIds);
		if (allIds.length > uniqueIds.size) {
			error('Duplicate element IDs detected');
			return false
		}
		return true
	}

	function checkDOMElements() {
		const check = [
			'story-slides-announcer',
			'story-slides-button-fullscreen',
			'story-slides-button-help-keys',
			'story-slides-button-menu',
			'story-slides-button-mode-slides',
			'story-slides-button-mode-story',
			'story-slides-button-next',
			'story-slides-button-previous',
			'story-slides-dialog-keys',
			'story-slides-dialog-keys-title',
			'story-slides-dialog-menu',
			'story-slides-main-content',
			'story-slides-mode-slides-explainer',
			'story-slides-mode-slides-explainer-container',
			'story-slides-mode-story-explainer',
			'story-slides-progress',
			'story-slides-screen-errors',
			'story-slides-screen-intro',
			'story-slides-screen-intro-heading',
			'story-slides-screen-loading',
			'story-slides-slides-container',
			'story-slides-top-ui'
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

	function checkDOMValidSlideElements(slides) {
		const allowedTagNames = new Set([ 'DIV', 'SECTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' ]);

		const tagNameValidity = slides.map((slide) => {
			if (!allowedTagNames.has(slide.tagName)) {
				error(`Slide made out of element '${slide.tagName}' is not supported. Must be one of:`, allowedTagNames);
				return false
			}
			return true
		});

		return tagNameValidity.every((result) => result === true)
	}

	function checkDOMSlideContainment(slides) {
		const container = document.getElementById('story-slides-slides-container');
		const message = "The number of children of the slides container isn't the same as the number of slides. This could be due to putting story mode content outside of slides, having some slides outside of the slides contianer, or having other non-slide elements inside the container.";

		if (slides.length !== container.children.length) {
			error(message);
			return false
		}

		return true
	}

	function checkSlidesModeSettings() {
		const slideAspectRaw = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--slide-aspect-ratio');
		const aspectOK = checkGivenAspect(slideAspectRaw);

		const rootFontSizePercent = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--slide-font-height-percent-of-slide');
		const fontSizeOK = checkGivenFontSize(rootFontSizePercent);

		return aspectOK && fontSizeOK
	}

	// NOTE: Only exported for testing
	function checkGivenAspect(aspect) {
		if (!aspect) {
			error('Slide aspect ratio not given in CSS custom property --slide-aspect-ratio');
			return false
		}

		const matches = aspect.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
		if (!matches?.[1] || !matches?.[2]) {
			error('Slide aspect ratio not given in expected format "calc( x / y )"');
			return false
		}

		return true
	}

	// NOTE: Only exported for testing
	function checkGivenFontSize(size) {
		if (!size) {
			error('Font size not given in CSS custom property --slide-font-height-percent-of-slide');
			return false
		}
		const convertedSize = Number(size);
		return !isNaN(convertedSize)
	}

	// Checks that are done on the DOM and can therefore be done in any mode
	function lintDOM(slides) {
		return checkDOMNoDuplidateIds()
			&& checkDOMElements()
			&& checkDOMValidSlideElements(slides)
			&& checkDOMSlideContainment(slides)
	}

	// Checks that must be done with slides mode CSS active
	function lintSlides() {
		// TODO check for the padding variables - or provide defaults via internal
		//      names in the theme instead?
		return checkSlidesModeSettings()
	}

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * This work is licensed under the W3C Software and Document License
	 * (http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document).
	 */

	(function () {
	  // Return early if we're not running inside of the browser.
	  if (typeof window === 'undefined') {
	    return;
	  }

	  // Convenience function for converting NodeLists.
	  /** @type {typeof Array.prototype.slice} */
	  var slice = Array.prototype.slice;

	  /**
	   * IE has a non-standard name for "matches".
	   * @type {typeof Element.prototype.matches}
	   */
	  var matches = Element.prototype.matches || Element.prototype.msMatchesSelector;

	  /** @type {string} */
	  var _focusableElementsString = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'details', 'summary', 'iframe', 'object', 'embed', '[contenteditable]'].join(',');

	  /**
	   * `InertRoot` manages a single inert subtree, i.e. a DOM subtree whose root element has an `inert`
	   * attribute.
	   *
	   * Its main functions are:
	   *
	   * - to create and maintain a set of managed `InertNode`s, including when mutations occur in the
	   *   subtree. The `makeSubtreeUnfocusable()` method handles collecting `InertNode`s via registering
	   *   each focusable node in the subtree with the singleton `InertManager` which manages all known
	   *   focusable nodes within inert subtrees. `InertManager` ensures that a single `InertNode`
	   *   instance exists for each focusable node which has at least one inert root as an ancestor.
	   *
	   * - to notify all managed `InertNode`s when this subtree stops being inert (i.e. when the `inert`
	   *   attribute is removed from the root node). This is handled in the destructor, which calls the
	   *   `deregister` method on `InertManager` for each managed inert node.
	   */

	  var InertRoot = function () {
	    /**
	     * @param {!Element} rootElement The Element at the root of the inert subtree.
	     * @param {!InertManager} inertManager The global singleton InertManager object.
	     */
	    function InertRoot(rootElement, inertManager) {
	      _classCallCheck(this, InertRoot);

	      /** @type {!InertManager} */
	      this._inertManager = inertManager;

	      /** @type {!Element} */
	      this._rootElement = rootElement;

	      /**
	       * @type {!Set<!InertNode>}
	       * All managed focusable nodes in this InertRoot's subtree.
	       */
	      this._managedNodes = new Set();

	      // Make the subtree hidden from assistive technology
	      if (this._rootElement.hasAttribute('aria-hidden')) {
	        /** @type {?string} */
	        this._savedAriaHidden = this._rootElement.getAttribute('aria-hidden');
	      } else {
	        this._savedAriaHidden = null;
	      }
	      this._rootElement.setAttribute('aria-hidden', 'true');

	      // Make all focusable elements in the subtree unfocusable and add them to _managedNodes
	      this._makeSubtreeUnfocusable(this._rootElement);

	      // Watch for:
	      // - any additions in the subtree: make them unfocusable too
	      // - any removals from the subtree: remove them from this inert root's managed nodes
	      // - attribute changes: if `tabindex` is added, or removed from an intrinsically focusable
	      //   element, make that node a managed node.
	      this._observer = new MutationObserver(this._onMutation.bind(this));
	      this._observer.observe(this._rootElement, { attributes: true, childList: true, subtree: true });
	    }

	    /**
	     * Call this whenever this object is about to become obsolete.  This unwinds all of the state
	     * stored in this object and updates the state of all of the managed nodes.
	     */


	    _createClass(InertRoot, [{
	      key: 'destructor',
	      value: function destructor() {
	        this._observer.disconnect();

	        if (this._rootElement) {
	          if (this._savedAriaHidden !== null) {
	            this._rootElement.setAttribute('aria-hidden', this._savedAriaHidden);
	          } else {
	            this._rootElement.removeAttribute('aria-hidden');
	          }
	        }

	        this._managedNodes.forEach(function (inertNode) {
	          this._unmanageNode(inertNode.node);
	        }, this);

	        // Note we cast the nulls to the ANY type here because:
	        // 1) We want the class properties to be declared as non-null, or else we
	        //    need even more casts throughout this code. All bets are off if an
	        //    instance has been destroyed and a method is called.
	        // 2) We don't want to cast "this", because we want type-aware optimizations
	        //    to know which properties we're setting.
	        this._observer = /** @type {?} */null;
	        this._rootElement = /** @type {?} */null;
	        this._managedNodes = /** @type {?} */null;
	        this._inertManager = /** @type {?} */null;
	      }

	      /**
	       * @return {!Set<!InertNode>} A copy of this InertRoot's managed nodes set.
	       */

	    }, {
	      key: '_makeSubtreeUnfocusable',


	      /**
	       * @param {!Node} startNode
	       */
	      value: function _makeSubtreeUnfocusable(startNode) {
	        var _this2 = this;

	        composedTreeWalk(startNode, function (node) {
	          return _this2._visitNode(node);
	        });

	        var activeElement = document.activeElement;

	        if (!document.body.contains(startNode)) {
	          // startNode may be in shadow DOM, so find its nearest shadowRoot to get the activeElement.
	          var node = startNode;
	          /** @type {!ShadowRoot|undefined} */
	          var root = undefined;
	          while (node) {
	            if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
	              root = /** @type {!ShadowRoot} */node;
	              break;
	            }
	            node = node.parentNode;
	          }
	          if (root) {
	            activeElement = root.activeElement;
	          }
	        }
	        if (startNode.contains(activeElement)) {
	          activeElement.blur();
	          // In IE11, if an element is already focused, and then set to tabindex=-1
	          // calling blur() will not actually move the focus.
	          // To work around this we call focus() on the body instead.
	          if (activeElement === document.activeElement) {
	            document.body.focus();
	          }
	        }
	      }

	      /**
	       * @param {!Node} node
	       */

	    }, {
	      key: '_visitNode',
	      value: function _visitNode(node) {
	        if (node.nodeType !== Node.ELEMENT_NODE) {
	          return;
	        }
	        var element = /** @type {!Element} */node;

	        // If a descendant inert root becomes un-inert, its descendants will still be inert because of
	        // this inert root, so all of its managed nodes need to be adopted by this InertRoot.
	        if (element !== this._rootElement && element.hasAttribute('inert')) {
	          this._adoptInertRoot(element);
	        }

	        if (matches.call(element, _focusableElementsString) || element.hasAttribute('tabindex')) {
	          this._manageNode(element);
	        }
	      }

	      /**
	       * Register the given node with this InertRoot and with InertManager.
	       * @param {!Node} node
	       */

	    }, {
	      key: '_manageNode',
	      value: function _manageNode(node) {
	        var inertNode = this._inertManager.register(node, this);
	        this._managedNodes.add(inertNode);
	      }

	      /**
	       * Unregister the given node with this InertRoot and with InertManager.
	       * @param {!Node} node
	       */

	    }, {
	      key: '_unmanageNode',
	      value: function _unmanageNode(node) {
	        var inertNode = this._inertManager.deregister(node, this);
	        if (inertNode) {
	          this._managedNodes['delete'](inertNode);
	        }
	      }

	      /**
	       * Unregister the entire subtree starting at `startNode`.
	       * @param {!Node} startNode
	       */

	    }, {
	      key: '_unmanageSubtree',
	      value: function _unmanageSubtree(startNode) {
	        var _this3 = this;

	        composedTreeWalk(startNode, function (node) {
	          return _this3._unmanageNode(node);
	        });
	      }

	      /**
	       * If a descendant node is found with an `inert` attribute, adopt its managed nodes.
	       * @param {!Element} node
	       */

	    }, {
	      key: '_adoptInertRoot',
	      value: function _adoptInertRoot(node) {
	        var inertSubroot = this._inertManager.getInertRoot(node);

	        // During initialisation this inert root may not have been registered yet,
	        // so register it now if need be.
	        if (!inertSubroot) {
	          this._inertManager.setInert(node, true);
	          inertSubroot = this._inertManager.getInertRoot(node);
	        }

	        inertSubroot.managedNodes.forEach(function (savedInertNode) {
	          this._manageNode(savedInertNode.node);
	        }, this);
	      }

	      /**
	       * Callback used when mutation observer detects subtree additions, removals, or attribute changes.
	       * @param {!Array<!MutationRecord>} records
	       * @param {!MutationObserver} self
	       */

	    }, {
	      key: '_onMutation',
	      value: function _onMutation(records, self) {
	        records.forEach(function (record) {
	          var target = /** @type {!Element} */record.target;
	          if (record.type === 'childList') {
	            // Manage added nodes
	            slice.call(record.addedNodes).forEach(function (node) {
	              this._makeSubtreeUnfocusable(node);
	            }, this);

	            // Un-manage removed nodes
	            slice.call(record.removedNodes).forEach(function (node) {
	              this._unmanageSubtree(node);
	            }, this);
	          } else if (record.type === 'attributes') {
	            if (record.attributeName === 'tabindex') {
	              // Re-initialise inert node if tabindex changes
	              this._manageNode(target);
	            } else if (target !== this._rootElement && record.attributeName === 'inert' && target.hasAttribute('inert')) {
	              // If a new inert root is added, adopt its managed nodes and make sure it knows about the
	              // already managed nodes from this inert subroot.
	              this._adoptInertRoot(target);
	              var inertSubroot = this._inertManager.getInertRoot(target);
	              this._managedNodes.forEach(function (managedNode) {
	                if (target.contains(managedNode.node)) {
	                  inertSubroot._manageNode(managedNode.node);
	                }
	              });
	            }
	          }
	        }, this);
	      }
	    }, {
	      key: 'managedNodes',
	      get: function get() {
	        return new Set(this._managedNodes);
	      }

	      /** @return {boolean} */

	    }, {
	      key: 'hasSavedAriaHidden',
	      get: function get() {
	        return this._savedAriaHidden !== null;
	      }

	      /** @param {?string} ariaHidden */

	    }, {
	      key: 'savedAriaHidden',
	      set: function set(ariaHidden) {
	        this._savedAriaHidden = ariaHidden;
	      }

	      /** @return {?string} */
	      ,
	      get: function get() {
	        return this._savedAriaHidden;
	      }
	    }]);

	    return InertRoot;
	  }();

	  /**
	   * `InertNode` initialises and manages a single inert node.
	   * A node is inert if it is a descendant of one or more inert root elements.
	   *
	   * On construction, `InertNode` saves the existing `tabindex` value for the node, if any, and
	   * either removes the `tabindex` attribute or sets it to `-1`, depending on whether the element
	   * is intrinsically focusable or not.
	   *
	   * `InertNode` maintains a set of `InertRoot`s which are descendants of this `InertNode`. When an
	   * `InertRoot` is destroyed, and calls `InertManager.deregister()`, the `InertManager` notifies the
	   * `InertNode` via `removeInertRoot()`, which in turn destroys the `InertNode` if no `InertRoot`s
	   * remain in the set. On destruction, `InertNode` reinstates the stored `tabindex` if one exists,
	   * or removes the `tabindex` attribute if the element is intrinsically focusable.
	   */


	  var InertNode = function () {
	    /**
	     * @param {!Node} node A focusable element to be made inert.
	     * @param {!InertRoot} inertRoot The inert root element associated with this inert node.
	     */
	    function InertNode(node, inertRoot) {
	      _classCallCheck(this, InertNode);

	      /** @type {!Node} */
	      this._node = node;

	      /** @type {boolean} */
	      this._overrodeFocusMethod = false;

	      /**
	       * @type {!Set<!InertRoot>} The set of descendant inert roots.
	       *    If and only if this set becomes empty, this node is no longer inert.
	       */
	      this._inertRoots = new Set([inertRoot]);

	      /** @type {?number} */
	      this._savedTabIndex = null;

	      /** @type {boolean} */
	      this._destroyed = false;

	      // Save any prior tabindex info and make this node untabbable
	      this.ensureUntabbable();
	    }

	    /**
	     * Call this whenever this object is about to become obsolete.
	     * This makes the managed node focusable again and deletes all of the previously stored state.
	     */


	    _createClass(InertNode, [{
	      key: 'destructor',
	      value: function destructor() {
	        this._throwIfDestroyed();

	        if (this._node && this._node.nodeType === Node.ELEMENT_NODE) {
	          var element = /** @type {!Element} */this._node;
	          if (this._savedTabIndex !== null) {
	            element.setAttribute('tabindex', this._savedTabIndex);
	          } else {
	            element.removeAttribute('tabindex');
	          }

	          // Use `delete` to restore native focus method.
	          if (this._overrodeFocusMethod) {
	            delete element.focus;
	          }
	        }

	        // See note in InertRoot.destructor for why we cast these nulls to ANY.
	        this._node = /** @type {?} */null;
	        this._inertRoots = /** @type {?} */null;
	        this._destroyed = true;
	      }

	      /**
	       * @type {boolean} Whether this object is obsolete because the managed node is no longer inert.
	       * If the object has been destroyed, any attempt to access it will cause an exception.
	       */

	    }, {
	      key: '_throwIfDestroyed',


	      /**
	       * Throw if user tries to access destroyed InertNode.
	       */
	      value: function _throwIfDestroyed() {
	        if (this.destroyed) {
	          throw new Error('Trying to access destroyed InertNode');
	        }
	      }

	      /** @return {boolean} */

	    }, {
	      key: 'ensureUntabbable',


	      /** Save the existing tabindex value and make the node untabbable and unfocusable */
	      value: function ensureUntabbable() {
	        if (this.node.nodeType !== Node.ELEMENT_NODE) {
	          return;
	        }
	        var element = /** @type {!Element} */this.node;
	        if (matches.call(element, _focusableElementsString)) {
	          if ( /** @type {!HTMLElement} */element.tabIndex === -1 && this.hasSavedTabIndex) {
	            return;
	          }

	          if (element.hasAttribute('tabindex')) {
	            this._savedTabIndex = /** @type {!HTMLElement} */element.tabIndex;
	          }
	          element.setAttribute('tabindex', '-1');
	          if (element.nodeType === Node.ELEMENT_NODE) {
	            element.focus = function () {};
	            this._overrodeFocusMethod = true;
	          }
	        } else if (element.hasAttribute('tabindex')) {
	          this._savedTabIndex = /** @type {!HTMLElement} */element.tabIndex;
	          element.removeAttribute('tabindex');
	        }
	      }

	      /**
	       * Add another inert root to this inert node's set of managing inert roots.
	       * @param {!InertRoot} inertRoot
	       */

	    }, {
	      key: 'addInertRoot',
	      value: function addInertRoot(inertRoot) {
	        this._throwIfDestroyed();
	        this._inertRoots.add(inertRoot);
	      }

	      /**
	       * Remove the given inert root from this inert node's set of managing inert roots.
	       * If the set of managing inert roots becomes empty, this node is no longer inert,
	       * so the object should be destroyed.
	       * @param {!InertRoot} inertRoot
	       */

	    }, {
	      key: 'removeInertRoot',
	      value: function removeInertRoot(inertRoot) {
	        this._throwIfDestroyed();
	        this._inertRoots['delete'](inertRoot);
	        if (this._inertRoots.size === 0) {
	          this.destructor();
	        }
	      }
	    }, {
	      key: 'destroyed',
	      get: function get() {
	        return (/** @type {!InertNode} */this._destroyed
	        );
	      }
	    }, {
	      key: 'hasSavedTabIndex',
	      get: function get() {
	        return this._savedTabIndex !== null;
	      }

	      /** @return {!Node} */

	    }, {
	      key: 'node',
	      get: function get() {
	        this._throwIfDestroyed();
	        return this._node;
	      }

	      /** @param {?number} tabIndex */

	    }, {
	      key: 'savedTabIndex',
	      set: function set(tabIndex) {
	        this._throwIfDestroyed();
	        this._savedTabIndex = tabIndex;
	      }

	      /** @return {?number} */
	      ,
	      get: function get() {
	        this._throwIfDestroyed();
	        return this._savedTabIndex;
	      }
	    }]);

	    return InertNode;
	  }();

	  /**
	   * InertManager is a per-document singleton object which manages all inert roots and nodes.
	   *
	   * When an element becomes an inert root by having an `inert` attribute set and/or its `inert`
	   * property set to `true`, the `setInert` method creates an `InertRoot` object for the element.
	   * The `InertRoot` in turn registers itself as managing all of the element's focusable descendant
	   * nodes via the `register()` method. The `InertManager` ensures that a single `InertNode` instance
	   * is created for each such node, via the `_managedNodes` map.
	   */


	  var InertManager = function () {
	    /**
	     * @param {!Document} document
	     */
	    function InertManager(document) {
	      _classCallCheck(this, InertManager);

	      if (!document) {
	        throw new Error('Missing required argument; InertManager needs to wrap a document.');
	      }

	      /** @type {!Document} */
	      this._document = document;

	      /**
	       * All managed nodes known to this InertManager. In a map to allow looking up by Node.
	       * @type {!Map<!Node, !InertNode>}
	       */
	      this._managedNodes = new Map();

	      /**
	       * All inert roots known to this InertManager. In a map to allow looking up by Node.
	       * @type {!Map<!Node, !InertRoot>}
	       */
	      this._inertRoots = new Map();

	      /**
	       * Observer for mutations on `document.body`.
	       * @type {!MutationObserver}
	       */
	      this._observer = new MutationObserver(this._watchForInert.bind(this));

	      // Add inert style.
	      addInertStyle(document.head || document.body || document.documentElement);

	      // Wait for document to be loaded.
	      if (document.readyState === 'loading') {
	        document.addEventListener('DOMContentLoaded', this._onDocumentLoaded.bind(this));
	      } else {
	        this._onDocumentLoaded();
	      }
	    }

	    /**
	     * Set whether the given element should be an inert root or not.
	     * @param {!Element} root
	     * @param {boolean} inert
	     */


	    _createClass(InertManager, [{
	      key: 'setInert',
	      value: function setInert(root, inert) {
	        if (inert) {
	          if (this._inertRoots.has(root)) {
	            // element is already inert
	            return;
	          }

	          var inertRoot = new InertRoot(root, this);
	          root.setAttribute('inert', '');
	          this._inertRoots.set(root, inertRoot);
	          // If not contained in the document, it must be in a shadowRoot.
	          // Ensure inert styles are added there.
	          if (!this._document.body.contains(root)) {
	            var parent = root.parentNode;
	            while (parent) {
	              if (parent.nodeType === 11) {
	                addInertStyle(parent);
	              }
	              parent = parent.parentNode;
	            }
	          }
	        } else {
	          if (!this._inertRoots.has(root)) {
	            // element is already non-inert
	            return;
	          }

	          var _inertRoot = this._inertRoots.get(root);
	          _inertRoot.destructor();
	          this._inertRoots['delete'](root);
	          root.removeAttribute('inert');
	        }
	      }

	      /**
	       * Get the InertRoot object corresponding to the given inert root element, if any.
	       * @param {!Node} element
	       * @return {!InertRoot|undefined}
	       */

	    }, {
	      key: 'getInertRoot',
	      value: function getInertRoot(element) {
	        return this._inertRoots.get(element);
	      }

	      /**
	       * Register the given InertRoot as managing the given node.
	       * In the case where the node has a previously existing inert root, this inert root will
	       * be added to its set of inert roots.
	       * @param {!Node} node
	       * @param {!InertRoot} inertRoot
	       * @return {!InertNode} inertNode
	       */

	    }, {
	      key: 'register',
	      value: function register(node, inertRoot) {
	        var inertNode = this._managedNodes.get(node);
	        if (inertNode !== undefined) {
	          // node was already in an inert subtree
	          inertNode.addInertRoot(inertRoot);
	        } else {
	          inertNode = new InertNode(node, inertRoot);
	        }

	        this._managedNodes.set(node, inertNode);

	        return inertNode;
	      }

	      /**
	       * De-register the given InertRoot as managing the given inert node.
	       * Removes the inert root from the InertNode's set of managing inert roots, and remove the inert
	       * node from the InertManager's set of managed nodes if it is destroyed.
	       * If the node is not currently managed, this is essentially a no-op.
	       * @param {!Node} node
	       * @param {!InertRoot} inertRoot
	       * @return {?InertNode} The potentially destroyed InertNode associated with this node, if any.
	       */

	    }, {
	      key: 'deregister',
	      value: function deregister(node, inertRoot) {
	        var inertNode = this._managedNodes.get(node);
	        if (!inertNode) {
	          return null;
	        }

	        inertNode.removeInertRoot(inertRoot);
	        if (inertNode.destroyed) {
	          this._managedNodes['delete'](node);
	        }

	        return inertNode;
	      }

	      /**
	       * Callback used when document has finished loading.
	       */

	    }, {
	      key: '_onDocumentLoaded',
	      value: function _onDocumentLoaded() {
	        // Find all inert roots in document and make them actually inert.
	        var inertElements = slice.call(this._document.querySelectorAll('[inert]'));
	        inertElements.forEach(function (inertElement) {
	          this.setInert(inertElement, true);
	        }, this);

	        // Comment this out to use programmatic API only.
	        this._observer.observe(this._document.body || this._document.documentElement, { attributes: true, subtree: true, childList: true });
	      }

	      /**
	       * Callback used when mutation observer detects attribute changes.
	       * @param {!Array<!MutationRecord>} records
	       * @param {!MutationObserver} self
	       */

	    }, {
	      key: '_watchForInert',
	      value: function _watchForInert(records, self) {
	        var _this = this;
	        records.forEach(function (record) {
	          switch (record.type) {
	            case 'childList':
	              slice.call(record.addedNodes).forEach(function (node) {
	                if (node.nodeType !== Node.ELEMENT_NODE) {
	                  return;
	                }
	                var inertElements = slice.call(node.querySelectorAll('[inert]'));
	                if (matches.call(node, '[inert]')) {
	                  inertElements.unshift(node);
	                }
	                inertElements.forEach(function (inertElement) {
	                  this.setInert(inertElement, true);
	                }, _this);
	              }, _this);
	              break;
	            case 'attributes':
	              if (record.attributeName !== 'inert') {
	                return;
	              }
	              var target = /** @type {!Element} */record.target;
	              var inert = target.hasAttribute('inert');
	              _this.setInert(target, inert);
	              break;
	          }
	        }, this);
	      }
	    }]);

	    return InertManager;
	  }();

	  /**
	   * Recursively walk the composed tree from |node|.
	   * @param {!Node} node
	   * @param {(function (!Element))=} callback Callback to be called for each element traversed,
	   *     before descending into child nodes.
	   * @param {?ShadowRoot=} shadowRootAncestor The nearest ShadowRoot ancestor, if any.
	   */


	  function composedTreeWalk(node, callback, shadowRootAncestor) {
	    if (node.nodeType == Node.ELEMENT_NODE) {
	      var element = /** @type {!Element} */node;
	      if (callback) {
	        callback(element);
	      }

	      // Descend into node:
	      // If it has a ShadowRoot, ignore all child elements - these will be picked
	      // up by the <content> or <shadow> elements. Descend straight into the
	      // ShadowRoot.
	      var shadowRoot = /** @type {!HTMLElement} */element.shadowRoot;
	      if (shadowRoot) {
	        composedTreeWalk(shadowRoot, callback);
	        return;
	      }

	      // If it is a <content> element, descend into distributed elements - these
	      // are elements from outside the shadow root which are rendered inside the
	      // shadow DOM.
	      if (element.localName == 'content') {
	        var content = /** @type {!HTMLContentElement} */element;
	        // Verifies if ShadowDom v0 is supported.
	        var distributedNodes = content.getDistributedNodes ? content.getDistributedNodes() : [];
	        for (var i = 0; i < distributedNodes.length; i++) {
	          composedTreeWalk(distributedNodes[i], callback);
	        }
	        return;
	      }

	      // If it is a <slot> element, descend into assigned nodes - these
	      // are elements from outside the shadow root which are rendered inside the
	      // shadow DOM.
	      if (element.localName == 'slot') {
	        var slot = /** @type {!HTMLSlotElement} */element;
	        // Verify if ShadowDom v1 is supported.
	        var _distributedNodes = slot.assignedNodes ? slot.assignedNodes({ flatten: true }) : [];
	        for (var _i = 0; _i < _distributedNodes.length; _i++) {
	          composedTreeWalk(_distributedNodes[_i], callback);
	        }
	        return;
	      }
	    }

	    // If it is neither the parent of a ShadowRoot, a <content> element, a <slot>
	    // element, nor a <shadow> element recurse normally.
	    var child = node.firstChild;
	    while (child != null) {
	      composedTreeWalk(child, callback);
	      child = child.nextSibling;
	    }
	  }

	  /**
	   * Adds a style element to the node containing the inert specific styles
	   * @param {!Node} node
	   */
	  function addInertStyle(node) {
	    if (node.querySelector('style#inert-style, link#inert-style')) {
	      return;
	    }
	    var style = document.createElement('style');
	    style.setAttribute('id', 'inert-style');
	    style.textContent = '\n' + '[inert] {\n' + '  pointer-events: none;\n' + '  cursor: default;\n' + '}\n' + '\n' + '[inert], [inert] * {\n' + '  -webkit-user-select: none;\n' + '  -moz-user-select: none;\n' + '  -ms-user-select: none;\n' + '  user-select: none;\n' + '}\n';
	    node.appendChild(style);
	  }

	  if (!Element.prototype.hasOwnProperty('inert')) {
	    /** @type {!InertManager} */
	    var inertManager = new InertManager(document);

	    Object.defineProperty(Element.prototype, 'inert', {
	      enumerable: true,
	      /** @this {!Element} */
	      get: function get() {
	        return this.hasAttribute('inert');
	      },
	      /** @this {!Element} */
	      set: function set(inert) {
	        inertManager.setInert(this, inert);
	      }
	    });
	  }
	})();

	//
	// Initialisation
	//

	let dialogKeys = null;
	let dialogMenu = null;
	let contentAndUI = null;  // FIXME DRY with State

	function init() {
		dialogKeys = document.getElementById('story-slides-dialog-keys');
		dialogMenu = document.getElementById('story-slides-dialog-menu');
		contentAndUI = document.getElementById('story-slides-main-content');
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

			const state = window.storySlidesState;

			switch (event.key) {
				case 'ArrowLeft':
				case 'ArrowUp':
				case 'PageUp':
					if (!locked() && !isDialogOpen()) moveToPreviousSlide(state);
					break
				case 'ArrowRight':
				case 'ArrowDown':
				case 'PageDown':
					if (!locked() && !isDialogOpen()) {
						revealStepOrMoveToNextSlide(state);
					}
					// NOTE: not supporting the space key as it's echoed by
					//       screen-readers.
					break
				case 'f':
					if (!locked()) toggleFullscreen();
					break
				case 's':
					if (!locked()) switchToModeFunction(state, 'story');
					break
				case '?':
				case 'h':
					if (!locked()) showOrToggleDialog('keys');
					break
				case 'l':
					if (!locked()) toggleSlideLock(state.currentSlide);
					break
				case 'Escape':
					if (locked()) {
						toggleSlideLock(state.currentSlide);
					} else {
						hideOpenDialog();
					}
					break
				case 'p':
					announce(progressPercent(state) + '%');
					break
				case 'o':
					announce(
						`Slide ${state.currentIndex + 1} of ${state.numSlides}`);
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
		if (screenfull.isEnabled) {  // not supported on iPhone
			document
				.getElementById('story-slides-button-fullscreen')
				.addEventListener('click', () => {
					hideOpenDialog();
					toggleFullscreen();
				});
		} else {
			document.getElementById('story-slides-button-fullscreen').remove();
		}

		const setup = {
			'story-slides-button-help-keys': () => showOrToggleDialog('keys'),
			'story-slides-button-menu': () => showOrToggleDialog('menu'),
			'story-slides-button-next': () => revealStepOrMoveToNextSlide(state),
			'story-slides-button-previous': () => moveToPreviousSlide(state)
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

		if (screenfull.isEnabled) {
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
		if (!document.body.classList.contains('story-slides-locked')) {
			hideOpenDialog();
			unApplicationifyBody();
			document.body.classList.add('story-slides-locked');
			window.alert("Slide locked. Press Escape to unlock. If you're using a screen-reader, you can now explore the slide with the virtual cursor.");
			currentSlide.focus();
		} else {
			applicationifyBody();  // snap out of virtual cursor mode
			document.body.classList.remove('story-slides-locked');
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

		// FIXME DRY with linting.js
		// We also work out the user's chosen base font size
		const rootFontSizePercent = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--slide-font-height-percent-of-slide');
		const realRootFontSize = slideHeight * (rootFontSizePercent / 100);
		document.documentElement.style
			.setProperty('--computed-base-font-size', realRootFontSize + 'px');
	}

	function locked() {
		return document.body.classList.contains('story-slides-locked')
	}

	function toggleFullscreen() {
		if (screenfull.isEnabled) {
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
		const nextHiddenThing = slide.querySelector('[data-story-slides-step]');
		if (nextHiddenThing) {
			nextHiddenThing.removeAttribute('data-story-slides-step');
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

	// NOTE: Only exported for testing
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

	// NOTE: Only exported for testing
	function previousSlideNumber(slides, currentIndex) {
		return currentIndex > 0 ? currentIndex - 1 : slides.length - 1
	}

	// NOTE: Only exported for testing
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
				switchToModeFunction(window.storySlidesState, 'slides');
			}
		};
	}

	// In story mode, we want to cap the max-height of images.
	function storyViewportHandler() {
		for (const image of window.storySlidesState.slidesContainer.querySelectorAll('img')) {
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
				findParentSlideIndex(window.storySlidesState.slides, found) : 0;

			setActiveSlideInStoryMode({
				newIndex: index,
				state: window.storySlidesState,
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

	// TODO: Browsers aren't supposed to fire hashchange events when using the
	//       History API but they seem to be - am I doing something wrong?
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
				state: window.storySlidesState
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

		// TODO: This is double-checking mode
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
				if (desired > -1 && desired < state.numSlides) {
					setActiveSlide({ newIndex: desired, state: state });
					return
				}
			}
		}
		setActiveSlide({ newIndex: 0, state: window.storySlidesState });
	}

	function registerClickHandlersAndGlobalEventListeners(state) {
		registerSlidesModeClickHandlers(state);

		window.history.scrollRestoration = 'manual';
		window.addEventListener('popstate', popState);
		window.addEventListener('hashchange',
			() => setActiveSlideFromHash(state));

		const setup = {
			'story-slides-button-mode-slides': () => switchToMode(state, 'slides'),
			'story-slides-button-mode-story': () => switchToMode(state, 'story')
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
				const sheetMode =
					name.endsWith('.story.css') ? 'story'
						: name.endsWith('.slides.css') ? 'slides'
							: null;
				if (sheetMode) styleSheet.disabled = sheetMode !== mode;
			}
		}

		document.documentElement.className = `mode-${mode}`;  // support transitions
	}

	// TODO test - what about local file access in other browsers?
	function baseName(href) {
		return href.split('/').pop()
	}

	class StorySlidesState {
		// TODO get const?

		constructor() {
			this._currentIndex = null;
			this._slides = Object.freeze(Array.from(document.getElementsByClassName('slide')));
			this._slidesContainer = document.getElementById('story-slides-slides-container');
			this._contentAndUI =  document.getElementById('story-slides-main-content');  // FIXME DRY
			this._initialTitle = document.title;
		}

		get currentIndex() {
			return this._currentIndex
		}

		set currentIndex(newIndex) {
			if (newIndex >= 0 && newIndex <= this._slides.length) {
				this._currentIndex = newIndex;
			} else {
				throw new Error(`Given new index ${newIndex} is out of bounds.`)
			}
		}

		get slides() {
			return this._slides
		}

		get numSlides() {
			return this._slides.length
		}

		get currentSlide() {
			return this._slides[this._currentIndex]
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
<div id="story-slides-top-ui" class="story-slides-ui">
	<div class="slides mobile-only">
		<button id="story-slides-button-menu">Menu</button>
		<button class="slides" id="story-slides-button-previous" aria-label="Previous"><span>&larr;</span></button>
	</div>
	<div class="story">
		<button id="story-slides-button-mode-slides" aria-describedby="story-slides-mode-slides-key story-slides-mode-slides-explainer">Switch to slides mode</button>
		<span id="story-slides-mode-slides-key">or press <kbd>Escape</kbd></span>
		<div id="story-slides-mode-slides-explainer-container">
			<p id="story-slides-mode-slides-explainer">Slides mode displays each slide one at a time, as they would be projected for the audience. The extra information present in story mode is not displayed. Keyboard shortcuts or buttons can be used to move between slides.</p>
			<button class="mobile-only close">Close</button>
		</div>
	</div>
</div>`;

	const bottomUI = `
<div class="story-slides-ui slides">
	<button class="mobile-only" id="story-slides-button-next" aria-label="Next"><span>&rarr;</span></button>
	<div id="story-slides-progress"><div></div></div>
</div>`;

	const mainUI = `
<div class="story-slides-ui">
	<div id="story-slides-screen-errors" hidden>
		<h1>Content errors detected</h1>
		<p>An error, or errors, were detected in your presentation's content&mdash;open the browser console for more info.</p>
	</div>

	<div id="story-slides-screen-loading" hidden>
		<p>Loading&hellip;</p>
	</div>

	<div id="story-slides-screen-intro" hidden>
		<h1 id="story-slides-screen-intro-heading" tabindex="-1"></h1>
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

	<div id="story-slides-dialog-keys" role="dialog" tabindex="-1" aria-labelledby="story-slides-dialog-keys-title" class="story-slides-dialog" hidden>
		<h1 id="story-slides-dialog-keys-title">Slides mode help</h1>
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

	<div id="story-slides-dialog-menu" role="dialog" tabindex="-1" aria-labelledby="story-slides-dialog-menu-heading" class="story-slides-dialog" hidden>
		<h1 id="story-slides-dialog-menu-heading">View and Info</h1>
		<button id="story-slides-button-mode-story" aria-describedby="story-slides-mode-story-explainer">Switch to story mode</button>
		<button id="story-slides-button-fullscreen">Full-screen</button>
		<button id="story-slides-button-help-keys">Help</button>
		<p id="story-slides-mode-story-explainer">Story mode allows you to read the presentation as a document, rather than a collection of separate slides, and includes extra background information on the content.</p>
		<button class="close">Close</button>
	</div>
</div>`;

	const announcer = '<div id="story-slides-announcer" role="log" aria-live="assertive" class="visually-hidden"></div>';

	function fettleHtml(fixture) {
		// Main content wraps the top UI, slides and bottom UI

		const mainContent = document.createElement('div');
		mainContent.id = 'story-slides-main-content';
		mainContent.hidden = true;

		const dummyTopUI = document.createElement('div');  // extra layer
		dummyTopUI.innerHTML = topUI;

		const slidesContainer = document.createElement('div');
		slidesContainer.id = 'story-slides-slides-container';
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

	// Screen reader stuff...

	function prepareContentAndUI(state) {
		// TODO catch any errors? Show error screen?
		makeSlidesProgrammaticallyFocusable(state.slides);
		fettleLineBreaks();
		preparePauses(state.slides);
	}

	function startUpInMode(state, mode) {
		prepareContentAndUI(state);
		registerClickHandlersAndGlobalEventListeners(state);
		document.getElementById('story-slides-screen-intro').remove();
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
			const heading = document.getElementById('story-slides-screen-intro-heading');
			heading.innerText = state.initialTitle;

			document.getElementById('story-slides-choose-story').addEventListener(
				'click', () => startUpInMode(state, 'story'));
			document.getElementById('story-slides-choose-slides').addEventListener(
				'click', () => startUpInMode(state, 'slides'));

			const intro = document.getElementById('story-slides-screen-intro');
			intro.hidden = false;
			document.body.focus();  // FIXME: Check this gets SR to start at the top
		}
	}

	function getBackgroundColour() {
		const backgroundColour = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--background-colour');
		const backgroundColor = window.getComputedStyle(document.documentElement)
			.getPropertyValue('--background-color');
		return backgroundColour ?? backgroundColor
	}

	function setBackgroundColour(colour) {
		document.documentElement.style.setProperty('--background-colour', colour);
	}

	function clearBackgroundColour() {
		document.documentElement.style.removeProperty('--background-colour');
	}

	function main() {
		fettleHtml(document.body);
		init();
		window.storySlidesState = new StorySlidesState();
		makeKeyHandlerModeSlides(switchToMode);
		makeKeyHandlerModeStory(switchToMode);

		// Freeze background whilst we lint slides mode
		const backgroundColour = getBackgroundColour();
		setBackgroundColour(backgroundColour);

		// Checks that can only be done in slides mode
		toggleStyleSheetsForMode('slides');
		const lintSlidesResult = lintSlides();

		// NOTE: The wrappers need to be made before split layouts are processed,
		//       and Markdown must be converted to HTML before it can be wrapped.
		renderMarkdown();
		makeWrappersForPadding(window.storySlidesState.slides);

		// We want to start up in story mode
		toggleStyleSheetsForMode('story');
		clearBackgroundColour();
		document.body.setAttribute('tabindex', '-1');
		document.body.style.display = 'block';

		const lintDOMResult = lintDOM(window.storySlidesState.slides);
		const doSplitsResult = doSplits(window.storySlidesState.slides);

		if (lintSlidesResult && lintDOMResult && doSplitsResult) {
			const loading = document.getElementById('story-slides-screen-loading');
			loading.hidden = false;
			// TODO why can't we unhide it immediately and add a transition delay?
			setTimeout(() => loading.className = 'in-progress', 1000);
			window.addEventListener('load', () =>
				windowLoaded(window.storySlidesState, loading));
		} else {
			document.getElementById('story-slides-screen-errors').hidden = false;
		}
	}

	main();

}());
