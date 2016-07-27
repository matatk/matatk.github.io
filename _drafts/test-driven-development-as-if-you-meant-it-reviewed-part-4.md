---
title: Test-driven Development As If You Meant It Reviewed&mdash;Interesting Moments
layout: article
series: tddaiymi-reviewed-series
tags:
 - programming
 - tdd
extra-style: syntax
---

This is the fourth in a short series of articles about Test Driven Development.

{% include series.html %}

This article was written with and is [also published by](http://markwithall.com/programming/2016/07/xx/test-driven-development-as-if-you-meant-it-reviewed-part-iv.html) Mark Withall.

This article was written with and is [also published by](http://matatk.agrip.org.uk/articles/test-driven-development-as-if-you-meant-it-reviewed-part-4/) Matthew Atkinson.

We’ve taken a detailed look, in the previous part, at how to get started with TDDAIYMI, in this part we will jump around a bit more and look at several of the interesting moments that came about during the exercise.

Communicating Classes
---------------------

Our first concern was how to introduce classes when this became necessary--because the tests must be made to pass within the test method, we thought this would be tricky. However we realised that, when we want to split out an inner class to clean up an existing class, this can easily be achieved in the refactoring stage. [The `ResultChecker` class was extracted](https://github.com/matatk/NoughtsAndCrosses/commit/7a8486584e5d073d84f5fe2e301a9b8fd78b75bd) from the existing code as part of the refactoring, in line with rule 4.1 of [TDDAIYMI](https://cumulative-hypotheses.org/2011/08/30/tdd-as-if-you-meant-it/):

> You want a new class—wait until refactoring time, then… create non-test classes to provide a destination for a Move Method and for no other reason (populate implementation classes with methods by doing Move Method, and no other way)

Extraction of the `ResultChecker` class:

```diff
diff --git a/nac.py b/nac.py
index 56222aa..d6bee00 100644
--- a/nac.py
+++ b/nac.py
@@ -1,27 +1,27 @@
 def test_move_is_legal_if_not_already_played():
-	nac = NoughtsAndCrosses()
+	nac = NoughtsAndCrosses(ResultChecker())
 	assert nac.is_legal(0) is True

 def test_move_is_not_legal_if_already_played():
-	nac = NoughtsAndCrosses()
+	nac = NoughtsAndCrosses(ResultChecker())
 	nac.moves_played_so_far = [0]
 	assert nac.is_legal(0) is False

 def test_move_is_not_legal_if_below_lower_bound():
-	nac = NoughtsAndCrosses()
+	nac = NoughtsAndCrosses(ResultChecker())
 	assert nac.is_legal(-1) is False

 def test_move_is_not_legal_if_above_upper_bound():
-	nac = NoughtsAndCrosses()
+	nac = NoughtsAndCrosses(ResultChecker())
 	assert nac.is_legal(9) is False

 def test_draw():
-	nac = NoughtsAndCrosses()
+	nac = NoughtsAndCrosses(ResultChecker())
 	nac.moves_played_so_far = [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ]
 	assert nac.is_draw() is True

 def test_not_draw():
-	nac = NoughtsAndCrosses()
+	nac = NoughtsAndCrosses(ResultChecker())
 	nac.moves_played_so_far = [ 0, 1, 2, 3, 4, 5, 6, 7 ]
 	assert nac.is_draw() is False

@@ -50,15 +50,16 @@ def test_bottom_left_diagonal_filled_player_one_is_win():
 	_is_win_for_player_one([ 2, 7, 4, 8, 6 ])

 def _is_win_for_player_one(moves_played_so_far):
-    nac = NoughtsAndCrosses()
+    nac = NoughtsAndCrosses(ResultChecker())
     nac.moves_played_so_far = moves_played_so_far
     assert nac.is_win_for_player_one() is True


 class NoughtsAndCrosses:
-	def __init__(self):
+	def __init__(self, result_checker):
 		self.moves_played_so_far = []
 		self.max_number_of_moves = 9
+		self.result_checker = result_checker

 	def is_legal(self, move):
 		move_within_bounds = move > -1 and move < self.max_number_of_moves
@@ -69,12 +70,13 @@ def is_draw(self):
 		return len(self.moves_played_so_far) is self.max_number_of_moves

 	def is_win_for_player_one(self):
-		return self._is_win(self._player_one_moves())
+		return self.result_checker.is_win(self._player_one_moves())

 	def _player_one_moves(self):
 		return set(self.moves_played_so_far[0::2])

-	def _is_win(self, moves):
+class ResultChecker:
+	def is_win(self, moves):
 		top_row = set([0, 1, 2])
 		middle_row = set([3, 4, 5])
 		bottom_row = set([6, 7, 8])
```

What about when the need for a class comes up that does something different to an existing class, so can’t simply be extracted from it? In commit ***FIXME*** we stopped because we saw no immediate way to introduce further classes that we believed were required, the reason being that we could not think a TDDAIYMI-compliant means to introduce the communication between classes. When we know we want to adopt an MVC design, how do we use TDDAIYMI to help us wire up the Model and View, via the Controller? They have to be able to communicate.

Fortunately the answer to this one is straightforward, too. Imagine that we have already separately developed the View and Model, and wish to write the Controller (this seems like a sufficiently bottom-up way of doing things, which we feel fits TDDAIYMI). In this case, we can write the tests for the wiring between the Model and View, making them pass within the test methods, as stipulated by the rules. It is fine for us to use the existing Model and View objects in the test methods, as they are already part of the established, tested, codebase. We will then start to be able to extract methods (as per rule 4.1).

> You want a new method—wait until refactoring time, then… create new (non-test) methods by doing one of these, and in no other way:
>
> - preferred: do Extract Method on implementation code created as per (3) to create a new method in the test class, or
> - if you must: move implementation code as per (3) into an existing implementation method

Ultimately, we will arrive at a point where a lot of related methods will be ripe for refactoring into a class (as per rule 4.2 above).

Rookie Mistakes
---------------

One common error that we made during the exercise was to do a large refactoring in a single step. For example, in [94daea6](https://github.com/matatk/NoughtsAndCrosses/commit/94daea6de4c96c7d085893e3f5ab701d8f11b779) (below) we jumped straight to the extraction of a method for `is_legal()` without going through an intermediate step of refactoring the code to look the same in both cases. This would have left us a trivial extract-method refactoring. By doing the whole refactoring in a single step we run the risk of introducing errors, or at the very least having to go back and redo the refactoring when we get it wrong.

```diff
diff --git a/nac.py b/nac.py
index a588486..f24eab8 100644
--- a/nac.py
+++ b/nac.py
@@ -1,8 +1,9 @@
 def test_legal_move():
-    last_move_was_legal = True
-    assert last_move_was_legal
+    assert is_legal(1)

 def test_move_bounds_lower():
-    move = -1
-    last_move_was_legal = move > 0
-    assert last_move_was_legal is False
+    assert is_legal(-1) is False
+
+
+def is_legal(move):
+    return move > 0
```

The same is sometimes true when making a test pass. For example, in [29120f5](https://github.com/matatk/NoughtsAndCrosses/commit/29120f5a4ac5a8ebe732c29dbfa1813df7dc0689) (below) the test has carelessly been made to pass outside of the test itself. In this case, we should have first added the extension `and move < 9` to the `is_legal()` call and then used a refactoring to move the code into the production code.

```diff
diff --git a/nac.py b/nac.py
index ab6cfcb..ed94fe3 100644
--- a/nac.py
+++ b/nac.py
@@ -12,4 +12,4 @@ def test_move_bounds_upper():


 def is_legal(move):
-    return move >= 0
+    return move >= 0 and move < 9
```

We use the correct approach in [5612782](https://github.com/matatk/NoughtsAndCrosses/commit/561278216c74d576f9c6e672997bae9c311d77c7) later:

```diff
diff --git a/nac.py b/nac.py
index 84b3cc7..9109cfd 100644
--- a/nac.py
+++ b/nac.py
@@ -12,7 +12,7 @@ def test_more_than_complete_top_row_is_win():

 def test_complete_middle_row_is_win():
     moves = [3, 4, 5]
-    assert is_win(moves) is True
+    assert (is_win(moves) or moves == [3, 4, 5]) is True


 def is_win(moves):
```

Rule Violations
---------------

One of the most common violations of ‘the rules’ of TDD was to modify the behaviour of code during a ‘refactoring’. This most commonly took the form of moving behaviour into existing methods.

For example, starting from the <span style="color: green;">GREEN</span> state:

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False

def test_different_legal_move_is_legal():
    move = 1
    assert (is_legal(move) or move > 0) is True

def is_legal(move):
    return move == 0
```

we move directly to the following, in a single 'refactoring':

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False

def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True

def is_legal(move):
    return move == 0 or move > 0
```

What would have been the correct way of going about this change? One possible approach would be to make all of the uses of the method look the same first. Then extract a new method and inline the old one.

This would look something like the following.  Start from the same <span style="color: green;">GREEN</span> state as above:

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False

def test_different_legal_move_is_legal():
    move = 1
    assert (is_legal(move) or move > 0) is True

def is_legal(move):
    return move == 0
```

we start by changing the assertion in `test_illegal_move_is_not_legal()` to match the form of that in `test_different_legal_move_is_legal()`:

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert (is_legal(move) or move > 0) is False

def test_different_legal_move_is_legal():
    move = 1
    assert (is_legal(move) or move > 0) is True

def is_legal(move):
    return move == 0
```

The assertion for `test_illegal_move_is_not_legal()` is clearly still valid.

We then refactor, step-by-step, staring by renaming the original `is_legal()` function:

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert (original_is_legal(move) or move > 0) is False

def test_different_legal_move_is_legal():
    move = 1
    assert (original_is_legal(move) or move > 0) is True

def original_is_legal(move):
    return move == 0
```

then extracting a new `is_legal()` function from the two tests:

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False

def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True

def is_legal(move):
    return original_is_legal(move) or move > 0

def original_is_legal(move):
    return move == 0
```

and finally, inlining the `original_is_legal()` function:

```python
def test_illegal_move_is_not_legal():
    move = -1
    assert is_legal(move) is False

def test_different_legal_move_is_legal():
    move = 1
    assert is_legal(move) is True

def is_legal(move):
    return move == 0 or move > 0
```

The result is the same as the single-step refactoring.

Another instance where we were a bit aggressive in the refactoring step was in [b873939](https://github.com/matatk/NoughtsAndCrosses/commit/b873939af49e97ec69eed930013de18e818affd0) (below) where we introduced use of sets and the `any` function (which is nice and neat, but does alter the behaviour somewhat).

```diff
diff --git a/nac.py b/nac.py
index c0c00ce..5079bd3 100644
--- a/nac.py
+++ b/nac.py
@@ -17,5 +17,7 @@ def test_complete_middle_row_is_win():

 def is_win(moves):
     top_row = set([0, 1, 2])
-    return set(moves).issuperset(top_row) \
-            or moves == [3, 4, 5]
+    middle_row = set([3, 4, 5])
+    wins = [top_row,
+            middle_row]
+    return any(set(moves).issuperset(win) for win in wins)
```

Data vs Code
------------

The approach we took to determining whether a position was a win in early attempts took the form of gradually building up example cases of win/not-win conditions and adding to the code that evaluated the position to pass the tests. This often got us into a very repetitive rut with the TDD process, where not much was added to the code, but we couldn’t seem to get off that path, as can be seen below.

Start of this run of commits [63c0795](https://github.com/matatk/NoughtsAndCrosses/commit/63c0795942088d391cd39bf0d3d64c37b433eee3):

```diff
diff --git a/nac.py b/nac.py
index a444c5e..b0a2ddd 100644
--- a/nac.py
+++ b/nac.py
@@ -25,6 +25,11 @@ def test_not_draw():
 	nac.moves_played_so_far = [ 0, 1, 2, 3, 4, 5, 6, 7 ]
 	assert nac.is_draw() is False

+def test_top_row_filled_is_win():
+	nac = NaughtsAndCrosses()
+	nac.moves_played_so_far = [ 0, 7, 1, 8, 2 ]
+	assert not set([0, 1, 2]).issubset(set(nac.moves_played_so_far[0::2]))
+

 class NaughtsAndCrosses:
 	def __init__(self):
```

The end of this run of commits [bce901b](https://github.com/matatk/NoughtsAndCrosses/commit/bce901b44f23403e722977e3decfd785833aa960):

```diff
diff --git a/nac.py b/nac.py
index 21c4da1..c54fa7c 100644
--- a/nac.py
+++ b/nac.py
@@ -78,17 +78,14 @@ def is_win_for_player_one(self):
 		top_left_diagonal = set([0, 4, 8])
 		bottom_left_diagonal = set([2, 4, 6])
 		moves = self._player_one_moves()
-		return self._is_win_for_player_one(top_row, moves) \
-			or self._is_win_for_player_one(middle_row, moves) \
-			or self._is_win_for_player_one(bottom_row, moves) \
-			or self._is_win_for_player_one(first_column, moves) \
-			or self._is_win_for_player_one(second_column, moves) \
-			or self._is_win_for_player_one(third_column, moves) \
-			or self._is_win_for_player_one(top_left_diagonal, moves) \
-			or self._is_win_for_player_one(bottom_left_diagonal, moves)
-
-	def _is_win_for_player_one(self, pattern, moves):
-		return pattern.issubset(moves)
+		return top_row.issubset(moves) \
+			or middle_row.issubset(moves) \
+			or bottom_row.issubset(moves) \
+			or first_column.issubset(moves) \
+			or second_column.issubset(moves) \
+			or third_column.issubset(moves) \
+			or top_left_diagonal.issubset(moves) \
+			or bottom_left_diagonal.issubset(moves)

 	def _player_one_moves(self):
 		return set(self.moves_played_so_far[0::2])
```

*You can explore the whole run of commits using the [GitHub Desktop app](https://desktop.github.com), or by visiting the page for [bce901b](https://github.com/matatk/NoughtsAndCrosses/commit/bce901b44f23403e722977e3decfd785833aa960) and following the "parent" link (it will take you backwards through the commits, but still demonstrates the repetitive and fairly content-free nature of the endeavour).*


In later attempts, for example attempt 006 (***FIXME*** link), we moved to an approach of having a the list of winning conditions as data, and wrote tests to drive a solution that looked to see if the win condition was contained in the list of winning conditions.

The later approach ends up with a much simpler and more flexible result, which would allow us to change the size of the board almost trivially. This level of flexibility could have been achieved in the algorithmic position evaluation too but would have required many more tests to get to that stage.

Next Time
---------

Next time we will look at a more traditional TDD approach (in a London/Mockist style--as we’re British) to this exercise and see how it compares and contrasts to the TDDAIYMI style of development.
