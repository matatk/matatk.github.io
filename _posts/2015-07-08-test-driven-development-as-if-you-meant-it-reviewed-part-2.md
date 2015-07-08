---
title: Test-driven Development As If You Meant It Reviewed&mdash;The Problem
layout: article
series: tddaiymi-reviewed-series
tags: programming tdd
---

{% include series.html %}

This article was written with and is [also published by](http://markwithall.com/programming/2015/07/08/test-driven-development-as-if-you-meant-it-reviewed-part-ii.html) Mark Withall.

## The Problem: Noughts And Crosses (Tic-Tac-Toe in American)

In [Keith Braithwaite's](https://twitter.com/keithb_b) original exercise, the problem tackled was [Noughts and Crosses](https://en.wikipedia.org/wiki/Tic-tac-toe).  To allow us to compare with other attempts out on the Internet, we are going to tackle the same problem.  We intentionally didn't fully define the problem in advance; except to focus on the game management aspects, rather than any AI components.

## Language/Library Choices

We decided to do the exercise in Python (2.7), as it was the language with which we had the highest average skill level.  We used [pytest](http://pytest.org/latest/) and [mock](https://pypi.python.org/pypi/mock) for testing and [pytest-xdist](https://pypi.python.org/pypi/pytest-xdist) to allow the test to run continuously in the background and keep us honest.

Code was written in Vim (because, y'know, it's better than [REDACTED], etc.).  [YouCompleteMe](https://github.com/Valloric/YouCompleteMe) and [syntastic](https://github.com/scrooloose/syntastic) were used for autocompletion and static analysis to speed things along.  We did try the [rope refactoring tools](https://github.com/python-rope/ropevim) briefly but they aren't currently robust enough.  We must take some time to look at some of the issues we had at some point to help get it up to scratch; as life isn't worth living without refactoring tools.

The whole was wrapped up in [virtualenv](https://virtualenv.pypa.io) to make it easy to get up and running with a standard environment.

## Methodology

We started with some TDDAIYMI 'dry runs' to get the hang of using this technique as, whilst it seems very-much like TDD on paper, it 'feels' quite different to use it.  We then carried out our 'control' exercise of 'traditional' TDD and finally followed this up with a serious go at the problem in TDDAIYMI style.

For the experiment, we decided to commit after each stage of the <span style="color: red;">RED</span>-<span style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span> cycle, to allow the easiest replay of what happened.  In real life, we probably wouldn't choose the commit after a RED stage, to keep the repository in a working state as far as possible (e.g. to allow binary search of the history).

During the exercises we were looking out for:

* Similarities between the two approaches
* What worked with TDDAIYMI
* What didn't seem to work
* How we feel TDDAIYMI might be improved
* General lessons learnt

## Next Time

We finally get the flip on with it.
