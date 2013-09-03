NODE?=	node

all: test

test: opening_hours.js test.js
	${NODE} test.js

benchmark: opening_hours.js benchmark.js
	${NODE} benchmark.js

real_test: opening_hours.js real_test.js export.opening_hours.json export.lit.json export.opening_hours\:kitchen.json
	${NODE} real_test.js

export.%.json:
	wget -O "$(shell echo "$@" | sed 's/\\//g' )" "http://taginfo.openstreetmap.org/api/4/key/values?key=$(shell echo "$@" | sed 's/^export\.\(.*\)\.json/\1/;s/\\//g' )"
