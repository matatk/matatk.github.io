---
title: Reinventing Landmarks at glacial speed
layout: article
tags:
 - programming
 - landmarks
 - web
 - accessibility
---

***tl;dr:** Some big new features are planned, and in progress, for the [Landmarks browser extension](http://matatk.agrip.org.uk/landmarks/). Delivering them requires re-organisations of the code and UI, and presents some unexpected---but ultimately beneficial---challenges. As I continue learning to bring my software development into the 21st century (though inspired by UNIX and similar philosophy), the more agile practice of making several smaller, focused, releases promises to keep this a smooth process---for users too, hopefully :-).*

To add a bit of colour to the development process, here's the slightly more detailed story (with links to various GitHub issues and other things, for even more info)...

There's been a relatively long period of gradually refining Landmarks since the big migration to the cross-browser WebExtensions API a couple of years ago (the first 2.x release was the first WebExtension---now generally referred to as "browser extension"---release). Whilst there have been some significant developments, such as the test suite and [support for dynamic pages](/articles/landmarks-extension-dynamism-and-skip-to-main/), the pace of change has been relatively sedate, and the UX has remained similar. Recently, several ideas for new features that are useful, but could also change the nature of the extension, have come about. The most fundamental would be to support HTML heading navigation, inspired by extensions such as [a11y-outline](https://github.com/xi/a11y-outline).

This alone is a daunting task. It would require consideration what heading navigation really means [[issue 1 comment](https://github.com/matatk/landmarks/issues/1#issuecomment-391031027)]. A significant piece of the existing GUI, the hierarchical list of buttons representing landmark regions, would need to be replaced with a clear and easy-to-use tree control. Keyboard shortcuts would need a lot of thought, particularly regarding familiarity for existing users [[issue 156 comment](https://github.com/matatk/landmarks/issues/156#issuecomment-433368393)]. Further, the options UI needs to be kept as simple as possible; something I've worked hard on over the years [[issue 157](https://github.com/matatk/landmarks/issues/157)].

Currently around 1,250 people use Landmarks---not a huge number in the grand scheme of things, but I've never known for sure that so many people are using something I wrote---so a lot of research and imaginary beard stroking has to go into these decisions!

But wait, there's more
----------------------

As heading navigation would be such a big change, including probably changing the name of the extension a bit, and refreshing the extension's "store-front" pages [issues [118](https://github.com/matatk/landmarks/issues/118) and [184](https://github.com/matatk/landmarks/issues/184)], it seems like a suitable 3.0.0 release. This prompted some thought on what other big user-facing changes may be possible for such a big release, such as...

 * **Highlighting and labelling landmarks** with a customisable border (this made it into 2.3.0, a mere five years after it was initially suggested [[issue 1](https://github.com/matatk/landmarks/issues/1)]---I wanted to ensure the implementation was nice and clean...).
 * Providing a **keyboard shortcut and UI to draw the border around all landmarks** at once---this could be helpful when testing sites for accessibility (though the code wasn't designed with the assumption that more than one border would be drawn at once, so will need some thought).
 * Optionally **offering a browser sidebar** to display landmarks, instead of the current toolbar pop-up---some people may prefer this and, particularly when headings are included, much more information may be presented.
 * **Inspecting landmark elements** in the browser's developer tools (colloquially "DevTools")---again, useful for accessibility assessment and developers.
 * Supporting **article navigation** was also suggested [[issue 203](https://github.com/matatk/landmarks/issues/203)]---whilst this is distinct from both landmark and heading navigation, it is something that assistive technologies are starting to support, and could help users.

In order to support these, and to ensure performance is as good as can be, some re-working of the structure of the extension would also be required...

 * **Re-organising the code** around small, focused ES6 modules and using a build tool to consolidate these into the extension's main scripts (web content, background controller, pop-up and options). Modularity and [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself) are currently ensured by having many script files, making it unwieldy to add new functionality, as all scripts need to be injected, in order, into the content process and other areas where they're needed. Code can now also be shared between similar components, such as the pop-up and new sidebar and DevTools panel. Supporting major cross-browser differences (e.g. if there are sidebars, or not) and API idiosyncrasies also benefits hugely from being able to conditionally include code.

   *I've purposely avoided such a build system until now, as there was no need to overly complicate things, but in light of the above, it provides simplicity. The tools used are [Rollup](https://rollupjs.org/guide/en) and [terser](https://github.com/terser-js/Terser) along with the existing trusty [npm package scripts](https://www.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/) and the main [build script](https://github.com/matatk/landmarks/blob/master/scripts/build.js). The main work was completed in [pull request 191](https://github.com/matatk/landmarks/pull/191), for release soon.*

 * Writing a **CSS Selector generator** to support the inspection of elements via the DevTools panel. Browsers implement this internally, as it's possible to ask for the selector for an element via the GUI, but there's no API to generate one. Selectors allow Landmarks' content script to tell the DevTools panel which elements correspond to landmarks, which should be offered for inspection by the user.

   *It was great that [Mark Withall](https://www.markwithall.com) had imparted to me the importance of [test-driven development](/articles/test-driven-development-as-if-you-meant-it-reviewed-part-1/) and had previously been able to develop a landmark-finding test suite, as adding tests for the expected selector for each landmark brought out so many cases and gaps in my implementation. These faults would've seemed very obscure had the tests not existed. (There are several really good-looking and test-driven CSS selector libraries out there, but I thought I'd try to learn something, and that I had a special/simple/constrained case for generating them---not sure how valid that was, but I am learning from writing one.)*

 * Changing the **data structures** Landmarks uses to track navigation---currently a list of landmarks on the page is used, but when headings and articles are considered, a tree will be needed, because landmarks and articles may contain both each-other and headings. It will still also be necessary to know which is the next or previous landmark, heading or article.

   *Designing interfaces and thinking about UX and help material is fun and has a big impact. Even accounting for cross-browser API differences presents a satisfying challenge. It's been a while since I've had to do some really abstract stuff like this, which is nice for a change---and equally nicely, it links directly back to supporting things the user needs to be able to do. Thinking about the tests already, and the tree widget that'll go hand-in-hand with this change...*

 * **Profiling the mutation observer**, which monitors pages for changes that might affect landmarks, to see if there are better, yet still "Just Works" ways to handle dynamic content [[ref issue 172](https://github.com/matatk/landmarks/issues/172)].

[Crisitunities](https://www.youtube.com/watch?v=yY-P3D63Z18)
------------------------------------------------------------

On top of all the above feature suggestions and required foundational work, during research on how to achieve these, and initial development, some big surprises came up...

 * [Only four pre-set keyboard shortcuts are allowed on Chrome-like browsers](https://developer.chrome.com/apps/commands#usage), but Landmarks is all about keyboard access to navigation and will soon have more shortcuts than that. This means that users need to be made aware of available keyboard commands, and specifically which ones are not currently set up.

   In turn, this opened up rather a big rabbit hole regarding the creation of a splash screen that could be used to give the user the above and other important information (possibly varying depending on whether this is a new install, or update). The biggest challenge is that content scripts are forbidden from running on HTML pages bundled with an extension on Chrome (which seems a bit draconian, as they're all from a trusted source)---this means users wouldn't be able to use the Landmarks extension to navigate its own help page. Some method to present a splash page on which one could actually use Landmarks to navigate is needed. [A first attempt was made in pull request 187](https://github.com/matatk/landmarks/pull/187) though there's a way to go...

   *Discovering the shortcut constraints (understandable as they are) really reminded me of times when Dad was "battling" with DIY, despite measuring twice; there was minor vexation and some flummoxage, but of course constraints bring about creativity, and we love it. The result, in the case of Landmarks, is going to be much-improved help information. (All Dad-made furniture and other projects rocked, too :-).)*

 * There are two ways for parts of an extension to communicate: one-time messages and long-lived connections (via "ports"). DevTools scripts require the use of long-lived connections, but Landmarks uses message-based communication, as I felt it was simpler to begin with. But using two ways is confusing, and standardising on port-based communications is therefore a good idea, and does offer potential readability and efficiency benefits, as the code is more centralised.

* Firefox has some bugs: with background pages loading after content scripts when there are already tabs open when the extension is installed/reloaded, [but there is a workaround](https://bugzilla.mozilla.org/show_bug.cgi?id=1474727#c3); also there's an [apparent problem with the "back-forward cache"](https://github.com/matatk/landmarks/issues/202). I do generally really like Firefox's approach to browser extensions, e.g. it auto-injects content scripts and manages other things that Chrome requires all developers do.

* Both Firefox and Opera support sidebars, but they have different levels of support for APIs to open/close them. Users should not have to use a different keyboard shortcut to bring up the list of landmarks depending on whether they want the list in a sidebar or pop-up, and presenting as solid a UX as possible, whilst working with the fact that extensions providing both sidebars and pop-ups are a bit of a corner-case, is something of a balancing act.

At this point, with all this scope creep---or even explosion---the idea of a 3.0.0 release started to loom over me, rather than being something aspirational, until...

Little and often / the UNIX philosophy / Agile
----------------------------------------------

It dawned on me that the best way to deliver these features would be gradually, throughout the 2.x series, as has already been done with the as-and-when refinements and minor new features already settled there. Then, in a while, it'll be time to flip the switch and make a big 3.0.0 release when the keystone---headings---is in place, having built on all the groundwork laid before it.

Of course this is what real developers do as best practice these days, and it should result in a much smoother pace of development that would actually feel faster for users, as the features will be delivered over time. *(For game nerds, it also reminds me of Valve lamenting that the "Half-Life 2: Episode X" games should've been named Half-Life 3---though the polarity is different in that example.)*

Landmarks 2.4.0 will include the sidebar and landmark inspection via the DevTools features, and future 2.x releases will add more of the above features over time---the aim being to always add a significant feature, but maybe only one, in each new release. A tree control, re-vamped splash page and artwork may also arrive later in 2.x, to prepare for the switch-over to supporting headings too.

Most importantly, and especially given the number and size of the changes to be made, I hope it will help those of you using Landmarks adjust and give you the opportunity to provide feedback along the way. Thanks for using this extension and feedback is always welcome, either via [GitHub issues](https://github.com/matatk/landmarks/issues) or [Twitter](https://twitter.com/matatk).
