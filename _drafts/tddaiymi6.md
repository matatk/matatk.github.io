---
title: Test-driven Development As If You Meant It Reviewed&mdash;Other Interesting Moments
layout: article
series: tddaiymi-reviewed-series
tags:
 - programming
 - tdd
extra-style: syntax
---

{% include series.html -%}

This article was written with and is [also published by](http://markwithall.com/programming/2018/03/0?/test-driven-development-as-if-you-meant-it-reviewed-part-vi.html) Mark Withall.

Last time we looked at the beginnings of creating our Noughts and Crosses app using 'normal' TDD. This time we'll continue looking at the 'normal' TDD approach for other parts of the development.

In particular, we’ll look at the three main transitions points: starting the model implementation, starting the view implementation, and putting it all together into a running app.

Having completed the initial development of the controller, we now have a we defined API for both the model and the view. We could choose either to continue our development and, arbitrarily, we chose to begin with the model.


AUTHOR NOTES
------------

-   Stuff in the document ***highlighted thusly*** is TBD.
-   We should probably note that not all commits are being discussed here; some are skipped over. At the start, I made this a bit more explicit (by linking to them) but we could mention it?
-   Should we mention Refined GitHub, as a means to move back/forward through the commits on the web? If so, should we add it to part 1?
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

The Model API
-------------

***[as defined by TDDing the controller]***

***Start: [ea5d659](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/ea5d659b14c124bbc037e3e38c34a9d06e3db526)***

The first few commits are filling in `is_legal()` and then making it actually do stuff (previously we only tested that the controller called it; its return value was provided by a mock and was either `True` or `False`, depending on whether we were testing what happens when a legal or illegal move was played).

We first check for an illegal move.

### RED check for illegal move - 2014-10-01 [12:39](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/72f673853e17d6bd99546dad7bbf93c8af0aeafd)
{: style="color: red" }

```python
def test_is_legal_returns_false_with_illegal_move(self):
    model = NoughtsAndCrossesModel()
    assert model.is_legal(-1) is False
```
```diff
diff --git a/nac.py b/nac.py
index efa3f1b..0bd47a8 100644
--- a/nac.py
+++ b/nac.py
@@ -51,10 +51,6 @@ class TestNoughtsAndCrossesController():
         model = NoughtsAndCrossesModel()
         assert model.is_legal(0) is True

-    def test_is_legal_returns_false_with_illegal_move(self):
-        model = NoughtsAndCrossesModel()
-        assert model.is_legal(-1) is False
-

 class MoveResult:
     no_result = 0
```

### GREEN - 2014-10-01 [12:41](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/4b3c3ecb17061d5e949ba8b35c50ff22f0f69dcd)
{: style="color: green;" }

```python
class NoughtsAndCrossesModel():
    def is_legal(self, move):
        if move == -1:
            return False
        return True
```
```diff
diff --git a/nac.py b/nac.py
index 999f434..efa3f1b 100644
--- a/nac.py
+++ b/nac.py
@@ -84,6 +84,4 @@ class NoughtsAndCrossesController:

 class NoughtsAndCrossesModel():
     def is_legal(self, move):
-        if move == -1:
-            return False
         return True
```

After some [fettling of the test infrastructure](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/7b180d6aa7a618f1784257b598d963e0f1ec3ff3) we add 9 at the top of the range&mdash;which has to be justified by a further test, of course.

### RED another illegal move - 2014-10-01 [12:45](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/62b4302e876a65f8dfab203f90307f3cffbb4a66)
{: style="color: red;" }

```python
def test_is_legal_returns_false_with_another_illegal_move(self):
    assert self.model.is_legal(9) is False
```
```diff
diff --git a/nac.py b/nac.py
index ae82b25..b9b447b 100644
--- a/nac.py
+++ b/nac.py
@@ -56,9 +56,6 @@ class TestNoughtsAndCrossesController():
     def test_is_legal_returns_false_with_illegal_move(self):
         assert self.model.is_legal(-1) is False

-    def test_is_legal_returns_false_with_another_illegal_move(self):
-        assert self.model.is_legal(9) is False
-

 class MoveResult:
     no_result = 0
```

### GREEN - 2014-10-01 [12:46](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/3d0d8fe2728732aa54349b456b3493e49a8a360e)
{: style="color: green" }

```python
class NoughtsAndCrossesModel():
    def is_legal(self, move):
        if move == -1 or move == 9:
            return False
        return True
```
```diff
diff --git a/nac.py b/nac.py
index 8d296e5..ae82b25 100644
--- a/nac.py
+++ b/nac.py
@@ -88,6 +88,6 @@ class NoughtsAndCrossesController:

 class NoughtsAndCrossesModel():
     def is_legal(self, move):
-        if move == -1 or move == 9:
+        if move == -1:
             return False
         return True
```

and, a little later, refactor to assume anything within the range is valid.

***COMMENT: Mat:
Some discussion on this sounds like a good idea. It does assume a lot, but it also keeps the tests passing and makes the code simpler, so actually seems like a good move on reflection?***

### REFACTOR simplify is_legal - 2014-10-01 [12:47](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/30322c51d259f68e994cc93f12841a898726f60b)
{: style="color: blue" }

```python
class NoughtsAndCrossesModel():
    def is_legal(self, move):
        return move in range(9)
```
```diff
diff --git a/nac.py b/nac.py
index a8cfa3c..8d296e5 100644
--- a/nac.py
+++ b/nac.py
@@ -88,4 +88,6 @@ class NoughtsAndCrossesController:

 class NoughtsAndCrossesModel():
     def is_legal(self, move):
-        return move in range(9)
+        if move == -1 or move == 9:
+            return False
+        return True
```

There is a further refactoring step immediately after this: the extraction of the 'magic number' 9 in the code above. Magic numbers are constants that appear in the code without any inherent or explicit explanation. They are often important facets of the problem domain (the size of the board, in this case), therefore they can also crop up quite often. This can become a maintenance headache, as if any of the assumptions are changed (such as if we were to enlarge the board), we have a big ["Don't Repeat Yourself (DRY)"](https://en.wikipedia.org/wiki/Don't_repeat_yourself) violation to sort out.

Therefore, magic numbers should be extracted as variables. This improves the clarity of the code, and helps us avoid DRY problems in future.

### REFACTOR remove magic number - 2014-10-01 [12:48](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/bfc5f164eb556c3c74b1e741dc4f5a8da1f6d668)
{: style="color: blue" }

```python
class NoughtsAndCrossesModel():
    def is_legal(self, move):
        number_of_cells = 9
        return move in range(number_of_cells)
```
```diff
diff --git a/nac.py b/nac.py
index 1228605..a8cfa3c 100644
--- a/nac.py
+++ b/nac.py
@@ -88,5 +88,4 @@ class NoughtsAndCrossesController:

 class NoughtsAndCrossesModel():
     def is_legal(self, move):
-        number_of_cells = 9
-        return move in range(number_of_cells)
+        return move in range(9)
```

We then start a short story arc of tests that set up checking for moves that have already been played. At the start we don't check (as no moves have been played),

### RED cannot play move already played - 2014-10-01 [12:56](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/a152be3a995cba44c52162c7cb7ac8231db4c5f6)
{: style="color: red;" }

```python
def test_is_legal_returns_false_if_move_already_played(self):
    self.model.play_move(0)
```
```diff
diff --git a/nac.py b/nac.py
index 92eb097..1228605 100644
--- a/nac.py
+++ b/nac.py
@@ -59,9 +59,6 @@ class TestNoughtsAndCrossesController():
     def test_is_legal_returns_false_with_another_illegal_move(self):
         assert self.model.is_legal(9) is False

-    def test_is_legal_returns_false_if_move_already_played(self):
-        self.model.play_move(0)
-

 class MoveResult:
     no_result = 0
```

then we increase this to checking the last move

### RED detect move already played - 2014-10-01 [12:57](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/d9f980dd22dc3b1ffa89f0a7bacbf16d9d6df1a6)
{: style="color: red;" }

```python
def test_is_legal_returns_false_if_move_already_played(self):
    self.model.play_move(0)
    assert self.model.is_legal(0) is False
```
```diff
diff --git a/nac.py b/nac.py
index 70a8754..19d83f9 100644
--- a/nac.py
+++ b/nac.py
@@ -61,7 +61,6 @@ class TestNoughtsAndCrossesController():

     def test_is_legal_returns_false_if_move_already_played(self):
         self.model.play_move(0)
-        assert self.model.is_legal(0) is False


 class MoveResult:
```

and finally generalise it

### RED check for historical moves - 2014-10-01 [13:01](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/0626105ca12c781f10d14679c7caed683602b35c)
{: style="color: red;" }

```python
def test_is_legal_returns_false_if_move_historically_played(self):
    self.model.play_move(0)
    self.model.play_move(1)
    assert self.model.is_legal(0) is False
```
```diff
diff --git a/nac.py b/nac.py
index efb3acc..7945e94 100644
--- a/nac.py
+++ b/nac.py
@@ -63,11 +63,6 @@ class TestNoughtsAndCrossesController():
         self.model.play_move(0)
         assert self.model.is_legal(0) is False

-    def test_is_legal_returns_false_if_move_historically_played(self):
-        self.model.play_move(0)
-        self.model.play_move(1)
-        assert self.model.is_legal(0) is False
-

 class MoveResult:
     no_result = 0
```

The rest of the model follows the same pattern of filling in the functions we'd previously mocked, then writing tests that coax us into checking the input; simply at first and then extending the checks as far as is necessary to cover the possible cases within the game.

The View API
------------

***[as defined by TDDing the controller]***

***Start: [8eeb737](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/8eeb7373dc4fba7b694b23ef24c071a4b8a9083d)***

There are multiple options for the type of view that we want to create.  For simplicity, we decided to go with a simple console application. We start the view by filling in the `win()` method. In this case, winning results in printing a nice message to the screen - 'Congratulations; you won!'. An added wrinkle here is that we need to mock stand output, so that we can see what is written to it. Fortunately, Python makes this straightforward to achieve.

### RED 'win' method should emit congratulatory message - 2014-10-23 [13:21](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/70d9455fb9484b9435165bad006a775509d8a4ba)
{: style="color: red;" }

```python
import sys
import mock
from nac.view import NoughtsAndCrossesView

class TestNoughtsAndCrossesView():
    def test_win(self):
        fake_stdout = mock.Mock()
        sys.stdout = fake_stdout
        view = NoughtsAndCrossesView()
        view.win()
        fake_stdout.write.assert_any_call('Congratulations; you won!')
```
```diff
diff --git a/tests/test_view.py b/tests/test_view.py
index 03ea88a..edbab7c 100644
--- a/tests/test_view.py
+++ b/tests/test_view.py
@@ -1,11 +1,6 @@
-import sys
-import mock
 from nac.view import NoughtsAndCrossesView

 class TestNoughtsAndCrossesView():
     def test_win(self):
-        fake_stdout = mock.Mock()
-        sys.stdout = fake_stdout
         view = NoughtsAndCrossesView()
         view.win()
-        fake_stdout.write.assert_any_call('Congratulations; you won!')
```

After dealing with winning, and adding drawing, we move on to the main part of rendering the board. We make the design decision to delegate the actual drawing to a board renderer class.

### RED need a board renderer - 2014-11-13 [13:14](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/cef65f97d19604b2fe72b2b44ebf14073ac43200)
{: style="color: red;" }

```python
def test_reset(self):
    self.view.reset()
    self.fake_board_renderer.render.assert_called_with([])
```
```diff
diff --git a/tests/test_view.py b/tests/test_view.py
index 33ed3bc..f66b6e3 100644
--- a/tests/test_view.py
+++ b/tests/test_view.py
@@ -20,7 +20,6 @@ class TestNoughtsAndCrossesView():

     def test_reset(self):
         self.view.reset()
-        self.fake_board_renderer.render.assert_called_with([])

     def _assert_stdout_is(self, expected, capsys):
         out, err = capsys.readouterr()
```

This allows us to develop two sets of simpler tests, rather than one more complicated set.

We then move on to the main part of the development of the view,
creating the board renderer itself (alas we gave this one a very similar name to the previous one, partly because there were several tests in-between and we didn't go back to check the name of the one shown above; oops).

### RED need board renderer - 2014-11-18 [13:15](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/21a531fee9368b95b2b4c175f618577e605a27ec)
{: style="color: red;" }

```python
class TestBoardRenderer():
    def test_empty_board(self, capsys):
        board_renderer = BoardRenderer()
```
```diff
diff --git a/tests/test_view.py b/tests/test_view.py
index 972389a..fbd2229 100644
--- a/tests/test_view.py
+++ b/tests/test_view.py
@@ -40,8 +40,3 @@ class TestNoughtsAndCrossesView():
     def _assert_stdout_is(self, expected, capsys):
         out, err = capsys.readouterr()
         assert out == expected
-
-
-class TestBoardRenderer():
-    def test_empty_board(self, capsys):
-        board_renderer = BoardRenderer()
```

After some [further set-up style tests using pytest's standard output capture](https://docs.pytest.org/en/2.8.7/capture.html), we have a test that requires the rendering on an empty board as an ASCII display.

### RED need a board! - 2014-11-18 [13:24](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/91270f5d105e33de3f243b371a267205b27009c9)
{: style="color: red;" }

```python
def test_empty_board(self, capsys):
    board_renderer = BoardRenderer()
    board_renderer.render([])
    assert_stdout_is('+---+---+---+\n' \
                     '|   |   |   |\n' \
                     '+---+---+---+\n' \
                     '|   |   |   |\n' \
                     '+---+---+---+\n' \
                     '|   |   |   |\n' \
                     '+---+---+---+\n',
                     capsys)
```
```diff
diff --git a/tests/test_view.py b/tests/test_view.py
index a58bbbb..ad01673 100644
--- a/tests/test_view.py
+++ b/tests/test_view.py
@@ -42,14 +42,6 @@ class TestBoardRenderer():
     def test_empty_board(self, capsys):
         board_renderer = BoardRenderer()
         board_renderer.render([])
-        assert_stdout_is('+---+---+---+\n' \
-                         '|   |   |   |\n' \
-                         '+---+---+---+\n' \
-                         '|   |   |   |\n' \
-                         '+---+---+---+\n' \
-                         '|   |   |   |\n' \
-                         '+---+---+---+\n',
-                         capsys)


 def assert_stdout_is(expected, capsys):
```

We take an interesting refactoring step after this first sequence, were we remove the duplication in printing the board. There is a risk that this refactoring is premature, as further tests to develop the board printing might show the refactoring to be wrong.

### REFACTOR DRY the board printing - 2014-11-18 [13:28](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/dd880cef93070927f659120774937a4813a7bda8)
{: style="color: blue;" }

```python
class BoardRenderer():
    def render(self, moves):
        for i in range(3):
            self._print_border()
            self._print_row()
        self._print_border()

    def _print_row(self):
        print '|   |   |   |'

    def _print_border(self):
        print '+---+---+---+'
```
```diff
diff --git a/nac/view.py b/nac/view.py
index 9535f56..db27d3a 100644
--- a/nac/view.py
+++ b/nac/view.py
@@ -22,13 +22,10 @@ class NoughtsAndCrossesView():

 class BoardRenderer():
     def render(self, moves):
-        for i in range(3):
-            self._print_border()
-            self._print_row()
-        self._print_border()
-
-    def _print_row(self):
-        print '|   |   |   |'
-
-    def _print_border(self):
-        print '+---+---+---+'
+        print '+---+---+---+\n' \
+              '|   |   |   |\n' \
+              '+---+---+---+\n' \
+              '|   |   |   |\n' \
+              '+---+---+---+\n' \
+              '|   |   |   |\n' \
+              '+---+---+---+'
```

***What happened? What about magic numbers, as mentioned above?***

The Naughty Bit
---------------

***[creating an app runner that has slightly too much functionality, without TDDing it!]***

After writing all the gubbins of the code, we needed something to wire it all together so that it would actually *do something*. This took the form of a launcher script. Ideally these sorts of scripts would be so simple that they don't need TDDing themselves; they simply initialise the required bits (in our case things like `ResultChecker` and `BoardRenderer`, wire them up and kick off a loop through which the user can direct what happens.

However, we rather overshot what is reasonable to include in such a script without testing. Whilst the [variable set-up and dependency injection bit](https://github.com/BillionthMonkey/NoughtsAndCrosses/blob/a82bb4c533e13c7050a7207f0a5d4a2568f9d043/nac.py\#L16-L24)

```python
result_checker = ResultChecker(winning_moves, number_of_cells)
model = NoughtsAndCrossesModel(result_checker, number_of_cells)

board_renderer = BoardRenderer()
view = NoughtsAndCrossesView(board_renderer)

controller = NoughtsAndCrossesController(model, view)

controller.reset()
```

is fine ***[EXPLAIN WHY?]***, we really should have tested the [loop that takes input from the user and calls the appropriate action in the library code](https://github.com/BillionthMonkey/NoughtsAndCrosses/blob/a82bb4c533e13c7050a7207f0a5d4a2568f9d043/nac.py\#L26-L39):

```python
while True:
    try:
        thing = raw_input('> ')
        if thing.isdigit():
            controller.play_move(int(thing))
        elif thing == 'reset':
            controller.reset()
        elif thing == 'quit':
            controller.quit()
            break
    except KeyboardInterrupt:
        print
        controller.quit()
        break
```

One area where we *don't* feel that we did too much without testing was the [patterns that represent winning moves](https://github.com/BillionthMonkey/NoughtsAndCrosses/blob/a82bb4c533e13c7050a7207f0a5d4a2568f9d043/nac.py\#L10-L14).

```python
winning_moves = [
    [ 0, 1, 2 ], [ 3, 4, 5 ], [ 6, 7, 8 ],
    [ 0, 3, 6 ], [ 1, 4, 7 ], [ 2, 5, 8 ],
    [ 0, 4, 8 ], [ 2, 4, 6 ]
]
```

This is because, within the way that the Noughts and Crosses library code is designed, this is configuration data rather than code itself. Configuration data ought to be tested, of course, but this would usually be done at a higher level than unit tests, which is the focus of TDD. ***NOTE COMMENTS (AND IN OTHER AREAS TOO)***

If we were to create [the main script](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/a82bb4c533e13c7050a7207f0a5d4a2568f9d043) again, then we ought to have developed the main loop in TDD fashion.

***COMMENT 1: Mark:
I'm not sure that I agree that unit tests are the focus of TDD and we were probably remiss in our lack of higher-level tests during the exercise.***

***COMMENT 2: Mat:
Interesting. I (with limited experience) feel that TDD is like unit tests and BDD like integration tests, but they're all really different sides of the same coin. We should probably mention this to some degree, and I wonder if we should go back at some point and add some end-to-end tests, but do that as a new post later?***

***COMMENT 3: Mark:
I'm not sure it's the popular view but I like to thing of TDD as the umbrella term for all *DDs, i.e. BDD is a type of TDD. It would be interesting to try another iteration where we started with some end-to-end tests to tell us when we are done(tm).***

***COMMENT 4: Mark:
By doing thin e2e tests, one at a time, we would get this idea of thin full stack feature development.***

Next Time
---------

???
