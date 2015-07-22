## Variables {{{
SHELL   := /bin/bash
NODE    ?= nodejs
SEARCH  ?= opening_hours
VERBOSE ?= 1

## Data source variables {{{
OH_RELATED_TAGS ?= related_tags.txt
STATS_FOR_BOUNDARIES ?= stats_for_boundaries.txt

API_URL_TAGINFO  ?= http://taginfo.openstreetmap.org/api
API_URL_OVERPASS ?= http://overpass-api.de/api

TMP_QUERY ?= ./tmp_query.op
OVERPASS_QUERY_KEY_FILTER_CMD ?= cat
OVERPASS_QUERY_TIMEOUT ?= 4000
# OVERPASS_QUERY_TIMEOUT ?= 1000
OVERPASS_QUERY_STOP_AFTER_TIME_HOUR ?= 11
# OVERPASS_QUERY_STOP_AFTER_TIME_HOUR ?= -1
## Stop the make process gracefully after 14:00. Intended for cron which start at night.
OVERPASS_QUERY_USE_REGEX ?= 0
# Using regular expressions for querying areas is still slow
# https://github.com/drolbr/Overpass-API/issues/59#issuecomment-54013988
# Benchmarks:
# 7:54.68: make WGET_OPTIONS='' export♡ISO3166-2♡DE-SL♡2015-04-09T00:00:00.json -B OVERPASS_QUERY_USE_REGEX=1
# 0:35.04: make WGET_OPTIONS='' export♡ISO3166-2♡DE-SL♡2015-04-09T00:00:00.json -B OVERPASS_QUERY_USE_REGEX=0
# The query without regular expressions also returns more results …
# Use the log feature of real_test.js for this.

REMOVE_DATA_AFTER_STATS_GEN ?= 1
# REMOVE_DATA_AFTER_STATS_GEN ?= 0
START_DATE ?= now
# START_DATE ?= now - 1 day
DAYS_INCREMENT ?= 1
HOURS_INCREMENT ?= 1
## }}}

WGET_OPTIONS ?= --no-verbose
MAKE_OPTIONS ?= --no-print-directory
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
benchmark: benchmark-opening_hours.min.js

README.html: README.md

.PHONY: release
release: check source-code-qa
	git status
	read continue
	editor package.json
	$(MAKE) $(MAKE_OPTIONS) check-package.json
	git commit --all --message="Released version `json -f package.json version`."
	git tag --sign --local-user=C505B5C93B0DB3D338A1B6005FE92C12EE88E1F0 "v`json -f package.json version`"
	git push --follow-tags
	npm publish
	$(MAKE) $(MAKE_OPTIONS) publish-website-on-all-servers

.PHONY: clean
clean: osm-tag-data-rm
	rm --force *.min.js
	rm --force README.html
	rm --force taginfo_sources.json

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

## Source code QA {{{
.PHONY: source-code-qa
source-code-qa:
	git ls-files | egrep '\.js$$' | xargs sed -i 's/\([^=!]\)==\([^=]\)/\1===\2/g;s/\([^=!]\)!=\([^=]\)/\1!==\2/g;'
## }}}

## software testing {{{

.PHONY: check-all
check-all: check-package.json check-test check-diff-all osm-tag-data-update-check

.PHONY: check-fast
check-fast: check-diff-en-opening_hours.js

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
	for lang in en de; do \
		$(NODE) test.js --library-file "$<" --locale $$lang 1> test.$$lang.log 2>&1; \
		git diff --quiet --exit-code HEAD -- test.$$lang.log; \
		if [ "$$?" == "0" ]; then \
			echo "Test results for $< ($$lang) are exactly the same as on developemt system. So far, so good ;)"; \
		else \
			echo "Test results for $< ($$lang) produced a different output then the output of the current HEAD. Checkout the following diff."; \
		fi; \
	done
	# git --no-pager diff --color-words test.*.log
	git --no-pager diff --exit-code test.*.log

check-diff-en-opening_hours.js:

.SILENT: check-diff-en-opening_hours.js
check-diff-en-%.js: %.js test.js
	$(NODE) test.js --library-file "$<" --locale $$lang 1> test.$$lang.log 2>&1; \
	git diff --quiet --exit-code HEAD -- test.$$lang.log; \
	if [ "$$?" == "0" ]; then \
		echo "Test results for $< ($$lang) are exactly the same as on developemt system. So far, so good ;)"; \
	else \
		echo "Test results for $< ($$lang) produced a different output then the output of the current HEAD. Checkout the following diff."; \
	fi
	git --no-pager diff --exit-code test.en.log

