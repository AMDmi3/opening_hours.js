#!/usr/bin/env node

/* Constant variables {{{ */
var taginfo_api_url = 'http://taginfo.openstreetmap.org/api/4/';
/* }}} */

/* Required modules {{{ */
var http = require('http');
var fs   = require('fs');
/* }}} */

/* Helper functions {{{ */
function get_dump_creation_time_from_file(file) {
	try {
		var data = JSON.parse(fs.readFileSync(file, 'utf8'));
		for (var i = 0; i < data.length; i++) {
			if (data[i].name == 'Database') {
				return new Date(data[i].data_until);
			}
		}
	} catch (err) {
		return;
	}
}
/* }}} */

var previous_dump_creation_time = get_dump_creation_time_from_file('taginfo_sources.json');

/* Download source file and compare {{{ */
console.log('Loading file ' + taginfo_api_url + 'site/sources');
var file = fs.createWriteStream('taginfo_sources.json');
var request = http.get(taginfo_api_url + 'site/sources', function(response) {
	response.pipe(file);

	response.on('error', function(err) {
		throw("Got error: " + err.message);
	});

	response.on('end', function() {
		var current_dump_creation_time = get_dump_creation_time_from_file('taginfo_sources.json');

		if (typeof previous_dump_creation_time == 'object')
			console.log("Previous creation time: " + previous_dump_creation_time);

		if (typeof previous_dump_creation_time == 'object'
				&& previous_dump_creation_time.getTime() == current_dump_creation_time.getTime()) {

				console.log("Nothing new.");
				process.exit(1);
			} else {
				console.log("New data available.");
				console.log("Current creation time: " + current_dump_creation_time.toISOString());
				process.exit(0);
			}
	});
});
/* }}} */
