NODE?=	node

all: test

test: opening_hours.js test.js
	${NODE} test.js
