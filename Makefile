NODE?=	node

all: test

test: opening_hours.js test.js
	${NODE} test.js

benchmark: opening_hours.js benchmark.js
	${NODE} benchmark.js

real_test: opening_hours.js real_test.js export.opening_hours.json
	${NODE} real_test.js

export.opening_hours.json:
	wget -O export.opening_hours.json http://taginfo.openstreetmap.org/api/4/key/values\?key\=opening_hours export.json
