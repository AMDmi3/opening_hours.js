#!/usr/bin/env nodejs

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

var local_dump_creation_time = get_dump_creation_time_from_file('taginfo_sources.json');

/* Download source file and compare {{{ */
var taginfo_api_url_source = taginfo_api_url + 'site/sources';
console.log('Loading file ' + taginfo_api_url_source + ' to check if new data is availale.');
var file = fs.createWriteStream('taginfo_sources.json');
var request = http.get(taginfo_api_url_source, function(response) {
	response.pipe(file);

	response.on('error', function(err) {
		throw("Got error: " + err.message);
	});

	response.on('end', function() {
		var upstream_dump_creation_time = get_dump_creation_time_from_file('taginfo_sources.json');

		if (typeof local_dump_creation_time == 'object')
			console.log("Local taginfo data was generated on: " + local_dump_creation_time);

		if (typeof local_dump_creation_time == 'object'
				&& local_dump_creation_time.getTime() == upstream_dump_creation_time.getTime()) {

				console.log("Not newer then local data.");
				process.exit(1);
			} else {
				console.log("New data available …");
				console.log("Taginfo data was generated on: " + upstream_dump_creation_time.toISOString());
				process.exit(0);
			}
	});
});
/* }}} */
