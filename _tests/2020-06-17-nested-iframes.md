---
layout: test
title: iframes and nested iframes
---

This page provides a hosted means to check how `<iframe>`s are handled in browser extensions.

## Nested visible content

This one has a `name`.

<iframe name="Kate" src="nested-visible.html"></iframe>

## Nested container

This one contains another.

<iframe src="nested-container.html"></iframe>

## Nested HTML `hidden` contnet

This one is hidden using the HTML5 `hidden` attribute.

<iframe src="nested-hidden.html" hidden></iframe>

## Nested HTML `hidden` contnet

This one is hidden using CSS `visibility: hidden`.

<style>
.css-hidden { visibility: hidden; }
</style>

<iframe src="nested-visibility-hidden.html" class="css-hidden"></iframe>

## Nested clipped content

This one is hidden using the `visually-hidden` class, which uses small sizing, clipping and all that jazz.

<iframe src="nested-clipped.html" class="visually-hidden"></iframe>

There we go :-).
