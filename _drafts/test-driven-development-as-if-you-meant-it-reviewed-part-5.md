---
title: Test-driven Development As If You Meant It Reviewed&mdash;'Normal' TDD
layout: article
series: tddaiymi-reviewed-series
tags:
 - programming
 - tdd
extra-style: syntax
---

{% include series.html %}

This article was written with and is [also published by](http://markwithall.com/programming/2017/05/17/test-driven-development-as-if-you-meant-it-reviewed-part-v.html) Mark Withall.

We've had a thorough look at TDDAIYMI over the last few parts of this series. Now we're going to look at how the task might have been completed using 'normal' TDD.

Being British, we're using a top-down approach that starts with the controller and works out to the model and view implementations; rather than the more traditional bottom up approach, which is more akin to TDDAIYMI.

We'll start off in this part by looking, step-by-step, at each of the initial commits of the <span style="color: red;">RED</span>-<span
style="color: green;">GREEN</span>-<span style="color: blue;">REFACTOR</span> cycle.

The Starting Commits
--------------------

As with all TDD, we start off by writing a failing test. We're starting with the controller, as that seems to be the most logical place to start; it'll tell us what we need from the model and from the view.

Our first test is that the controller calls the `is_legal()` check on our model. However, we have a failing test at the point we try and construct the controller.

### RED a controller is created - 2014-08-13 14:07
{: style="color: red" }

```python
def test_play_move_calls_is_legal():
    controller = NoughtsAndCrossesController()
```

To get back to green, it is a simple process of creating a controller class.

### GREEN - 2014-08-13 14:08
{: style="color: green" }

```python
def test_play_move_calls_is_legal():
    controller = NoughtsAndCrossesController()

class NoughtsAndCrossesController:
    pass
```

After we'd passed the test, we decided we didn't like the test name, so we made it more specific to what we actually wanted to test.

### REFACTOR better test name - 2014-08-13 14:10
{: style="color: blue" }

```python
def test_playing_legal_move_updates_view():
    controller = NoughtsAndCrossesController()

class NoughtsAndCrossesController:
    pass
```

Now we are green again, we continue to implement the test. Again, it fails to compile pretty quickly.

### RED play_move - 2014-08-13 14:12
{: style="color: red" }

```python
def test_playing_legal_move_updates_view():
    controller = NoughtsAndCrossesController()
    controller.play_move(0)

class NoughtsAndCrossesController:
    pass
```

This time, we make the test pass by adding a method to our controller class.

### GREEN - 2014-08-13 14:12
{: style="color: green" }

```python
def test_playing_legal_move_updates_view():
    controller = NoughtsAndCrossesController()
    controller.play_move(0)

class NoughtsAndCrossesController:
    def play_move(self, move):
        pass
```

There's nothing to refactor this time, as we've not really done anything. Therefore, we continue to write our test by making an assertion about a fake view's `add_move()` getting called with `0`.

### RED test view is called - 2014-08-13 14:15
{: style="color: red" }

```python
import mock

def test_playing_legal_move_updates_view():
    fake_view = mock.Mock()
    controller = NoughtsAndCrossesController()
    controller.play_move(0)
    fake_view.add_move.assert_called_with(0)

class NoughtsAndCrossesController:
    def play_move(self, move):
        pass
```

Making the test pass is a bit more involved this time. We have to inject the view into our controller and actually call the `add_move()` method from the controller.

### GREEN - 2014-08-13 14:17
{: style="color: green" }

```python
import mock

def test_playing_legal_move_updates_view():
    fake_view = mock.Mock()
    controller = NoughtsAndCrossesController(fake_view)
    controller.play_move(0)
    fake_view.add_move.assert_called_with(0)

class NoughtsAndCrossesController:
    def __init__(self, view):
        self.view = view

    def play_move(self, move):
        self.view.add_move(move)
```

Again, there is nothing that we can see that's worth refactoring at this stage.

We can now move on to our second test. We want to check that playing an illegal move does not add a move to our view (Ed: probably a bad name for the test here, as we may want to update the view by informing the user they've played an illegal move).

This initially fails as we aren't accepting a model into our controller's constructor.

### RED added model to controller - 2014-08-13 14:21
{: style="color: red" }

```python
import mock

def test_playing_legal_move_updates_view():
    fake_view = mock.Mock()
    controller = NoughtsAndCrossesController(fake_view)
    controller.play_move(0)
    fake_view.add_move.assert_called_with(0)

def test_playing_illegal_move_does_not_update_view():
    fake_view = mock.Mock()
    fake_model = mock.Mock()
    fake_model.is_legal.return_value = False
    controller = NoughtsAndCrossesController(fake_model, fake_view)

class NoughtsAndCrossesController:
    def __init__(self, view):
        self.view = view

    def play_move(self, move):
        self.view.add_move(move)
```

Passing is easy. We add a constructor parameter (and also update our other test).

### GREEN - 2014-08-13 14:22
{: style="color: green" }

```python
import mock

def test_playing_legal_move_updates_view():
    fake_view = mock.Mock()
    controller = NoughtsAndCrossesController(None, fake_view)
    controller.play_move(0)
    fake_view.add_move.assert_called_with(0)

def test_playing_illegal_move_does_not_update_view():
    fake_view = mock.Mock()
    fake_model = mock.Mock()
    fake_model.is_legal.return_value = False
    controller = NoughtsAndCrossesController(fake_model, fake_view)

class NoughtsAndCrossesController:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def play_move(self, move):
        self.view.add_move(move)
```

We can then make the test fail again by calling the `play_move()` method on the controller.

### RED check illegal move does not update view - 2014-08-13 14:27
{: style="color: red" }

```python
import mock

def test_playing_legal_move_updates_view():
    fake_view = mock.Mock()
    controller = NoughtsAndCrossesController(None, fake_view)
    controller.play_move(0)
    fake_view.add_move.assert_called_with(0)

def test_playing_illegal_move_does_not_update_view():
    fake_view = mock.Mock()
    fake_model = mock.Mock()
    fake_model.is_legal.return_value = False
    controller = NoughtsAndCrossesController(fake_model, fake_view)
    controller.play_move(42)
    assert not fake_view.add_move.called

class NoughtsAndCrossesController:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def play_move(self, move):
        self.view.add_move(move)
```

Making the test pass is a simple case (as it should be) of checking that it is legal by calling the model's `is_legal()` method (which we've already mocked). Note that we also need to update our first test by passing a model.

### GREEN - 2014-08-13 14:28
{: style="color: green" }

```python
import mock

def test_playing_legal_move_updates_view():
    fake_view = mock.Mock()
    fake_model = mock.Mock()
    controller = NoughtsAndCrossesController(fake_model, fake_view)
    controller.play_move(0)
    fake_view.add_move.assert_called_with(0)

def test_playing_illegal_move_does_not_update_view():
    fake_view = mock.Mock()
    fake_model = mock.Mock()
    fake_model.is_legal.return_value = False
    controller = NoughtsAndCrossesController(fake_model, fake_view)
    controller.play_move(42)
    assert not fake_view.add_move.called

class NoughtsAndCrossesController:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def play_move(self, move):
        if self.model.is_legal(move):
            self.view.add_move(move)
```

We can see that we've introduced quite a bit of duplication in these two tests, so we need to refactor. Most of the duplication can be removed by introducing a setup method to create our mocks and controller.

### REFACTOR use a test class - 2014-09-23 12:48
{: style="color: blue" }

```python
import mock

class TestNoughtsAndCrosses():
    def setup_method(self, method):
        self.fake_view = mock.Mock()
        self.fake_model = mock.Mock()
        self.controller = NoughtsAndCrossesController(
            self.fake_model,
            self.fake_view)

    def teardown_method(self, method):
        pass

    def test_playing_legal_move_updates_view(self):
        self.controller.play_move(0)
        self.fake_view.add_move.assert_called_with(0)

    def test_playing_illegal_move_does_not_update_view(self):
        self.fake_model.is_legal.return_value = False
        self.controller.play_move(42)
        assert not self.fake_view.add_move.called

class NoughtsAndCrossesController:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def play_move(self, move):
        if self.model.is_legal(move):
            self.view.add_move(move)
```

It is now much easier to add a new test. We now check that an illegal move results in an appropriate message to the view.

### RED illegal move reports error - 2014-09-23 13:03
{: style="color: red" }

```python
import mock

class TestNoughtsAndCrosses():
    def setup_method(self, method):
        self.fake_view = mock.Mock()
        self.fake_model = mock.Mock()
        self.controller = NoughtsAndCrossesController(
            self.fake_model,
            self.fake_view)

    def teardown_method(self, method):
        pass

    def test_playing_legal_move_updates_view(self):
        self.controller.play_move(0)
        self.fake_view.add_move.assert_called_with(0)

    def test_playing_illegal_move_does_not_update_view(self):
        self.fake_model.is_legal.return_value = False
        self.controller.play_move(42)
        assert not self.fake_view.add_move.called

    def test_playing_illegal_move_reports_error_in_view(self):
        self.fake_model.is_legal.return_value = False
        self.controller.play_move(-1)
        self.fake_view.report_error.assert_called_with('Illegal move')


class NoughtsAndCrossesController:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def play_move(self, move):
        if self.model.is_legal(move):
            self.view.add_move(move)
```

Passing the test is straightforward.

### GREEN - 2014-09-23 13:03
{: style="color: green" }

```python
import mock

class TestNoughtsAndCrosses():
    def setup_method(self, method):
        self.fake_view = mock.Mock()
        self.fake_model = mock.Mock()
        self.controller = NoughtsAndCrossesController(
            self.fake_model,
            self.fake_view)

    def teardown_method(self, method):
        pass

    def test_playing_legal_move_updates_view(self):
        self.controller.play_move(0)
        self.fake_view.add_move.assert_called_with(0)

    def test_playing_illegal_move_does_not_update_view(self):
        self.fake_model.is_legal.return_value = False
        self.controller.play_move(42)
        assert not self.fake_view.add_move.called

    def test_playing_illegal_move_reports_error_in_view(self):
        self.fake_model.is_legal.return_value = False
        self.controller.play_move(-1)
        self.fake_view.report_error.assert_called_with('Illegal move')


class NoughtsAndCrossesController:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def play_move(self, move):
        if self.model.is_legal(move):
            self.view.add_move(move)
        else:
            self.view.report_error('Illegal move')
```

Progress continues in the same vein until we have completed the controller. One could argue that we should really be working in thin slices of full-stack functionality but we decided that the task was simple enough to do as a single task.

Once the controller is complete, we move on to [the model](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/ea5d659b14c124bbc037e3e38c34a9d06e3db526) and then, finally, to [the view](https://github.com/BillionthMonkey/NoughtsAndCrosses/commit/8eeb7373dc4fba7b694b23ef24c071a4b8a9083d).

Next Time
---------

Next time we'll look at the transitions to implementing the model and the view and some of the other interesting moments from the 'Normal' TDD.
