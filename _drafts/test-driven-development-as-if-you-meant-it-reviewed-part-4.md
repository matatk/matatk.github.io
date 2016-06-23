---
title: Test-driven Development As If You Meant It Reviewed&mdash;Interesting Moments
layout: article
series: tddaiymi-reviewed-series
tags:
 - programming
 - tdd
---

{% include series.html %}

This article was written with and is [also published by](http://markwithall.com/programming/2015/11/03/test-driven-development-as-if-you-meant-it-reviewed-part-iv.html) Mark Withall.

We’ve taken a detailed look, in the previous part, at how to get started with TDDAIYMI, in this part we will jump around a bit more and look at several of the interesting moments that came about during the exercise.

Rough notes
-----------
{: style="color: red" }

For easy copy-pasting:

<span style="color: red;">RED</span>-<span style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span>

Interesting Moment 1: Communicating Classes
-------------------------------------------

Our first concern was how to introduce classes when this became necessary — because the tests must be made to pass within the test method, we thought this would be tricky. However we realised that, when we want to split out an inner class to clean up an existing class, this can easily be achieved in the refactoring stage. [The ResultChecker class](https://github.com/matatk/NoughtsAndCrosses/commit/7a8486584e5d073d84f5fe2e301a9b8fd78b75bd) was extracted from the existing code as part of the refactoring, in line with rule 4b:

> You want a new class – wait until refactoring time, then… create non-test classes to provide a destination for a Move Method and for no other reason (populate implementation classes with methods by doing Move Method, and no other way)

What about when the need for a class comes up that does something different to an existing class, so can’t simply be extracted from it? In commit ***FIXME*** we stopped because we saw no immediate way to introduce further classes that we believed were required, the reason being that we could not think a TDDAIYMI-compliant means to introduce the communication between classes. When we know we want to adopt an MVC design, how do we use TDDAIYMI to help us wire up the Model and View, via the Controller? They have to be able to communicate.

Fortunately the answer to this one is straightforward, too. Imagine that we have already separately developed the view and model, and wish to write the controller (this seems like a sufficiently bottom-up way of doing things, which we feel fits TDDAIYMI). In this case, we can write the tests for the wiring between the Model and View, making them pass within the test methods, as stipulated by the rules. We will then start to be able to extract methods (as per rule 4a) and, ultimately, arrive at a point where a lot of related methods will be ripe for refactoring into a class (as per rule 4b).
{: style="color: red" }

Interesting Moment 2: Rookie Mistakes
-------------------------------------

One common error that we made during the exercise was to do a large refactoring in a single step. For example, in [94daea6](https://github.com/matatk/NoughtsAndCrosses/commit/94daea6de4c96c7d085893e3f5ab701d8f11b779) we jumped straight to the extraction of a method for `is_legal` without going through an intermediate step of refactoring the code to look the same in both cases. This would have left us a trivial extract method refactoring. By doing the whole refactoring in a single step when run the risk of introducing errors, or at the very least having to go back and redo the refactoring when we get it wrong.

The same is sometime true when making a test pass. For example, in [29120f5](https://github.com/matatk/NoughtsAndCrosses/commit/29120f5a4ac5a8ebe732c29dbfa1813df7dc0689) the test has carelessly been made to pass outside of the test itself. In this case, we should have first added the extension `or ...` to the `is_legal` call and then use a refactoring to move the code into the production code. We use the correct approach in a later attempt: [5612782](https://github.com/matatk/NoughtsAndCrosses/commit/561278216c74d576f9c6e672997bae9c311d77c7).

Interesting Moment 3: Rule Violations
-------------------------------------

One of the most common violations of ‘the rules’ of TDD was to modify the behaviour of code during a ‘refactoring’. This most commonly took the form of moving behaviour into existing methods. For example: …
{: style="color: red" }

What would have been the correct way of going about this change? One possible approach would be to make all of the uses of the method look the same first. Then extract a new method and inline the old one. This would look something like the following: …
{: style="color: red" }

Another instance where we were a bit aggressive in the refactoring step was in [b873939](https://github.com/matatk/NoughtsAndCrosses/commit/b873939af49e97ec69eed930013de18e818affd0) where we introduced use of sets and the `any` function (which is nice and neat, but does alter the behaviour somewhat.
{: style="color: red" }

Interesting Moment 4: Data vs Code
----------------------------------

The approach we took to determining whether a position was a win in early attempts took the form of gradually building up example cases of win/not-win conditions and adding to the code that evaluated the position to pass the tests.

MTA: This often got us into a very repetitive rut with the TDD process, where not much was added to the code, but we couldn’t seem to get off that path, as can be seen between [63c0795](https://github.com/matatk/NoughtsAndCrosses/commit/63c0795942088d391cd39bf0d3d64c37b433eee3) and [bce901b](https://github.com/matatk/NoughtsAndCrosses/commit/bce901b44f23403e722977e3decfd785833aa960).
{: style="color: blue" }

In later attempts, for example attempt 006 (***FIXME*** link), we moved to an approach of having a the list of winning conditions as data, and wrote tests to drive a solution that looked to see if the win condition was contained in the list of winning conditions.

The later approach ends up with a much similar and more flexible result, which would allow us to change the size of the board almost trivially. This level of flexibility could have been achieved in the algorithmic position evaluation too but would have required many more tests to get to that stage.

Next Time
---------

Next time we will look at a more traditional TDD approach (in a London/Mockist style - as we’re British) to this exercise and see how it compares and contrasts to the TDDAIYMI style of development.
