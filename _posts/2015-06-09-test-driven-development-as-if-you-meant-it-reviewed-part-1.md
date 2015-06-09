---
title: Test-driven Development As If You Meant It Reviewed
layout: article
series: tddaiymi-reviewed-series
tags: programming tdd
---

{% include series.html %}

This article was written with and is [also published by](http://markwithall.com/programming/2015/06/09/test-driven-development-as-if-you-meant-it-reviewed-part-i.html) Mark Withall.

Part I: Introduction
--------------------

Writing [tests before you write any
code](http://www.diveintopython.net/unit_testing/stage_1.html) is
awesome. It means that you can rely on the code you've written to work
(most of the time) and you can [refactor with wild abandon, for example
to improve
performance](http://www.diveintopython.net/refactoring/),
because it's trivial to re-run the tests to check the code still behaves
itself. However, as with pretty-much everything else, there are many
ways to actually *do* Test-driven Development (or TDD, as most refer to
it), two of which we explored in detail.

In general, the idea is that you write a test, write some code to make
the test pass and then refactor (i.e. to remove duplication and
otherwise improve the code's design), before moving on to the next test.
Thus, there are three stages, which are usually referred to by
'colour'...

-   **<span style="color: red;">RED</span>** - Write a failing test

-   **<span style="color: green;">GREEN</span>** - Make the test pass

-   **<span style="color: blue;">REFACTOR</span>** - Improve the design
    of the code without changing the behaviour

-   **<span
    style="background: blue; color: lightblue;">`GOTO 10`</span>** (i.e.
    repeat the above, for the next test)

In most of its forms, TDD is not a substitute for a certain amount of
up-front design (though it certainly helps, as it discourages writing
unnecessary code) -- it's expected that you have a good overall idea of
where you're going architecturally, e.g. that you'd have a Model, View
and Controller, perhaps. You also need to decide the *granularity* of
your red-green-refactor cycles -- is a 'red' commit an entire test, or
does it only go up to a compilation failure (e.g. where you may need to
introduce a mock to take the place of a model, controller or other
object -- we'll see examples of this later). There's a lot of variation
and different views on these sorts of things.

A more pedantic flavour of TDD has been proposed that caught our
attention, so we had to give it a go...

### What Is TDDAIYMI?

[Test Driven Development As If You Meant It
(TDDAIYMI)](http://cumulative-hypotheses.org/2011/08/30/tdd-as-if-you-meant-it/)
is a TDD workshop exercise devised by [Keith
Braithwaite](https://twitter.com/keithb_b). It was first presented at
[Software Craftsmanship
2009](http://www.codemanship.co.uk/softwarecraftsmanship/).

The exercise aims to apply TDD in the most pedantic way possible; to
stretch one's programming muscles. It is not intended that this extreme
approach is used on a daily basis, for real-world programming tasks.

TTDAIYMI takes the form of a re-phrasing of the standard TDD steps, as
follows (taken from the original article, see above).

#### The Rules

1. Write exactly one new test, the smallest test you can that seems to
   point in the direction of a solution

1. See it fail

1. Make the test from (1) pass by writing the least implementation code
   you can **in the test method**.

1. Refactor to remove duplication, and otherwise as required to improve
   the design. Be strict about using these moves:

   1. **you want a new method -- wait until refactoring time, then...**
        create new (non-test) methods by doing one of these, and in no
        other way:

      1. preferred: do Extract Method on implementation code created
         as per (3) to create a new method in the test class, or

      1. if you must: move implementation code as per (3) into an
         existing implementation method

   1. **you want a new class -- wait until refactoring time, then...**
        create non-test classes to provide a destination for a Move
        Method and for no other reason

      1. populate implementation classes with methods by doing Move
         Method, and no other way

### How Does It Differ From 'Normal' TDD?

There are many approaches to TDD but, for our comparison, let us take
Uncle Bob's 'Three Laws' approach.

#### The Three Laws Of TDD

['Uncle' Bob Martin](https://twitter.com/unclebobmartin),
in his article on the [Three Laws of TDD](http://butunclebob.com/ArticleS.UncleBob.TheThreeRulesOfTdd),
clarifies the <span style="color: red;">RED</span>-<span style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span> process with some restrictions upon how
to follow the steps. These clarifications are as follows:

1.  You are not allowed to write any production code unless it is to
    make a failing unit test pass.

2.  You are not allowed to write any more of a unit test than is
    sufficient to fail; and compilation failures are failures.

3.  You are not allowed to write any more production code than is
    sufficient to pass the one failing unit test.

This is already quite similar to TDDAIYMI but with the added flexibility
to infer the existence of production code (or at least
interfaces/protocols that other production code might implement); in
fact, in some ways it actively encourages it by allowing you to break up
the creation of a single test into multiple <span style="color: red;">RED</span>-<span style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span> steps,
creating little bit of missing production code as you go.

Next Time
---------

In the rest of this series we are going to write about our experiences
of trying out TDDAIYMI on a small project and then comparing it to a
more traditional TDD approach tackling the same problem.
