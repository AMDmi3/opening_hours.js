NODE?=	node
SEARCH?= opening_hours

.PHONY : default check build clean test test-min diff-test diff-test-min download-dependencies
default: check

build: opening_hours.min.js

download-dependencies:
	npm install

clean:
	rm -f *.min.js
	rm -f export.*.json

test: check real_test benchmark

check: diff-test diff-test-min

test: opening_hours.js test.js
	${NODE} test.js "./$<"

test-min: opening_hours.min.js test.js
	${NODE} test.js "./$<"

%.min.js: %.js
	uglifyjs "$<" --output "$@" --comments '/ypid\/opening_hours\.js/' --lint

.SILENT: diff-test
diff-test: opening_hours.js test.js
	git checkout HEAD -- test.log
	# git checkout master -- test.log
	# git checkout 9f323b9d06720b6efffc7420023e746ff8f1b309 -- test.log
	${NODE} test.js 1> test.log 2>&1 || echo "Test results for $< are exactly the same as on developemt system. So far, so good ;)"
	# git --no-pager diff --color-words test.log
	git --no-pager diff test.log

.SILENT: diff-test-min
diff-test-min: opening_hours.min.js test.js
	git checkout HEAD -- test.log
	${NODE} test.js "./$<" 1> test.log 2>&1 || echo "Test results for $< are exactly the same as on developemt system. So far, so good ;)"
	# git --no-pager diff --color-words test.log
	git --no-pager diff test.log

benchmark: opening_hours.js benchmark.js
	${NODE} benchmark.js

real_test: opening_hours.js real_test.js all-osm-tags
	${NODE} real_test.js

.PHONY : regex_search
regex_search: export.$(SEARCH).json interactive_testing.js
	./regex_search.py $<

interactive_testing: interactive_testing.js
	${NODE} interactive_testing.js

all-osm-tags: export.opening_hours.json export.lit.json export.opening_hours\:kitchen.json export.opening_hours\:warm_kitchen.json export.smoking_hours.json export.collection_times.json export.service_times.json export.fee.json

export.%.json:
	wget -O "$(shell echo "$@" | sed 's/\\//g' )" "http://taginfo.openstreetmap.org/api/4/key/values?key=$(shell echo "$@" | sed 's/^export\.\(.*\)\.json/\1/;s/\\//g' )"
