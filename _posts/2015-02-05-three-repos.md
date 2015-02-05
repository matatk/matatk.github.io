---
layout: article
title: Three Repos
tags: programming productivity web accessibility mac tdd
---

Well, last year I was a total slacker on the 'blogging front; I do intend to do better at having things worth saying this year.  I thought that, in the "commit early, commit often" spirit, I would push some code up to GitHub that has just been lying around for a number of months.  These projects are related only by the facts that they're small, hopefully will be useful and need a lot more work...

 * **[ReposingForces](https://github.com/matatk/ReposingForces)** is an excuse to learn more about both documenting RESTful APIs and creating them.  I've tried numerous Chess-at-a-distance iOS apps so that I can play with my Dad and friends, but eventually they have broken.  Whilst [Chess 24](https://chess24.com) looks grand (though I'm not sure if it supports [Chess960/Fischer Random Chess](http://en.wikipedia.org/wiki/Chess960)), it's a tempting learning excercise to write a RESTful API and responsive site to make use of it.  I imagine this one will take a while, particularly as [a commenting service for static 'blogs](https://github.com/MarkWithall/combover) is intended to provide a warm-up to it.

   The goal is just to have a very simple tool for keeping the state of a game and making it easy to set it up on a real board, too.  The name of this repo is meant to evoke RESTfulness and the opposition of the Chess armies, and is also a hat tip to [Half-Life and its similarly-titled expansion](http://en.wikipedia.org/wiki/Half-Life:_Opposing_Force).

   On the documentation-writing front, it's been great fun to work with [prmd](https://github.com/interagent/prmd) (I even managed to fix a small bug, which was rewarding), [JSON schema](http://spacetelescope.github.io/understanding-json-schema/), [Pandoc](http://johnmacfarlane.net/pandoc/) and trusty Makefiles to glue it all together.

 * **[TDD/BDD Commit](https://github.com/matatk/tdd-bdd-commit)** is intended to help me when working with red-green-refactor (and similar) commit cycles when using test- and/or behaviour-driven development.  When working on [katas](https://github.com/matatk/NoughtsAndCrosses) with [Mark Withall](http://www.markwithall.com), we sometimes slipped up when trying to stick to the correct pattern.

 * **[BeebAlt](https://github.com/matatk/BeebAlt)** is my first Safari extension.  I noticed that quite often in BBC News (and Sport) articles, there is more information in the `alt` attributes for images than is present in the visible captions.  This extension draws out the `alt` text into the main and visually-rendered HTML (as well as keeping the original captions).  Currently it seems to work well, at least with the "classic" site design.  I do intend to make it work with the responsive site layout.

Actually, in the style of Douglas Adams, this trilogy has five parts, as I recently also created a couple of other little tools that I now realise I never enumerated anywhere...

 * **[SafariZoomModeToggle](https://github.com/matatk/SafariZoomModeToggle)** is a tiny utility to flip Safari betwixt full-page and text-only zoom modes.  I couldn't write this as an extension because there's no API for triggering menu actions.  There's also not a keyboard shortcut for it (despite it being something I seem to have to do a lot to get the best viewing experience out of sites).

   This was quite vexing to write, as I wanted to keep the source code as close to plain text as possible, but normal Apple Script Editor files are saved in an odd binary mode, so it was necessary to research building the binaries from the plain-text source.  Also, I wanted it to be as easy to install as possible.  A good old-fashioned Makefile came to the rescue for building, installing and creating a redistributable package for the tool.

 * **[ScreenRotationToggle](https://github.com/matatk/ScreenRotationToggle)** was, by complete fluke, an unexpected way to benefit from the effort I obdurately put into SafariZoomModeToggle---when I got home for Christmas, my Dad's long-serving monitor had bitten the dust and he'd got a new one that could be rotated.  OS X supports rotation very nicely, but doesn't, AFAIK, provide a keyboard shortcut to rotate the screen, hence this little utility.

Finally, I have been greatly enjoying an odyssey through [Vimcasts](http://vimcasts.org) and this has lead me to make many updates to [my dotfiles](https://github.com/matatk/dotfiles) and a few small contributions to some other projects, including a promising [semantic highlighting plugin](https://github.com/jaxbot/semantic-highlight.vim), which was very enjoyable.  Getting involved in that over Christmas has broadened my horizons a bit and, in no small part due to the welcoming and positive reactions from other developers, I look forward to doing more of this in future.

Right, I think that's quite enough!  Hopefully some of these will be of use to you, and maybe you could help me out with them? :-)  I'm quite into test-driven development now, but am still a little apprehensive about the next move with TDD/BDD Commit; should be an adventure...
