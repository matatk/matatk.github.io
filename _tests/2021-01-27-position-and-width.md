---
layout: test
title: Position and width
---

**tl;dr:** `documentElement.clientWidth` and `Element.getBoundingClientRect()` return incorrect values on certain pages, and to extensions' content scripts, depending on OS scrollbar settings, when/until the viewport is resized

This affects Firefox, Chrome, Edge and Safari (versions are noted in the test page), on macOS and Windows (I haven't tested this on Linux). I tested this at a relatively low screen resolution (not HIDPI).

## Problem synopsis

Both `documentElement.clientWidth` and  `Element.getBoundingClientRect()` report incorrect values when:

* The OS is set to always draw scrollbars;

* the page is styled to be no taller than the viewport, and CSS Grid or Flexbox is being used,

* and _either_:

  - you suddenly and significantly change the viewport's height, e.g. by opening DevTools,

  - or code calling these functions is running in a browser extension's content script and the viewport has not yet been resized.

...until the `window`'s `resize` event is fired (by resizing the browser, or the DevTools).

**For normal pages:** you have to suddenly and significantly change the height of the viewport, e.g. by opening DevTools, before the problem occurs, and subsequently resizing the viewport fixes it.

**For extension content scripts:** incorrect values seem to be returned _until_ the viewport is resized, by any means/amount.

## Test case

You can reproduce this at the following test pages:

* [Example using CSS Grid for layout](grid.html)
* [Example using CSS Flexbox for layout](flexbox.html)

As noted on the test page, you can check the content script part of this using the [Landmarks extension](https://matatk.agrip.org.uk/landmarks/) because it uses the same methods as the test page for positioning the borders around landmark regions.

## Expected behaviour

On a page that's styled to be the same height as the viewport, with elements positioned and sized with CSS Grid/Flexbox...

* Even when opening DevTools (docked to the bottom of the window) I expect `documentElement.clientWidth` to continue to report the same (visually apparent) viewport width, as no vertical scrollbar is drawn, even if the OS is set to show scrollbars.

* The reported `documentElement.clientWidth` should not change at all if the viewport is resized vertically.

* The reported `documentElement.clientWidth` should only change gradually with viewport is resized horizontally.

* `Element.getBoundingClientRect()` should report values that match the visual position and size (and those reported by the DOM inspector).

* The values returned by `Element.getBoundingClientRect()` should change gradually with viewport resizes.

For code running in an extension's content script on a page such as the above...

* I expect the values returned by `documentElement.clientWidth` and `Element.getBoundingClientRect()` to the content script to match those returned to the scripts running on the source page.

* If no scrollbar is shown, I expect the values to reflect this.

* I expect a gradual resize of the viewport to produce gradual changes in the values.

## Observed behaviour

On a page that's styled to be the same height as the viewport, with elements positioned and sized with CSS Grid or Flexbox, after a sudden viewport size change (e.g. opening DevTools docked to the bottom of the window)...

* `documentElement.clientWidth` reports a change in viewport width after the sudden resize, even though there's no scrollbar. [Actually on rare occasions I've seen what I think is a vertical scrollbar flash into and out of existence, and the change in width seems like the width of a scrollbar.]

* The reported `documentElement.clientWidth` snaps back to its value from before the initial sudden resize, even if the viewport is resized vertically (as if the vertical scrollbar had been there).

* The reported `documentElement.clientWidth` snaps back to its value from before the initial sudden resize, even if the viewport is only resized gradually.

* `Element.getBoundingClientRect()` reports values that are offset/narrower than those that are visually apparent and reported by the DOM inspection tools.

* The values returned by `Element.getBoundingClientRect()` snap back to their expected ones even after a subsequent tiny viewport resize (in any direction).

For code running in an extension's content script under the same circumstances: the values returned by `documentElement.clientWidth` and `Element.getBoundingClientRect()` don't match those received by script running on the source page, and are as if a scrollbar is being drawn _from page load_ until the viewport is resized (by any amount).

## Background

I was mindful of filing this as a bug because all browsers I tested (Firefox, Chrome and Edge) behave almost the same way. However, this does lead to incorrect information being given to code running both on the page and in a content script, and there's no simple and robust way I can think of to work around it.

Thanks to [Carolyn MacLeod for noticing the symptoms of the problem in the Landmarks extension](https://github.com/matatk/landmarks/issues/394), which lead me to (hopefully) get somewhere towards the cause.

## Possibly related issues

### Firefox

This may relate to [bug 1209426](https://bugzilla.mozilla.org/show_bug.cgi?id=1209426) though I am not sure on that.

### Chrome

* [Issue 733546](https://bugs.chromium.org/p/chromium/issues/detail?id=733546) mentions a scrollbar that is visually hidden, yet still there. This could be related.

* This seems similar to [issue 1042399](https://bugs.chromium.org/p/chromium/issues/detail?id=1042399), but that issue states there's no problem with Firefox. However, this issue does affect Firefox too.

* [Issue 405867](https://bugs.chromium.org/p/chromium/issues/detail?id=405867) mentions `document.documentElement.clientWidth()` being incorrect after resize (or orientation change) events, but this may apply only to Android.

## Reported as

* **Firefox:** <https://bugzilla.mozilla.org/show_bug.cgi?id=1689188>

* **Chrome:** <https://bugs.chromium.org/p/chromium/issues/detail?id=1171408>
