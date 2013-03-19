---
layout: article
title: Static Site Tricks with Jekyll
tags:
 - website
 - jekyll
---
This site is powered by [Jekyll](http://jekyllrb.com) and hosted on [GitHub Pages](http://pages.github.com).  Whilst this is a great platform for hosting, it has some limitations brought about by the fact that the sites must be static and one can't run custom Jekyll plugins to do things like generate article indexes.

Luckily, however, there are industrious people out there who've come up with workarounds for some of these limitations by hacking around with [Liquid](http://liquidmarkup.org), the templating engine used by Jekyll.  Here are some resources I found particularly helpful.

 * [Blogging with Jekyll and GitHub Pages](http://brianscaturro.com/2012/06/12/blog-with-jekyll-and-github.html) is a comprehensive tutorial, covering everything from bootstrapping to Atom feeds and sitemaps.
 * How to [make an article series](http://realjenius.com/2012/11/03/jekyll-series-list/). Haven't used this one in its entirety yet, but expect to, and the templating techniques are powerful and well-explained.
 * [Mark Withall's site](http://www.markwithall.com/) gave me pointers on CSS and layout and has thoughtful touches such as including page-specific CSS/JavaScript, as well as interesting content.
 * Syntax highlighting courtessy of [Solarized](http://ethanschoonover.com/solarized) via a [modified version](https://github.com/matatk/matatk.github.com/blob/master/style/syntax.css) of Edward Hotchkiss' [syntax.css](https://gist.github.com/2005058).

There are also the standard reference pages I found myself coming back to often.

 * [Markdown Syntax](http://daringfireball.net/projects/markdown/syntax).
 * Jekyll's default Markdown engine, [Maruku](https://github.com/bhollis/maruku), supports [PHP Markdown Extra](http://michelf.ca/projects/php-markdown/extra/) syntax.
 * [Liquid's standard tags and filters](https://github.com/shopify/liquid/wiki/liquid-for-designers).
 * [Jekyll's Liquid extensions](https://github.com/mojombo/jekyll/wiki/Liquid-Extensions).
 * The [template data reference](https://github.com/mojombo/jekyll/wiki/Template-Data).

There are a few generally-expected features that aren't supported out of the box: tag clouds; automatic indexes of articles with a given tag/category and comments.  Whilst a number of solutions are out there, some future posts here will be looking at developing alternatives that are open and don't require custom plugins.