.PHONY: osm-tag-data-taginfo-check
osm-tag-data-taginfo-check: real_test.js opening_hours.js osm-tag-data-get-taginfo
	$(NODE) ./check_for_new_taginfo_data.js --exit-code-not-new 0
	@grep -v '^#' $(OH_RELATED_TAGS) | while read key; do \
		$(NODE) "$<" $(REAL_TEST_OPTIONS) --map-bad-oh-values --ignore-manual-values "export.$$key.json"; \
	done

.PHONY: osm-tag-data-update-check
.SILENT : osm-tag-data-update-check
osm-tag-data-update-check: osm-tag-data-update-taginfo osm-tag-data-taginfo-check

benchmark-opening_hours.js:
benchmark-opening_hours.min.js:

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
	rm --force export.*.json

.PHONY: osm-tag-data-update-taginfo
osm-tag-data-update-taginfo: taginfo_sources.json osm-tag-data-taginfo-rm osm-tag-data-get-taginfo

## Always refresh
.PHONY: taginfo_sources.json
taginfo_sources.json:
	$(NODE) ./check_for_new_taginfo_data.js

.PHONY: osm-tag-data-get-taginfo
osm-tag-data-get-taginfo: $(OH_RELATED_TAGS)
	@grep -v '^#' "$<" | while read location; do \
		$(MAKE) $(MAKE_OPTIONS) "export.$$location.json"; \
	done

# Testing:
export.happy_hours.json:
export.lit.json:

export.%.json:
	wget $(WGET_OPTIONS) --output-document="$(shell echo "$@" | sed 's/\\//g' )" "$(API_URL_TAGINFO)/4/key/values?key=$(shell echo "$@" | sed 's/^export\.\(.*\)\.json/\1/;s/\\//g' )" 2>&1
## }}}

## OSM data from the overpass API {{{
# Before running large imports check the load of the overpass API:
# * http://overpass-api.de/munin/localdomain/localhost.localdomain/load.html
# * http://overpass-api.de/munin/localdomain/localhost.localdomain/osm_db_request_count.html

## The value separator is ♡ because it is not expected that this appears anywhere else in the tags and it works with GNU make.
## Unfortunately, it does not work with cut, but that problem can be solved.

# Used for testing:
export♡ISO3166-2♡DE-SL.json:
export♡name♡Erlangen.json:
export♡name♡Leutershausen.json:

## make WGET_OPTIONS='' export♡ISO3166-2♡DE-SL♡2015-04-09T00:00:00.json -B

# export♡name♡Leutershausen♡2015-04-09T00:00:00.json:
## Can be used to import data from a specific date.

# grep --quiet "^$$timestamp"
# The grep would lead to wrong results if Z is present in the timestamp because
# the stats files contain milliseconds as well.

## Generate OverpassQL and execute it.
.PRECIOUS: export♡%.json
export♡%.json: real_test.js $(OH_RELATED_TAGS)
	@timestamp="$(shell echo "$@" | sed 's/♡/\x0/g;s/\.json$$//;' | cut -d '' -f 4)"; \
		boundary_key="$(shell echo "$@" | sed 's/♡/\x0/g;s/\.json$$//;' | cut -d '' -f 2)"; \
		boundary_value="$(shell echo "$@" | sed 's/♡/\x0/g;s/\.json$$//;' | cut -d '' -f 3)"; \
		if [ -z "$$timestamp" ]; then \
			timestamp="$(shell date '+%F')T00:00:00"; \
		fi; \
		if grep --quiet "^$$timestamp" export♡*♡$$boundary_key♡$$boundary_value♡stats.csv 2>/dev/null; then \
			if [ "$(VERBOSE)" -eq "1" ]; then \
				echo "Skipping. Timestamp ($$timestamp) already present in statistical data for $${boundary_key}=$${boundary_value}." 1>&2; \
			fi; \
		else \
			( \
			echo -n "[date:\"$$timestamp\"]"; \
			echo "[out:json][timeout:$(OVERPASS_QUERY_TIMEOUT)];"; \
			echo "area[\"type\"=\"boundary\"][\"$$boundary_key\"=\"$$boundary_value\"];"; \
			echo 'foreach('; \
			for type in node way; do \
			if [ "$(OVERPASS_QUERY_USE_REGEX)" -eq "1" ]; then \
				echo -n "    $$type(area)[~\"^("; \
				(grep -v '^#' $(OH_RELATED_TAGS) | while read key; do \
					echo -n "$$key|"; \
				done) | sed 's/|$$//;'; \
				echo ")$$\"~\".\"]->.t; .t out tags;"; \
			else \
				grep -v '^#' $(OH_RELATED_TAGS) | $(OVERPASS_QUERY_KEY_FILTER_CMD) | while read key; do \
						echo "    $$type(area)[\"$$key\"]->.t; .t out tags;"; \
				done; \
			fi; \
				done; \
			echo ");" ) > "$(TMP_QUERY)"; \
			if [ "$(VERBOSE)" -eq "1" ]; then \
				echo "Executing query:"; \
				cat "$(TMP_QUERY)" | sed 's/^/    /;'; \
			fi; \
			time wget $(WGET_OPTIONS) --post-file="$(TMP_QUERY)" --output-document="$(shell echo "$@" | sed 's/\\//g' )" "$(API_URL_OVERPASS)/interpreter" 2>&1; \
			if [ "$$?" != "0" ]; then exit 1; fi; \
			$(NODE) "$<" $(REAL_TEST_OPTIONS) --map-bad-oh-values "$(shell echo "$@" | sed 's/\\//g' )"; \
			find . -name "export♡*♡$$boundary_key♡$$boundary_value♡stats.csv" | while read file; do \
				sort --numeric-sort "$$file" > "$$file.tmp" && \
				mv "$$file.tmp" "$$file"; \
			done; \
			if [ "$(REMOVE_DATA_AFTER_STATS_GEN)" -eq "1" ]; then \
				$(MAKE) $(MAKE_OPTIONS) osm-tag-data-overpass-rm; \
			fi; \
		fi

