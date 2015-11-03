---
title: Test-driven Development As If You Meant It Reviewed&mdash;First Steps
layout: article
series: tddaiymi-reviewed-series
tags:
 - programming
 - tdd
extra-style: syntax
---

{% include series.html %}

This article was written with and is [also published
by](http://markwithall.com/programming/2015/10/xx/test-driven-development-as-if-you-meant-it-reviewed-part-iii.html)
Mark Withall.

Having done a few practice attempts at TDDAIYMI, it’s clear that the hardest
part is writing the first test. Unlike a more traditional approach to TDD, you
can’t leverage the ability to assume the existence of classes and methods to
write the test; and then implement them to make it pass. This can lead to some
rather contrived test failures.

The Starting Commits
---------------------

To illustrate the challenges of starting with TDDAIYMI, we are going to go
through the first few of our <span style="color: red;">RED</span>-<span
style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span>
cycles step-by-step and explain in detail our thought process at each stage.
We’ve included timestamps for the commits to make it easy to see how long each
step took.  These commits form part of the flamboyantly-named
[`attempt_006_tddaiymi_2` branch on
GitHub](https://github.com/matatk/NoughtsAndCrosses/tree/attempt_006_tddaiymi_2).

Each commit is presented, followed by the commentary on it.

### RED Test that a legal move is legal - 2015-02-19 13:25
{: style="color: red" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert move > 0
{% endhighlight %}

As mentioned [last
time](/articles/test-driven-development-as-if-you-meant-it-reviewed-part-2), we
are going to be tackling the problem of noughts and crosses (tic-tac-toe). We
decided, somewhat arbitrarily, to start with a method to check the legality of a
move. It seems more natural to approach TDDAIYMI in a bottom-up, as opposed to a
top-down, manner.

We have decided to use a numeric position for the move. What that exactly means
will be determined by the tests we write (the idea being that there are nine
squares, which we will identify as 0 to 8 -- interestingly, and as was discussed
in [Keith Braithwaite’s
workshop](http://www.infoq.com/presentations/TDD-as-if-You-Meant-It), this means
there is no notion of ‘a board’ specifically).

Our first test is somewhat contrived due to the restrictions of the process. One
could argue that the inclusion of the move variable is taking things a step too
far and that the initial test should have been `assert 0 > 0` followed by using
the [Extract Variable](http://refactoring.com/catalog/extractVariable.html) refactoring to get to the current state, after having made
the test pass.

### GREEN - 2015-03-02 13:09
{: style="color: green" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert move == 0  # changed
{% endhighlight %}

Making the test pass is trivial; as, of course, it should be. We change the
contrived ‘less than’ test to use an equals comparison. As we only have the one
test, there is no duplication to refactor, so we move straight onto the next
test.

### RED Test that an illegal move is not legal - 2015-03-02 13:20
{: style="color: red" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert move == 0

# added function
def test_illegal_move_is_not_legal():
    move = -1
    assert move == 0
{% endhighlight %}

We are essentially starting from scratch again with test number 2. That said, we
want to try and keep going in the same direction to triangulate some behaviour
to extract in the form of duplicate code.

We have settled on `move == 0` being the standard test for legality, so we now
want to use the same test, when presented with an invalid move. This will take
us a step closer to being able to remove duplication via [Extract
Method](http://refactoring.com/catalog/extractMethod.html) in future.

### GREEN - 2015-03-02 13:25
{: style="color: green" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert move == 0


def test_illegal_move_is_not_legal():
    move = -1
    assert (move == 0) is False  # changed
{% endhighlight %}

Note that the GREEN step is supposed to take the least-complex means to make
the tests pass -- it is the tests, not their solutions, that are intended to
direct the overall design of the code. This is why, in this case, the GREEN
step does seem rather simplistic. Arguably, we should have changed the `==` to
`!=` to make the test pass. By making the test pass in this way, we are
introducing some duplication that needs addressing and moves us nearer to our
goal.

### REFACTOR Extract `is_legal` function - 2015-03-02 13:28
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move)  # changed


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False  # changed


# added function
def is_legal(move):
    return move == 0
{% endhighlight %}

This REFACTOR step may seem somewhat ‘aggressive’, in the sense that it
lengthens the code, but it’s also vital (for any form of TDD) to refactor as
early as possible, in order to keep the code -- and any emerging avenues for
good design -- as ‘clean’ as possible. In this case, we had a DRY violation,
which needed to be fixed; introducing `is_legal()` solves that problem, and
starts giving some structure to the code. Using the tests to come at problems
from both sides, in a sort of pincer strategy, can enable us to tease out
structure such as this, and is a technique we used often.

### RED Test a different legal move - 2015-03-03 12:40
{: style="color: red" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move)


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


# added function
def test_different_legal_move_is_legal():
    move = 8
    assert is_legal(move)


def is_legal(move):
    return move == 0
{% endhighlight %}

We need to expand the range of legal moves. We start by testing the highest
legal value. Of course, there are many possible moves in the game and, whilst
we’d not want to test all of them separately, we do need to add at least one
more in order to pin down the range of valid moves -- think of it along the
lines of needing at least three points in order to be reasonably confident you
can draw a meaningful line through them.

### GREEN - 2015-03-03 12:48
{: style="color: green" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move)


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) or move > 0  # changed


def is_legal(move):
    return move == 0
{% endhighlight %}

We make this test pass, **in the test method**, and by **using the simplest
possible means** which, again, may seem somewhat insufficient at first glance.
We can use refactoring to improve the design. For some reason we changed our
test case to ‘1’ instead of ‘8’ at this point; which was rather naughty.

### REFACTOR Improve design by moving code - 2015-03-03 12:50
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move)


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move)  # changed


def is_legal(move):
    return move == 0 or move > 0  # changed
{% endhighlight %}

Next, for the first time, we have a few consecutive refactorings, and thus make
two separate REFACTOR commits. In the first, we move the extra legality check
to the `is_legal()` function, which is allowed per the rules, as it ‘improves
the design of the code’ and the rules allow us to move code from a test
function to an existing function. This is not strictly a refactoring, as it
changes the behaviour of the code (whereas refactoring should preserve
behaviour). However, the tests all still pass and this has given us a way to
improve the design.

### REFACTOR Simplify expression - 2015-03-03 12:52
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move)


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move)


def is_legal(move):
    return move >= 0  # changed
{% endhighlight %}

Now we are able to simplify the legality check, because all of the code is
together...

### REFACTOR Explicitly state expected result of tests - 2015-03-03 12:53
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move) is True  # changed


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True  # changed


def is_legal(move):
    return move >= 0
{% endhighlight %}

At this point, we realised that, as per [The Zen of
Python](https://www.python.org/dev/peps/pep-0020/)
and in the interests of making it easy to read and understand the tests,
‘explicit is better than implicit’ -- we had not been clearly stating what we
expected the results of the tests to be, so we add the cases where we want a
`True` result.

### RED Test the first illegal move on upper boundary - 2015-03-03 12:55
{: style="color: red" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move) is True


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True


# added function
def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move) is False


def is_legal(move):
    return move >= 0
{% endhighlight %}

The next logical failing test we can write is to use an illegal move at the
other end of the range. When we are no longer able to write a failing test, we
know we are done. (Note that if we wrote a test for checking a move of ‘8’ was
legal, it would pass, so it doesn’t need to be written.)

### GREEN - 2015-03-03 12:58
{: style="color: green" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move) is True


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True


def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move) or move < 9 is False  # changed


def is_legal(move):
    return move >= 0
{% endhighlight %}

Again, making the test pass is done in the test method itself, using the
simplest code.

### REFACTOR Improve design by moving code - 2015-03-03 13:05
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move) is True


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True


