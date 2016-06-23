---
layout: article
title: Responsive Layout
tags: web website accessibility
extra-style: syntax
---

I have recently created a basic responsive layout for this site.  The two main principles I followed were those outlined in the following very clear, visual and well-written articles.

 1. [Progressive enhancement, starting with the most constrained layout](http://verekia.com/initializr/responsive-template).

 2. [Using em units for the breakpoints, ensuring an inherently more content-centric, device-agnostic and accessible design](http://blog.cloudfour.com/the-ems-have-it-proportional-media-queries-ftw/).
	- It's more accessible because using em units for viewport widths allows the browser to react to both the physical size of the device *and* the base font size as set by the user---so, if they have a bigger base font size, or zoom the page, the layout adapts if necessary.
	- Since the article was published, browser support has come on even further and I found no reloading requirement.

Remember to [use the viewport meta-tag (and CSS @viewport) to ensure correct mobile rendering](http://webdesign.tutsplus.com/articles/quick-tip-dont-forget-the-viewport-meta-tag--webdesign-5972)---but **[do not disable zoom gestures](http://a11yproject.com/posts/never-use-maximum-scale/) as this would render your site unreadable to vision-impaired people**, which includes those with minor to severe sight problems.  The following HTML and CSS work well:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

...and the CSS:

```css
@viewport, @-ms-viewport {
    zoom: 1.0;
    width: extend-to-zoom
}
```

[The layout's CSS](http://matatk.agrip.org.uk/style/me.css) is fairly simple; just a couple of major breakpoints (flipping from vertical to horizontal navigation and finally to a wide layout) and a few minor ones (to grab progressively more whitespace around the navigation links).  Note that the ems appearing in CSS media queries are the same as [root ems](https://www.google.co.uk/search?&q=root+ems), which is perfectly logical---it just means that even if you use e.g. a larger font on the `<body>`, as this layout does, the content breakpoints are still in root ems (so the '45em' cap on body width actually occurs at a viewport width of 54rems).

You may also like to read [7 Habits of Highly Effective Media Queries](http://bradfrostweb.com/blog/post/7-habits-of-highly-effective-media-queries/), which brings together the above and other great advice.  Also [Smashing magazine's article on breakpoints](http://www.smashingmagazine.com/2013/03/01/logical-breakpoints-responsive-design/) is clearly-explained and recommends the content-centric approach.
