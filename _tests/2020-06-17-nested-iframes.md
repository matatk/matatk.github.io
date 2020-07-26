---
layout: test
title: iframes and nested iframes
---

This page provides a hosted means to check how `<iframe>`s are handled in browser extensions.

## Visible frame

This one has a `name`.

<button id="toggle-bob" aria-expanded="true">Toggle visible frame</button>
<script>
document.getElementById('toggle-bob').addEventListener('click', function() {
	this.setAttribute('aria-expanded',
		this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true')
	document.getElementById('bob').toggleAttribute('hidden')
})
</script>

<iframe id="bob" name="name: visible" title="title: visible" src="nested-visible.html"></iframe>

## Visible frame in native disclosure widget

<details>
	<summary>How about when the same frame is in a native disclosure widget?</summary>
	<iframe name="name: visible in details" title="title: visible in details" src="nested-visible.html"></iframe>
</details>

## Nested container

This one contains another.

<iframe src="nested-container.html" name="name: nested container" title="title: nested container"></iframe>

## Nested HTML `hidden` content

This one is hidden using the HTML5 `hidden` attribute.

<iframe src="nested-hidden.html" name="name: html5 hidden" title="title: html5 hidden" hidden></iframe>

## Nested HTML `hidden` content

This one is hidden using CSS `visibility: hidden`.

<style>
.css-hidden { visibility: hidden; }
</style>

<iframe src="nested-visibility-hidden.html" name="name: visibility hidden" title="title: visibility hidden" class="css-hidden"></iframe>

## Nested clipped content

This one is hidden using the `visually-hidden` class, which uses small sizing, clipping and all that jazz.

<iframe src="nested-clipped.html" name="name: clipped" title="title: clipped" class="visually-hidden"></iframe>

## From a different subdomain (without landmarks)

<iframe src="http://agrip.org.uk" name="name: AGRIP" title="title: AGRIP"></iframe>

## From a different page (with landmarks)

<iframe src="http://matatk.agrip.org.uk/landmarks/" name="name: landmarks" title="title: landmarks"></iframe>

There we go :-).
