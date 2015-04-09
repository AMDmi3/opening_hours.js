## Variables {{{
SHELL  ?= /bin/sh
NODE   ?= nodejs
SEARCH ?= opening_hours
TMP_QUERY ?= ./tmp_query.op

START_DATE ?= now

API_URL_TAGINFO  ?= http://taginfo.openstreetmap.org/api
API_URL_OVERPASS ?= http://overpass-api.de/api

WGET_OPTIONS ?= --no-verbose
## }}}

.PHONY: default
default: list

## help {{{
.PHONY: list
# http://stackoverflow.com/a/26339924/2239985
list:
	@echo "This Makefile has the following targets:"
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | sed 's/^/    /'
## }}}

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
	git tag --sign --local-user=C505B5C93B0DB3D338A1B6005FE92C12EE88E1F0 "v`json -f package.json version`"
	git push --follow-tags
	npm publish
	$(MAKE) publish-website-on-all-servers

.PHONY: clean
clean: osm-tag-data-rm
	rm -f *.min.js
	rm -f README.html
	rm -f taginfo_sources.json

.PHONY: osm-tag-data-rm
osm-tag-data-rm: osm-tag-data-taginfo-rm osm-tag-data-overpass-rm

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

.PHONY: osm-tag-data-taginfo-rm
osm-tag-data-taginfo-rm:
	rm -f export.*.json

.PHONY: osm-tag-data-update-all
osm-tag-data-update-all: taginfo_sources.json osm-tag-data-taginfo-rm osm-tag-data-get-all

## Always refresh
.PHONY: taginfo_sources.json
taginfo_sources.json:
	$(NODE) ./check_for_new_taginfo_data.js

.PHONY: osm-tag-data-get-all
osm-tag-data-get-all: related_tags.list
	@grep -v '^#' "$<" | while read location; do \
		$(MAKE) --no-print-directory "export.$$location.json"; \
	done

export.%.json:
	wget $(WGET_OPTIONS) --output-document="$(shell echo "$@" | sed 's/\\//g' )" "$(API_URL_TAGINFO)/4/key/values?key=$(shell echo "$@" | sed 's/^export\.\(.*\)\.json/\1/;s/\\//g' )" 2>&1
## }}}

## OSM data from the overpass API {{{

## The value separator is ♡ because it is not expected that this appears anywhere else in the tags and it works with GNU make.
## Unfortunately, it does not work with cut, but that problem can be solved.

# Used for testing:
export♡name♡Erlangen.json:
export♡name♡Leutershausen.json:

# export♡name♡Leutershausen♡2015-04-09T00:00:00Z.json:
## Can be used to import data from a specific date.

## FIXME: Check if overpass API is faster with regex key search.

## Generate OverpassQL and execute it.
export♡%.json: real_test.js related_tags.list
	@(timestamp="$(shell echo "$@" | sed 's/♡/\x0/g;s/\.json$$//;' | cut -d '' -f 4)"; \
		if [ -z "$$timestamp" ]; then \
			timestamp="$(shell date '+%F')T00:00:00Z"; \
		else \
			echo "[date:\"$$timestamp\"]"; \
		fi; \
		boundary_key="$(shell echo "$@" | sed 's/♡/\x0/g;s/\.json$$//;' | cut -d '' -f 2)"; \
		boundary_value="$(shell echo "$@" | sed 's/♡/\x0/g;s/\.json$$//;' | cut -d '' -f 3)"; \
		echo "[out:json][timeout:900];"; \
		echo "area[\"type\"=\"boundary\"][\"$$boundary_key\"=\"$$boundary_value\"];"; \
		echo 'foreach('; \
		grep -v '^#' related_tags.list | while read key; do \
			for type in node way; do \
				echo "    $$type(area)[\"$$key\"]->.t; .t out tags;"; \
			done; \
		done; \
		echo ");" ) > "$(TMP_QUERY)"
	@echo "Executing queriy:"
	@cat "$(TMP_QUERY)" | sed 's/^/    /;'
	wget $(WGET_OPTIONS) --post-file="$(TMP_QUERY)" --output-document="$(shell echo "$@" | sed 's/\\//g' )" "$(API_URL_OVERPASS)/interpreter" 2>&1
	$(NODE) "$<" "$(shell echo "$@" | sed 's/\\//g' )"

.PHONY: osm-tag-data-overpass-rm
osm-tag-data-overpass-rm:
	rm -f export♡*.json

## }}}

## Generate statistics  {{{

## See real_test.js
.PHONY: osm-tag-data-gen-stats
osm-tag-data-gen-stats: real_test.opening_hours.stats.csv osm-tag-data-update-check osm-tag-data-check

.PHONY: osm-tag-data-gen-stats-overpass-daily
osm-tag-data-gen-stats-overpass-daily: stats_for_boundaries.list
	@grep -v '^#' "$<" | while read location; do \
		$(MAKE) export♡$$location♡$(shell date '+%F')T00:00:00Z.json; \
	done

.PHONY: osm-tag-data-gen-stats-overpass-hourly
osm-tag-data-gen-stats-overpass-hourly: stats_for_boundaries.list
	@grep -v '^#' "$<" | while read location; do \
		$(MAKE) export♡$$location♡$(shell date '+%FT%H'):00:00Z.json; \
	done

.PHONY: osm-tag-data-gen-stats-overpass-n-days-back
osm-tag-data-gen-stats-overpass-n-days-back: stats_for_boundaries.list
	@if [ -z "$(DAYS_BACK)" ]; then \
		echo "The DAYS_BACK parameter is empty!"; \
		exit 1; \
	fi; \
	grep -v '^#' "$<" | while read location; do \
		for d in `seq $(DAYS_BACK)`; do \
			$(MAKE) export♡$$location♡$(shell date -d "$(START_DATE) - $$d days "'+%FT%H'):00:00Z.json; \
		done; \
	done

## }}}

%.min.js: %.js
	uglifyjs "$<" --output "$@" --comments '/ypid\/opening_hours\.js/' --lint

%.html: %.md
	pandoc --from markdown_github --to html --standalone "$<" --output "$@"
