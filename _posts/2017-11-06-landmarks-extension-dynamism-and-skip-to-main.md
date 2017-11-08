---
title: Landmarks extension&colon; dynamism and skip-to-main
layout: article
tags:
 - accessibility
 - web
 - landmarks
 - at
 - webextension
 - html
 - firefox
 - chrome
 - opera
---

The [Landmarks browser extension](http://matatk.agrip.org.uk/landmarks/) just got a big update, so I thought I'd post a note about it.  Since re-writing it as a WebExtension last year, I've solidified the 2.0.x series by including a test suite, using code quality tools and polished the UI, as [discussed in a Paciello Group 'blog article back in May](https://developer.paciellogroup.com/blog/2017/05/improving-access-to-landmark-navigation/).  That work has continued, but now it's time for some new features...

## Dynamic landmarks and improved navigation

The new 2.1.0 release is able to detect changes to the landmarks on a page at any time.  Previously, landmarks were found only when a page was loaded, or if the HTML5 History API was used to update the URL (this technique is used by web-apps like GitHub and YouTube to present distinct pages, with smooth and solid transitions between them).

Many pages—not just web-apps—use more dynamic techniques, though: from slide-out navigation panels to content that changes over time and landmark labels updated via scripts.  Supporting these will hopefully make Landmarks much more useful to you.

A keyboard shortcut has been added to skip directly to the "main" landmark (either the `<main>` element or `<div role="main">` or similar).  This means keyboard-only users who don't have a screen-reader can now make use of this helpful navigational feature.

## What's next?

First of all, please give this a go and [let me know if you find any problems by filing an issue](https://github.com/matatk/landmarks/issues). Please also consider giving Landmarks a review via your browser's add-ons/extensions store.

The next big feature to address will be making the highlihgting of landmarks clearer and more robust—that will be the focus of the 2.2.0 release.

Thanks to [Carolyn MacLeod](https://github.com/carmacleod), [fstorr](https://github.com/fstorr) and [Heydon Pickering](https://github.com/heydon) for feedback that shaped this release.