def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move) is False  # changed


def is_legal(move):
    return move >= 0 and move < 9  # changed
{% endhighlight %}

We refactor to improve the design by moving the extra code to the `is_legal()`
method. The tests are run automatically after each change we make, so we know
if we have broken anything. Once again, this is a pseudo-refactoring as, whilst
it doesn’t change the stated (tested) behaviour of the overall program, it does
change the behaviour of the function.

### RED Test previously-played move is illegal - 2015-03-04 12:39
{: style="color: red" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move) is True


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True


def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move) is False


# added function
def test_move_is_illegal_if_already_played():
    moves_played = [0]
    move = 0
    assert is_legal(move) is False


def is_legal(move):
    return move >= 0 and move < 9
{% endhighlight %}

We have now run out of the basic failing tests that we can think of for the
`is_legal()` method. We move on to expand its behaviour by considering
moves that have been played previously to be illegal. Again, this is somewhat
contrived as we are inventing some state that we aren’t initially using in the
test.

This direction of exploration seems like the most natural extension of the
existing test sequence. We are not attempting to force any sort of design; we
are just writing tests and will see what ‘design’ emerges.

### GREEN - 2015-03-04 12:44
{: style="color: green" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move) is True


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True


def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move) is False


def test_move_is_illegal_if_already_played():
    moves_played = [0]
    move = 0
    assert (is_legal(move) and move not in moves_played) is False  # changed


def is_legal(move):
    return move >= 0 and move < 9
{% endhighlight %}

We now use the state information to make the test pass in the test method.

### REFACTOR Introduce Parameter - 2015-03-04 12:56
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move, []) is True  # changed


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move, []) is False  # changed


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move, []) is True  # changed


def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move, []) is False  # changed


def test_move_is_illegal_if_already_played():
    moves_played = [0]
    move = 0
    assert (is_legal(move, moves_played) and move not in moves_played)
is False

def is_legal(move, moves_played):  # changed
    return move >= 0 and move < 9
{% endhighlight %}

We want to improve the design of the code by moving the new code that made the
test pass to the `is_legal()` method but to do this we need to pass the state
in too. We proceed cautiously and do this refactoring in a couple of steps.
First we add the extra parameter to the `is_legal()` method (which requires us
to update all the other tests that use `is_legal()`).

### REFACTOR Move history-checking code to is\_legal() - 2015-03-04 12:59
{: style="color: blue" }

{% highlight python %}
def test_legal_move_is_legal():
    move = 0
    assert is_legal(move, []) is True


def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move, []) is False


def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move, []) is True


def test_high_illegal_move_is_not_legal():
    move = 9
    assert is_legal(move, []) is False


def test_move_is_illegal_if_already_played():
    moves_played = [0]
    move = 0
    assert is_legal(move, moves_played) is False  # changed


def is_legal(move, moves_played):
    return move >= 0 and move < 9 and move not in moves_played  # changed
{% endhighlight %}

Now that we have passed in the parameter, we can move the extra check into
`is_legal()` and make sure that all of the tests still pass, which they do.

Next Time
----------

We could continue on but this gives sufficient flavour of the thought process
as we worked our way through the exercise. The rest of the development
continues in the same manner; looping through the <span style="color:
red;">RED</span>-<span style="color: green;">GREEN</span>-<span style="color:
blue;">REFACTOR</span> cycle. In the next article in the series we shall pick
out some interesting moments from the rest of the development and discuss them.
