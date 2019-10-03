---
title: W3C Workshop on Web Games
layout: article
tags: web games accessibility tpg tpg-blog-post
extra-style: syntax
---

*Check out the ["Accessibility at the W3C Workshop on Web Games" post on The Paciello Group 'blog](https://developer.paciellogroup.com/blog/2019/07/accessibility-at-the-w3c-workshop-on-web-games/) for a friendly summary of the technical details given here.*

This post covers what I learnt at the [W3C Workshop on Web Games](https://www.w3.org/2018/12/games-workshop/) from a technical perspective with a focus on accessibility. It covers quite a bit---there's a [table of contents](#contents) list below---but first here's some background...

What a brilliant event! All the sessions were compelling and the subject matter varied. I got to meet some great people (only regretting that I didn't get to meet *everyone*) and it was a nerdy pilgrimage to visit [Microsoft's headquarters](https://en.wikipedia.org/wiki/Microsoft_Redmond_campus) :-) (even got to try a HoloLens; awesome!) I've learnt a lot, both technically and of the perspectives and experience of people developing games, WebXR experiences, or working on all the things that support their development and use. Hearing about the experiences of game developers, and the considerations that browser makers have to make when implementing new features was particularly fascinating. Feels like there are some huge opportunities for accessibility, too.

Thanks to everyone who made it happen and took part, the organisers in particular (it was run smoothly and impressively on-time) and to [The Paciello Group](https://www.paciellogroup.com/) for sponsoring my trip. Huge thanks also to everyone involved in the preparation of our position paper (linked at the end, with acknowledgements inside).

This post is intended to be of technical interest, and to provide a report for the [W3C's Accessible Platform Architectures Working Group](https://www.w3.org/WAI/APA/), which I've recently joined and who've given me a warm welcome and the opportunity to contribute to the workshop.

If you'd like to discuss more, you can join in the [W3C Accessible Platform Architectures mailing list thread on the Web Games Workshop](https://lists.w3.org/Archives/Public/public-apa/2019Jul/0026.html) or check out the comments on the ["Accessibility at the W3C Workshop on Web Games" post on The Paciello Group 'blog](https://developer.paciellogroup.com/blog/2019/07/accessibility-at-the-w3c-workshop-on-web-games/).

Contents
--------

 * [Accessibility opportunities](#accessibility-opportunities)

   - [Unity and accessibility](#unity-and-accessibility)

   - [Bridging between UIs and assistive technologies](#bridging-between-uis-and-assistive-technologies)

   - [Pronunciation of gender-neutral words](#pronunciation-of-gender-neutral-words)

   - [Gamepad support](#gamepad-support)

   - [WebXR, glTF and scene semantics](#webxr-gltf-and-scene-semantics)

 * [Common aims and concerns of workshop participants](#common-aims-and-concerns)

   - [Threading](#threading)

   - [Fingerprinting and capabilities/constraints in API design](#fingerprinting-and-capabilitiesconstraints-in-api-design)

   - [Monetisation](#monetisation)

   - [Awareness and empathy](#awareness-and-empathy)

 * [Awareness-raising activities we ran for accessibility](#awareness-raising-activities)

 * [Next steps](#next-steps)

 * [Some reference links](#some-reference-links)

Accessibility opportunities
---------------------------

Most of the participants were aware of accessibility and several had taken active steps to achieve it in their games or other products/services, which is great. We hope we raised awareness further (more on our session later), but one thing that was clear was that accessibility was a general consideration for several participants, as questions/discussion on accessibility popped up in several sessions---awesome :-).

### Unity and accessibility

As it happens, a couple of weeks before the workshop, [the Unity team posted a forum thread on accessibility](https://forum.unity.com/threads/accessibility-and-inclusion.694477/) in which they are interested in knowing how to make the Unity tools more accessible to people with disabilities. Authoring tool accessibility is so important, so this is excellent news---I'm keen to follow developments. Some of the Unity team were at the workshop, too, which is also great to see.

*(As an aside: if you're interested in authoring tool accessibility, you may be interested in a proof-of-concept project enabling people with vision impairments or who are blind to make 3D levels for games called [Level Description Language](https://dspace.lboro.ac.uk/dspace-jspui/handle/2134/4478).)*

### Bridging between UIs and assistive technologies

One of our nearer-term goals in the position paper was to find a way to bridge between games and assistive technologies, as proposed by the Active Game Accessibility research group. We felt that concentrating on the UI of games would be a good place to start because UI accessibility in other spheres is handled well with platform-native toolkits and, on the web, by standards such as ARIA.

Early on the first day, something promising came up: we learnt from [Luke Wagner](https://www.w3.org/2018/12/games-workshop/participants.html#p77) about an upcoming simpler and considerably faster process for calling standard web APIs (from `console.log()` to the Web Audio API and beyond) from [WebAssembly](https://webassembly.org/) code. (WebAssembly, or "WASM", is the relatively new bytecode format that can be used to run code compiled from any language, within a browser, at near-native speeds. Several engines and games have been compiled to it, and run very nicely.)

Currently, in order for WebAssembly code to call APIs provided by the browser, it has to go through a fairly slow and convoluted process involving calling through JavaScript---this is particularly complex due to WASM being low-level and JavaScript being high-level. When the WebIDL Bindings proposal for WebAssembly is fully supported, calls will be able to go directly from WebAssembly to the browser, skipping the JavaScript layer and making them far more efficient.

We were hoping that one way to bridge between the visually-rendered game UI and the semantics that assistive technologies need would be to provide information from the game via the [Accessibility Object Model](https://github.com/WICG/aom) (when it's fully implemented in browsers) as there wouldn't be any actual DOM nodes in the page to which we could attach semantic information, due to everything being rendered as an image by the game.

From our discussion at the workshop: we could add some extra code into the source of the game---or better, the game engine---that would tell the browser, via the Accessibility Object Model functions, when UI elements are created/modified/removed. This would allow us to maintain corresponding semantic information for the purely visual controls rendered by the game. This extra source code could be provided conditionally (e.g. via an `#ifdef` directive in C/C++) so it only gets included when compiling to WebAssembly.

It's possible to experiment with WebIDL bindings now, because polyfills have been created ([wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) for Rust and [a binding polyfill for C++](https://github.com/jgravelle-google/wasm-webidl-polyfill) too). The [potential of this approach is tantalising](https://twitter.com/matatk/status/1144322176096411648) and I'm looking forward to getting coding on some prototypes.

There may seem to be one catch though, which is that the Accessibility Object Model is under development and isn't a production API yet. Whilst it'll be great to have an efficient means to provide accessibility information when all of these APIs and proposals are in place, there's actually a way to explore these ideas right now...

We can *already* call our own JavaScript code from WASM, so we could have a JavaScript library that mimics what the Accessibility Object Model would do, but does it by creating real (but visually hidden) DOM elements as proxies to carry the accessibility information, rather than adding to the (virtual) accessibility tree directly. This won't be super-efficient, but if we are concentrating on UI accessibility to start with, it may be fast enough---and it'll only get faster as time goes on.

This approach requires code to be added to the game engine, though quite possibly not very much if the UI code is already structured in such a way that it treats UI elements a bit like objects (which I expect is the case in modern engines). I'm really excited to try this and find out how it goes.

Here are links to the presentation and other info:

 * ["WebAssembly: status, Web IDL bindings, and roadmap" (Google Docs)](https://docs.google.com/presentation/d/10ynaGMBAdiCLVyoyBDSNsNhtpQT9qm_QWO6VBI2LCGA)
 * ["WebAssembly: status, Web IDL bindings, and roadmap" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/08-web-idl-bindings.pdf)
 * ["Calls between JavaScript and WebAssembly are finally fast 🎉"](https://hacks.mozilla.org/2018/10/calls-between-javascript-and-webassembly-are-finally-fast-%F0%9F%8E%89/)

*(Geeky historical note: back when initially working on AudioQuake, we removed the graphical main menu system, relying on the still-graphical, but command-line-based console instead, and simply made the engine output any text that appeared on-screen, and this was both a simple patch and works well---but now it might be possible to access in-game GUIs, which would be awesome.)*

### Pronunciation of gender-neutral words

There was a session on diversity and localisation that included a talk about how translators might face barriers in using gender-neutral terms when translating into some languages, and how languages are evolving to create/allow for such terms. However, these emerging forms are not well-supported by text-to-speech systems.

The way we use language can help our audiences feel included, rather than alienated, so it's an important consideration. Language is constantly in flux, and this area is particularly new (definitely to me, but I gather in general too) so it seems like a good idea to follow developments and, as consensus emerges, see how we can support it.

#### Current approaches

*(I'm paraphrasing [Elina](https://www.w3.org/2018/12/games-workshop/participants.html#p19) and [Gabriel](https://www.w3.org/2018/12/games-workshop/participants.html#p75), the presenters of the session, and hope to give you a quick idea of the background.)*

A wildcard character, such as 'x', 'e' or an "at" sign may be used to make a particular word gender-neutral. For example: in Spanish, <span lang="es">"todos"</span> and <span lang="es">"todas"</span> are plurals meaning "everyone" or "all", with <span lang="es">"todos"</span> being a masculine word and <span lang="es">"todas"</span> being a feminine word. A gender-neutral form of the word may be written as <span lang="es">"tod@s"</span>, <span lang="es">"todxs"</span> or <span lang="es">"todes"</span>.

Another approach is separating variants, or variant parts, of words using an asterisk or full-stop. E.g. <span lang="de">"der\*die Priester\*in"</span> in German (which refers to both "the priest" and "the priestess") or, in French, <span lang="fr">"Cher.e.s ami.e.s"</span> means "dear friends" in a gender-neutral manner.

Here are links to the presentation:

 * ["Gender-inclusive language in games and its localization challenges" (PowerPoint)](https://www.w3.org/2018/12/games-workshop/slides/22-gender-inclusiveness-in-localization.pptx)
 * ["Gender-inclusive language in games and its localization challenges" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/22-gender-inclusiveness-in-localization.pdf)

#### Potential path to accessible support

Of course supporting this evolution, when it becomes clearer, will require changes in assistive technologies (and maybe browsers and platforms too). In the meantime, we could perhaps use the following technique on web pages.

**This is a naïve example and doesn't constitute accessibility advice**, just some very early thoughts I had. There is ongoing work on pronunciation and related matters (links below) and I've much more research to do myself, too.

There's a game called ["Everybody's gone to the rapture" (and it has an interesting accessibility feature)](http://gameaccessibilityguidelines.com/everybodys-gone-to-the-rapture-audio-aid/). For the purposes of this contrived example, let's assume that it's actually called "Everyone's gone to the rapture" and that (and of course this could well be the case) when I put that into online translation tools, I got an outcome that sounds natural.

I took the output and attempted to make a gender-neutral form of it using the techniques above (sorry if this hasn't quite come out right :-)). Thus, if we have the following text...

```html
<p lang="es">Todxs han ido al rapto.</p>
```

Then perhaps we could make this accessible to screen-reader users by hiding the visible text from assistive technologies, and providing a visually-hidden text alternative...

```html
<p lang="es">
  <span aria-hidden="true">Todxs</span><span class="visually-hidden">todos/todas</span> han ido al rapto.
</p>
```

We could potentially write a small script library to make these changes (if one doesn't already exist), at least in some cases, whilst we wait for consensus and assistive technology support. **BUT**, I'm not an expert, and there are some open questions and limitations:

 * There's not yet consensus on pronunciation.
 * This technique could confuse people who use a screen-reader to help them read what they see visibly on the screen (e.g. people with dyslexia) if the text alternative is considerably longer than the visible text, as it becomes hard to synch up the seen and the heard text.
 * This doesn't work in plain text contexts.

Much more to research here, of course. In the meantime, some background and further reading...

 * [Gender neutrality in languages with grammatical gender](https://en.wikipedia.org/wiki/Gender_neutrality_in_languages_with_grammatical_gender)
 * Possibly related technical work:
   - [W3C Pronunciation Task Force Wiki](https://github.com/w3c/pronunciation/wiki)
   - [Background info on the accessibility of pronunciations](https://mitch11.blogspot.com/2018/12/for-pronunciation-tf.html)
   - I'm wondering if [Speech Synthesis Markup Language](https://www.w3.org/TR/speech-synthesis11/) may be of relevance.

### Gamepad support

[Kelvin Yong](https://www.w3.org/2018/12/games-workshop/participants.html#p85) presented on upcoming developments in the W3C Gamepad specification, namely support for different types and configurations of gamepads. We had some questions on the W3C list about this, including...

 * How would controllers such as the Xbox Adaptive Controller be supported?
 * [Could some controllers that present to the OS a multiple switches be aggregated into being seen as a coherent controller by a game?](https://lists.w3.org/Archives/Public/public-apa/2019Apr/0038.html)
 * How can button remapping be supported, and where is it most appropriate?

The immediate answer to all of these was that accessibility has been considered up during the development of the specification, and the authors are open to further discussion and contributions from anyone who's interested in helping out (e.g. via the specification's GitHub repository, linked below)---great stuff :-).

During the session, I was initially thinking that a layer above the Gamepad specification, but below the games, might be most apt for button remapping, and a standard UI could be provided (by the browser or maybe a WebExtension to start with). However, [Ian Hamilton](https://twitter.com/ianhamilton_/) gave some very apt scenarios that demonstrate why remapping really needs to be considered in-game...

 * You might want different button mappings depending on the activity you're performing in the game (exploring on foot instead of in a vehicle, or navigating the menus, for example).
 * You might want to remap some buttons, but keep standard system functions such as using the shoulder buttons to scroll in lists.

These sorts of features require the games to be aware of button remapping, though some basic support from the platform underneath the game could be helpful as a fallback.

You can follow and contribute to the development of these specifications...

 * [W3C Gamepad specification on GitHub (where you can browse/report issues)](https://github.com/w3c/gamepad)
 * [W3C WebXR Device API Explainer notes on Gamepads](https://github.com/immersive-web/webxr/blob/master/explainer.md#the-gamepad-api)

### WebXR, glTF and scene semantics

There was quite a bit of discussion around the potential (not just for accessibility) of semantic information that could be bundled with 3D model/scene descriptions, with significant input from people from the W3C's Immersive Web Group, which looks after the [WebXR specification](https://github.com/immersive-web/webxr) and the Khronos Group's [glTF (GL Transmission Format) group](https://www.khronos.org/gltf/). A glTF file portably describes a 3D scene, and the semantics side of this could provide all sorts of interesting machine-readable and accessibility-related information. I'm not familiar with glTF so it was helpful to learn about it. Given the potential, this work is definitely another one to follow.

There was also the observation (from [Luke Wagner](https://www.w3.org/2018/12/games-workshop/participants.html#p77) IIRC) that a more [semantic scene graph, a bit like A-Frame's approach](https://aframe.io/docs/0.9.0/introduction/) could provide many opportunities for machine-readable applications, including accessibility. When working on [Level Description Language](https://dspace.lboro.ac.uk/dspace-jspui/handle/2134/4478), we wondered about the possibilities that being machine-readable might enable in terms of the machine creating its own modifications to levels---having the extra semantic information could be very cool.

There's also a lot of interest in WebXR inclusivity and accessibility generally: there has already been a [W3C Workshop on Web & Virtual Reality (2016)](https://www.w3.org/2016/06/vr-workshop/) and [W3C Workshop on WebVR Authoring: Opportunities and Challenges (2017)](https://www.w3.org/2017/09/webvr-authoring-workshop/) and there continues to be much work ongoing in this area.

Common aims and concerns
------------------------

There were several topics that cropped up a few times throughout discussions as well as accessibility. I've not covered all of them here, but below I've tried to capture some of the recurring ones about which I have sufficient experience to be able to describe them :-).

### Threading

Many developers were interested in a way to have concurrency much closer to threading on the web, where each thread shares context, so there is not a huge serialisation bottleneck. This was proposed by [David Catuhe](https://www.w3.org/2018/12/games-workshop/participants.html#p11) and was I think universally wanted, though the form is being worked on.

Interest in this came from people working on games, audio and XR on the "client" side, and in a kind-of parallel manner from some browser makers, who discussed their efforts towards moving processing off the browser's main thread as a general architectural move.

Links to the main presentation on threads for JavaScript/WebAssembly:

 * ["Enable fast and efficient threading on the web" (PowerPoint)](https://www.w3.org/2018/12/games-workshop/slides/07-threading.pptx)
 * ["Enable fast and efficient threading on the web" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/07-threading.pdf)

### Fingerprinting and capabilities/constraints in API design

The issues around fingerprinting in general came up a few times throughout the sessions. Whilst the potential benefits as a means to enable cross-device gameplay without needing a login sound great, it was generally discounted due to the potential privacy issues and the fact that it isn't 100% reliable and therefore is unsuitable in many scenarios.

On day two, [Hongchan Choi](https://www.w3.org/2018/12/games-workshop/participants.html#p14) was presenting on a proposed low-level audio API ("Audio Device Client") and mentioned that a capabilities/constraints approach was used in the API design to mitigate some potential fingerprinting issues. In the W3C's Accessible Platform Architectures group, we have discussed fingerprinting in the context of perhaps inadvertent disclosure of assistive technologies or system adaptations, and it's generally quite an important but overlooked topic, so I was intrigued as to how some of it may be mitigated.

It turns out that some professional audio equipment has such esoteric capabilities (e.g. number of channels, supported sample rates and so on) that it could be identified accurately if it were used for fingerprinting. To mitigate this, the proposed Audio Device Client API takes an approach by which the calling code asks the browser for a certain set of capabilities (or multiple sets of capabilities, in order of preference), and the browser checks to see if they can be met, returning the first device that meets them. This is in contrast to an approach where the system might give the calling code information on all of the devices in the system and allow it to pick one.

This seems like a balanced approach. I gather it was modelled on the [W3C Media Capture and Streams API](https://www.w3.org/TR/mediacapture-streams/). Whilst exposing any API means some level of fingerprinting may be possible, it's good to see it being considered.

I'm not yet sure how much of this we can turn into practice when considering assistive technologies, but it's always helpful to be aware of such architectural approaches.

Here are some relevant links:

 * ["Better and faster audio I/O on the Web" (Google Docs)](http://bit.ly/audio-device-client-wwg)
 * ["Better and faster audio I/O on the Web" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/18-audio-device-client.pdf)
 * [Mitigating Browser Fingerprinting in Web Specifications (W3C Interest Group Note)](https://www.w3.org/TR/fingerprinting-guidance/)

### Monetisation

I don't have much to say on this, as I'm very-much not an expert, but means of supporting game development were at the forefront of many participants' concerns. Advertising seems to overwhelmingly be the way this is done at the moment, though many people desired other ways to achieve sustainable monetisation. There was a lot of discussion in the breakout sessions on it, and I'm looking forward to hearing more on developments as they occur.

### Awareness and empathy

Accessibility wasn't the only topic in which developers wanted to raise awareness and empathy on behalf of players/users. Another example was in the discussion on loading of assets. People with slow Internet connections can be put off, or even prevented, from playing games with long load times (one way to work around this is to stream assets as required). In order to foster some awareness of this issue, [Kasper Mol](https://www.w3.org/2018/12/games-workshop/participants.html#p101)'s office set up a system with a simulated poor connection---which turned out to be quite effective.

This reminded me of [the GDS Empathy Lab](https://www.youtube.com/watch?v=XYLIPHAF-4c), which contains various simulations to impart to its visitors how it feels to browse the web with certain disabilities. This all reinforces how important education/awareness and empathy are in solving problems in any sphere of endeavour.

The presentation on loading times:

 * ["Size matters: How loading is losing you players" (Google Docs)](https://docs.google.com/presentation/d/1RTgAgBiJN4TW_D7Ax_qxpVOgP5Roxnou4Gx9G8MF9cQ/edit)
 * ["Size matters: How loading is losing you players" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/12-size-matters.pdf)

Awareness-raising activities
----------------------------

I've mentioned that accessibility was a common thread throughout the workshop, and there was also a session in which we all discussed accessibility specifically. There were presentations from [Luis Rodriguez](https://www.w3.org/2018/12/games-workshop/participants.html#p58) and myself, on behalf of our position paper authors (links to both presentations and the position papers can be found below). Luis gave some compelling examples of why and how we could re-think our interactions to make them much more inclusive for people with motor impairments. I talked about game accessibility being achieved through content design (with some examples from the [Game Accessibility Guidelines](http://gameaccessibilityguidelines.com/)) and via assistive technologies (aspirationally), posing the questions from our position paper. As my experience in game accessibility is largely academic, it was extremely helpful to have [Ian Hamilton](https://twitter.com/ianhamilton_/) and [Brannon Zahand](https://twitter.com/brannonz) on hand to provide experienced advice and industry perspectives.

Most of the workshop participants were already aware of accessibility, with several having taken steps to implement it. Many of them were interested in learning more and I think that Ian and Brannon's examples demonstrating just what is possible may've provided some good encouragement here.

Outside of the accessibility-specific session, there was quite a bit of interest from several people in contributing to the accessibility efforts around standards, particularly WebXR and glTF---excellent! (I was simply following these discussions, and didn't manage to meet everyone involved, but it was encouraging to see, and I'm looking forward to following developments.)

On day two, we ran an "Accessibility Clinic" breakout session, with the idea that developers could bring us questions about how to make certain games accessible and we could give suggestions. I wanted to attend all of the breakouts, due to learning so much, and whilst ours was quite small-scale, that allowed Ian and me to give a lot of background information on how much has improved over the past couple of years in particular, and where things might be going.

I also had several impromptu discussion on game accessibility, and accessibility in general, with other participants over the course of the event. Seeing the level of awareness was encouraging, and the momentum and opportunities we have at the moment are even more so.

Please [contact me](https://twitter.com/matatk) if you have any game accessibility questions, by the way :-).

Links to our position statements and presentations:

<!-- Note: repeated below. -->

 * [Position paper: "Adaptive Accessibility"](https://www.w3.org/2018/12/games-workshop/papers/web-games-adaptive-accessibility.html)
 * [Slides: "Adaptive Accessibility"](/talks/2019/web-games/index.html) (I'm continually working on improving the accessibility of these; input welcome.)
 * [Position paper: "Turning on “accessible mode” for users with motor impairments"](https://www.w3.org/2018/12/games-workshop/papers/accessible-mode.txt)
 * [Slides: "Turning on “accessible mode” for users with motor impairments" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/14-accessible-mode.pdf)

Next steps
----------

The workshop organisers are preparing a report on next steps for all of the topics we covered (I'll update this article with a link when that's out). From an accessibility perspective, particularly from my own perspective, I'm going to be...

 * Prototyping some game UI accessibility experiments.

 * Researching the issues around pronunciation further.

 * Following the collaboration between W3C WebXR and Khronos glTF with respect to adding semantic information (such as scene descriptions).

 * Potentially getting involved in a W3C Games Community Group or Working Group.

 * Following WebXR accessibility-related developments generally.

Also hoping that there will be more events like this in future.

Speaking of which, there is the [Game Accessibility Conference "GAConf"](https://www.gaconf.com/)---I'd strongly recommend you check it out :-).

Some reference links
--------------------

Relevant links are given in their sections above, but here are some general and specifically accessibility-focused ones:

<!-- Note: accessibility session links are repeated above. -->

 * ["Accessibility at the W3C Workshop on Web Games" post on The Paciello Group 'blog](https://developer.paciellogroup.com/blog/2019/07/accessibility-at-the-w3c-workshop-on-web-games/)
 * [W3C Workshop on Web Games](https://www.w3.org/2018/12/games-workshop/)
 * [Position paper: "Adaptive Accessibility"](https://www.w3.org/2018/12/games-workshop/papers/web-games-adaptive-accessibility.html)
 * [Slides: "Adaptive Accessibility"](/talks/2019/web-games/index.html) (I'm continually working on improving the accessibility of these; input welcome.)
 * [Position paper: "Turning on “accessible mode” for users with motor impairments"](https://www.w3.org/2018/12/games-workshop/papers/accessible-mode.txt)
 * [Slides: "Turning on “accessible mode” for users with motor impairments" (PDF)](https://www.w3.org/2018/12/games-workshop/slides/14-accessible-mode.pdf)
 * [W3C Accessible Platform Architectures mailing list thread on the Web Games Workshop](https://lists.w3.org/Archives/Public/public-apa/2019Jul/0026.html)