.PHONY: osm-tag-data-overpass-rm
osm-tag-data-overpass-rm:
	rm --force export♡*.json

.PHONY: osm-tag-data-overpass-kill-queries
osm-tag-data-overpass-kill-queries:
	curl "$(API_URL_OVERPASS)/kill_my_queries"

## }}}

## OSM data via a SQL query against PostgreSQL {{{
## Thanks to walter nordmann
# select 'N'||osm_id id,
# 	  cab.localname,
# 	  poi.tags->'opening_hours' opening_hours
#  from planet_osm_point poi,
# 	  collected_admin_boundaries cab
# where poi.way && (select way from collected_admin_boundaries where id=51477)
#   and st_contains((select way from collected_admin_boundaries where id=51477),poi.way)
#   and poi.tags ? 'opening_hours'
#   and cab.admin_level = '4'
#   and cab.type='admin'
#   and st_contains(cab.way,poi.way)
# union
# select case when osm_id > 0 then 'W'||osm_id else 'R'||osm_id end id,
# 	  cab.localname,
# 	  cab.tags->'opening_hours' opening_hours
#  from planet_osm_polygon poi,
# 	  collected_admin_boundaries cab
# where poi.pointonsurface && (select way from collected_admin_boundaries where id=51477)
#   and st_contains((select way from collected_admin_boundaries where id=51477),poi.pointonsurface)
#   and poi.tags ? 'opening_hours'
#   and cab.admin_level = '4'
#   and cab.type='admin'
#   and st_contains(cab.way,poi.way)
# ;
## }}}

## Generate statistics  {{{

## Cronjob is running on gauss: http://munin.openstreetmap.de/gauss/gauss-load.html
# m h  dom mon dow   command
# 12 22    * * *       cd ./oh-stats/ && make osm-tag-data-gen-stats-cron-overpass > cron.22.log 2>&1
# 48 02    * * *       cd ./oh-stats/ && make osm-tag-data-gen-stats-cron-taginfo > cron.02.log 2>&1
# 48 06    * * *       cd ./oh-stats/ && make osm-tag-data-gen-stats-cron-taginfo > cron.06.log 2>&1
.PHONY: osm-tag-data-gen-stats-cron-taginfo
osm-tag-data-gen-stats-cron-taginfo: real_test.opening_hours.stats.csv
	date
	$(MAKE) $(MAKE_OPTIONS) 'REAL_TEST_OPTIONS=--punchcard' osm-tag-data-gen-stats > cron_taginfo.log 2>&1
	git commit --all --message 'Generated stats.'
	git push

.PHONY: osm-tag-data-gen-stats-cron-overpass
osm-tag-data-gen-stats-cron-overpass:
	date
	$(MAKE) $(MAKE_OPTIONS) osm-tag-data-gen-stats-overpass-n-days-back DAYS_BACK=120 >> cron_overpass.1.log 2>&1
	git add export♡*♡stats.csv
	date
	-git commit --all --message 'Generated stats.'
	$(MAKE) $(MAKE_OPTIONS) osm-tag-data-gen-stats-overpass-n-days-back DAYS_BACK=2400 DAYS_INCREMENT=30 START_DATE=2015-04-12 >> cron_overpass.2.log 2>&1
	git add export♡*♡stats.csv
	$(MAKE) $(MAKE_OPTIONS) osm-tag-data-gen-stats-overpass-merge
	date
	-git commit --all --message 'Generated stats.'
	$(MAKE) $(MAKE_OPTIONS) osm-tag-data-rm
	-git push

