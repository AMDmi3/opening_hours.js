NODE?=	node
SEARCH?= opening_hours

default: check

all: test real_test

check: test

test: opening_hours.js test.js
	${NODE} test.js

.SILENT: diff-test
diff-test: opening_hours.js test.js
	git checkout -- test.log
	-${NODE} test.js 1> test.log 2>&1
	git --no-pager diff --color-words test.log

benchmark: opening_hours.js benchmark.js
	${NODE} benchmark.js

real_test: opening_hours.js real_test.js all-osm-tags
	${NODE} real_test.js

.PHONY : regex_search
regex_search: export.$(SEARCH).json interactive_testing.js
	./regex_search.py $<

interactive_testing: interactive_testing.js
	${NODE} interactive_testing.js

clean:
	rm export.*.json

all-osm-tags: export.opening_hours.json export.lit.json export.opening_hours\:kitchen.json export.opening_hours\:warm_kitchen.json export.smoking_hours.json export.collection_times.json export.service_times.json export.fee.json

export.%.json:
	wget -O "$(shell echo "$@" | sed 's/\\//g' )" "http://taginfo.openstreetmap.org/api/4/key/values?key=$(shell echo "$@" | sed 's/^export\.\(.*\)\.json/\1/;s/\\//g' )"
