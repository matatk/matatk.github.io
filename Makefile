.PHONY: test

test:
	-eclint check
	-eslint .
	-stylelint **/*.css
	-bundle exec jekyll build