## See real_test.js
.PHONY: osm-tag-data-gen-stats
osm-tag-data-gen-stats: real_test.opening_hours.stats.csv osm-tag-data-update-check

.PHONY: osm-tag-data-gen-stats-overpass-merge
osm-tag-data-gen-stats-overpass-merge: merge_all_stats_into_country.py $(OH_RELATED_TAGS)
	@grep -v '^#' $(OH_RELATED_TAGS) | while read key; do \
		python3 "$<" --output-file "export♡$$key♡int_name♡Deutschland♡stats.csv" export♡$$key♡ISO3166-2♡DE-*♡stats.csv; \
	done

.PHONY: osm-tag-data-gen-stats-overpass-daily
osm-tag-data-gen-stats-overpass-daily: $(STATS_FOR_BOUNDARIES)
	@grep -v '^#' "$<" | while read location; do \
		$(MAKE) $(MAKE_OPTIONS) export♡$$location♡$(shell date '+%F')T00:00:00.json; \
		if [ "$$?" != "0" ]; then exit 1; fi; \
	done

.PHONY: osm-tag-data-gen-stats-overpass-hourly
osm-tag-data-gen-stats-overpass-hourly: $(STATS_FOR_BOUNDARIES)
	@grep -v '^#' "$<" | while read location; do \
		$(MAKE) $(MAKE_OPTIONS) export♡$$location♡$(shell date '+%FT%H'):00:00.json; \
		if [ "$$?" != "0" ]; then exit 1; fi; \
	done

.PHONY: osm-tag-data-gen-stats-overpass-n-days-back
osm-tag-data-gen-stats-overpass-n-days-back: $(STATS_FOR_BOUNDARIES)
	@if [ -z "$(DAYS_BACK)" ]; then \
		echo "The DAYS_BACK parameter is empty!"; \
		exit 1; \
	fi; \
	grep -v '^#' "$<" | while read location; do \
		for day_back in `seq 0 $(DAYS_INCREMENT) $(DAYS_BACK)`; do \
			if [ "$(OVERPASS_QUERY_STOP_AFTER_TIME_HOUR)" == "`date '+%H'`" ]; then \
				echo "Stopping. The time is `date`."; \
				exit; \
			fi; \
			if [ "$$location" == "int_name♡Deutschland" ]; then \
				echo "Making multiple queries to overcome a timeout bug of the overpass API."; \
				$(MAKE) $(MAKE_OPTIONS) "OVERPASS_QUERY_KEY_FILTER_CMD=grep --line-regexp \"opening_hours\"" "export♡$$location♡`date -d \"$(START_DATE) - $$day_back days\" '+%F'`T00:00:00.json"; \
				if [ "$$?" != "0" ]; then exit 1; fi; \
				$(MAKE) $(MAKE_OPTIONS) "OVERPASS_QUERY_KEY_FILTER_CMD=grep --line-regexp --invert-match \"opening_hours\"" "export♡$$location♡`date -d \"$(START_DATE) - $$day_back days\" '+%F'`T00:00:00.json"; \
				if [ "$$?" != "0" ]; then exit 1; fi; \
			else \
				$(MAKE) $(MAKE_OPTIONS) "export♡$$location♡`date -d \"$(START_DATE) - $$day_back days\" '+%F'`T00:00:00.json"; \
			fi; \
			if [ "$$?" != "0" ]; then exit 1; fi; \
		done; \
	done

## To track the OSM activities of Jack Bauer :)
.PHONY: osm-tag-data-gen-stats-overpass-24-hours
osm-tag-data-gen-stats-overpass-24-hours: $(STATS_FOR_BOUNDARIES)
	@grep -v '^#' "$<" | while read location; do \
		for hour in `seq --equal-width 0 $(HOURS_INCREMENT) 23`; do \
		if [ "$(OVERPASS_QUERY_STOP_AFTER_TIME_HOUR)" == "`date '+%H'`" ]; then \
			echo "Stopping. The time is `date`."; \
			exit; \
		fi; \
		$(MAKE) $(MAKE_OPTIONS) "export♡$$location♡`date -d \"$(START_DATE)" '+%F'`T$${hour}:00:00.json"; \
		if [ "$$?" != "0" ]; then exit 1; fi; \
		done; \
	done

.PHONY: osm-tag-data-gen-stats-sort
osm-tag-data-gen-stats-sort:
	@find . -name 'export*stats.csv' | while read file; do \
		sort --numeric-sort "$$file" > "$$file.tmp" && \
		mv "$$file.tmp" "$$file"; \
	done
## }}}

opening_hours.min.js:

%.min.js: %.js
	uglifyjs "$<" --output "$@" --comments '/ypid\/opening_hours\.js/' --lint

README.html:

%.html: %.md
	pandoc --from markdown_github --to html --standalone "$<" --output "$@"
