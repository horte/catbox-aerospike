test:
	@node node_modules/lab/bin/lab -l
test-cov:
	@node node_modules/lab/bin/lab -l -t 100
test-cov-html:
	@node node_modules/lab/bin/lab -l -r html -o coverage.html

.PHONY: test test-cov test-cov-html
