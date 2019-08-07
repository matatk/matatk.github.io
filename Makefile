.PHONY: test

test:
	-eclint check
	-eslint .
	-stylelint **/*.css
