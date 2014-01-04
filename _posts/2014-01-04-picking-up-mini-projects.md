---
layout: article
title: Picking up mini-projects
tags: at html tpg productivity
---

Merry 2014 to all!  I wanted to get back into certain projects I'd let slide a little.  After some promising work at the end of last year on getting AudioQuake to build on Windows, and the beginnings of a cross-platform build system written in Python, I am keen to get back to that (more soon, I hope!)  However there are a couple of smaller projects that needed some work too.

I've finally added basic support for tabbed browsing to the [ARIA landmarks keyboard navigation Firefox extension](http://matatk.agrip.org.uk/articles/keyboard-landmark-navigation-firefox/) that was originally created by David Todd.  As part of this update I have tried to clean up the encapsulation of the code so that only one variable is exported publicly and only the minimum of functions are accessible through it.  Ideally it still needs to track one's position on the page across tabs, but this is a start.  It seems that the XUL technique of creating extensions has been deprecated for some time, about which I feel somewhat crestfallen, as it was a great way to get native widgets---and their inherent accessibility---into web-based stuff.  Ah well.  The new dev tools sound good---not sure I'll be migrating, though!

I've also been working on a tool to help me create HTML code samples for articles, training materials and so on, based on real-world HTML code, but with the irrelevant/distracting bits taken out.  My first attempt at this is the [HTML Attribute Filter](http://matatk.agrip.org.uk/tinker/html-attribute-filter/).  It analyses any given code and offers options for removing or eliding attributes (shortening and replacing with ellipses).  It doesn't yet do code indenting (though there are other tools for that), but it's a start.  I find it hard to deal with large blocks of text so I'm hoping this will help me make sense of code that I come across in future.

Speaking of ancient and arcane development practices: perhaps I should re-write HTML Attribute Filter using a modern MVC-style JavaScript framework, so as to get my head around that sort of thing...
