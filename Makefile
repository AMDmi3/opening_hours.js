## Variables {{{
SHELL  ?= /bin/sh
NODE   ?= nodejs
SEARCH ?= opening_hours

WGET_OPTIONS ?= --no-verbose
## }}}

.PHONY: default
default: check

.PHONY: dependencies-get
dependencies-get:
	npm install

.PHONY: build
build: opening_hours.min.js

.PHONY: check
check: check-diff-all check-package.json

.PHONY: benchmark
benchmark: benchmark-opening_hours.js

README.html: README.md

.PHONY: release
release: check
	git status
	read continue
	editor package.json
	git commit --all --message="Released version `json -f package.json version`."
	git tag --sign --local-user=EE88E1F0 "v`json -f package.json version`"
	git push --follow-tags
	npm publish
	$(MAKE) publish-website-on-all-servers

.PHONY: clean
clean: osm-tag-data-rm
	rm -f *.min.js
	rm -f README.html
	rm -f taginfo_sources.json

## Publish {{{

.PHONY: publish-website-on-all-servers
publish-website-on-all-servers: publish-website-on-ypid.de publish-website-on-openingh.openstreetmap.de

.PHONY: publish-website-on-openingh.openstreetmap.de
publish-website-on-openingh.openstreetmap.de:
	ssh gauss.osm.de './update'

.PHONY: publish-website-on-ypid.de
publish-website-on-ypid.de:
	ssh osm@ypid.de './update'

## }}}

## command line programs {{{
.PHONY: run-regex_search
run-regex_search: export.$(SEARCH).json interactive_testing.js regex_search.py
	$(NODE) ./regex_search.py "$<"

.PHONY: run-interactive_testing
run-interactive_testing: interactive_testing.js
	$(NODE) "$<"
## }}}

## software testing {{{

.PHONY: check-all
check-all: check-package.json check-test check-diff-all osm-tag-data-update-check

.PHONY: check-diff-all
check-diff-all: check-diff check-diff-opening_hours.min.js

.PHONY: check-diff
check-diff: check-diff-opening_hours.js

.PHONY: check-test
check-test: check-opening_hours.js

# .PHONY: check-opening_hours.js check-opening_hours.min.js
## Does not work
check-opening_hours.js:
check-opening_hours.min.js:

check-%.js: %.js test.js
	-$(NODE) test.js "./$<"

check-diff-opening_hours.js:
check-diff-opening_hours.min.js:

.SILENT: check-diff-opening_hours.js check-diff-opening_hours.min.js
check-diff-%.js: %.js test.js
	git checkout HEAD -- test.log
	# git checkout master -- test.log
	# git checkout 9f323b9d06720b6efffc7420023e746ff8f1b309 -- test.log
	$(NODE) test.js 1> test.log 2>&1 || echo "Test results for $< are exactly the same as on developemt system. So far, so good ;)"
	# git --no-pager diff --color-words test.log
	git --no-pager diff test.log

.PHONY: osm-tag-data-check
osm-tag-data-check: real_test.js opening_hours.js osm-tag-data-get-all
	$(NODE) "$<"

.PHONY: osm-tag-data-update-check
.SILENT : osm-tag-data-update-check
osm-tag-data-update-check:
	-$(MAKE) --quiet osm-tag-data-update-all 2>/dev/null
	$(MAKE) --quiet osm-tag-data-check

# .PHONY: benchmark
benchmark-%.js: %.js benchmark.js
	$(NODE) ./benchmark.js "$<"

.PHONY: check-package.json
check-package.json: package.json
	pjv --warnings --recommendations --filename "$<"

## }}}

## OSM data from taginfo {{{

## See real_test.js
.PHONY: osm-tag-data-gen-stats
osm-tag-data-gen-stats: real_test.opening_hours.stats.csv osm-tag-data-update-check

.PHONY: osm-tag-data-rm
osm-tag-data-rm:
	rm -f export.*.json

.PHONY: osm-tag-data-update-all
osm-tag-data-update-all:
	$(NODE) ./check_for_new_taginfo_data.js
	$(MAKE) osm-tag-data-rm
	$(MAKE) osm-tag-data-get-all

.PHONY: osm-tag-data-get-all
osm-tag-data-get-all: export.opening_hours.json export.lit.json export.opening_hours\:kitchen.json export.opening_hours\:warm_kitchen.json export.smoking_hours.json export.collection_times.json export.service_times.json export.fee.json export.happy_hours.json export.delivery_hours.json export.opening_hours\:delivery.json

export.%.json:
	wget $(WGET_OPTIONS) --output-document="$(shell echo "$@" | sed 's/\\//g' )" "http://taginfo.openstreetmap.org/api/4/key/values?key=$(shell echo "$@" | sed 's/^export\.\(.*\)\.json/\1/;s/\\//g' )" 2>&1
## }}}

%.min.js: %.js
	uglifyjs "$<" --output "$@" --comments '/ypid\/opening_hours\.js/' --lint

%.html: %.md
	pandoc --from markdown_github --to html --standalone "$<" --output "$@"
