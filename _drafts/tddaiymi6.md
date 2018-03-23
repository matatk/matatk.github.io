---
title: Test-driven Development As If You Meant It Reviewed&mdash;Other Interesting Moments
layout: article
series: tddaiymi-reviewed-series
tags:
 - programming
 - tdd
extra-style: syntax
---

{% include series.html %}

This article was written with and is [also published by](http://markwithall.com/programming/2018/03/0?/test-driven-development-as-if-you-meant-it-reviewed-part-vi.html) Mark Withall.

Last time we looked at the beginnings of creating our Noughts and Crosses app using 'normal' TDD. This time we'll continue looking at the 'normal' TDD approach for other parts of the development.

In particular, we’ll look at the three main transitions points: starting the model implementation, starting the view implementation, and putting it all together into a running app.

Having completed the initial development of the controller, we now have a we defined API for both the model and the view. We could choose either to continue our development and, arbitrarily, we chose to begin with the model.


AUTHOR NOTES
------------

-   [GitHub branch for this line of development](https://github.com/BillionthMonkey/NoughtsAndCrosses/tree/attempt_005_normal_tdd_separate_board_renderer) (we should link this into the text somewhere?)
-   Transitions between C and M, M and V
-   [Model](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/ea5d659b14c124bbc037e3e38c34a9d06e3db526)
    (initially, getting the name of the test fixture wrong) This should
    be a simple process of test-driving the API that is used by the
    controller.
-   [Separating classes into own files](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/578211f165e529c85f3c2fbf5709253fa18d4c3d)
-   [View](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/8eeb7373dc4fba7b694b23ef24c071a4b8a9083d)
    As with the Model, this should be a simple process of test-driving
    the API that is used by the controller.
-   Backtracking ("Normal" TDD is not a substitute for good
    design)

**Template for RGR HTML:**
We'll start off in this part by looking, step-by-step, at each of the initial commits of the <span style="color: red;">RED</span>-<span style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span> cycle.

The Model API
-------------

[as defined by TDDing the controller]

Start: [ea5d659](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/ea5d659b14c124bbc037e3e38c34a9d06e3db526)

The first few commits are filling in `is_legal()` and then making it actually do stuff (previously we only tested that the controller called it; its return value was provided by a mock and was either `True` or `False`, depending on whether we were testing what happens when a legal or illegal move was played).

We first check for an illegal move in [72f6738](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/72f673853e17d6bd99546dad7bbf93c8af0aeafd) We then add 9 at the top of the range in [62b4302](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/62b4302e876a65f8dfab203f90307f3cffbb4a66) and refactor to assume anything within the range is valid in [30322c5](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/30322c51d259f68e994cc93f12841a898726f60b).

*We should say something about the removal of magic numbers, as in the refactor in [bfc5f16](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/bfc5f164eb556c3c74b1e741dc4f5a8da1f6d668) to make the number of board cells a clear concept within the code.*

In [a152be3](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/a152be3a995cba44c52162c7cb7ac8231db4c5f6) we start a short story arc of tests that set up checking for moves that have already been played.  At the start we don't check (as no moves have been played), then we increase this to checking the last move in [d9f980d](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/d9f980dd22dc3b1ffa89f0a7bacbf16d9d6df1a6) and finally generalise it from [0626105](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/0626105ca12c781f10d14679c7caed683602b35c).

The rest of the model follows the same pattern of filling in the
functions we'd previously mocked, then writing tests that coax us into
checking the input; simply at first and then extending the checks as far
as is necessary to cover the possible cases within the game.

The View API
------------

[as defined by TDDing the controller]

Start: [8eeb737](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/8eeb7373dc4fba7b694b23ef24c071a4b8a9083d)

There are multiple options for the type of view that we want to create.  For simplicity, we decided to go with a simple console application. We start the view by filling in the `win()` method. In this case, winning results in printing a nice message to the screen - 'Congratulations; you won!'. An added wrinkle here is that we need to mock stand output, so that we can see what is written to it. Fortunately, Python makes this straightforward to achieve [70d9455](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/70d9455fb9484b9435165bad006a775509d8a4ba).

After dealing with winning, and adding drawing, we move on to the main part of rendering the board. We make the design decision to delegate the actual drawing to a board renderer class: [cef65f9](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/cef65f97d19604b2fe72b2b44ebf14073ac43200) [this allows us to develop two sets of simpler tests, rather than one more complicated set.]

We then move on to the main part of the development of the view,
creating the board renderer itself: [21a531f](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/21a531fee9368b95b2b4c175f618577e605a27ec).

We start this by developing the rendering on an empty board as an ASCII display: [91270f5](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/91270f5d105e33de3f243b371a267205b27009c9).

We take an interesting refactoring step after this first sequence, [dd880ce](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/dd880cef93070927f659120774937a4813a7bda8), were we remove the duplication in printing the board. There is a risk that this refactoring is premature, as further tests to develop the board printing might show the refactoring to be wrong.

The Naughty Bit
---------------

[creating an app runner that has slightly too much functionality, without TDDing it!]

After writing all the gubbins of the code, we needed something to wire it all together so that it would actually *do something*. This took the form of a launcher script. Ideally these sorts of scripts would be so simple that they don't need TDDing themselves; they simply initialise the required bits (in our case things like `ResultChecker` and `BoardRenderer`, wire them up and kick off a loop through which the user can direct what happens.

However, we rather overshot what is reasonable to include in such a script without testing. Whilst the variable set-up and dependency injection bit <https://github.com/BillionthMonkey/NoughtsAndCrosses/blob/a82bb4c533e13c7050a7207f0a5d4a2568f9d043/nac.py\#L16-L24> is fine, we really should have tested the following:

The loop that takes input from the user and calls the appropriate action in the library code <https://github.com/BillionthMonkey/NoughtsAndCrosses/blob/a82bb4c533e13c7050a7207f0a5d4a2568f9d043/nac.py\#L26-L39>

One area where we *don't* feel that we did too much without testing was the patterns that represent winning moves <https://github.com/BillionthMonkey/NoughtsAndCrosses/blob/a82bb4c533e13c7050a7207f0a5d4a2568f9d043/nac.py\#L10-L14>. This is because, within the way that the Noughts and Crosses library code is designed, this is configuration data rather than code itself. Configuration data ought to be tested, of course, but this would usually be done at a higher level than unit tests, which is the focus of TDD. **NOTE COMMENTS (AND IN OTHER AREAS TOO)**

If we were to create this script again, then we ought to have developed
the main loop in TDD fashion.

<https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/a82bb4c533e13c7050a7207f0a5d4a2568f9d043>

Next Time
---------

???
