#!/usr/bin/env nodejs

/*
 * Additional features:
 *   * Can log all values and if they could be evaluated or not to a log file
 *   to compare versions.  Just `touch real_test.opening_hours.log` to generate
 *   this for the tag opening_hours.
 *
 *   * Can write out statistics to compare the number of values and how many
 *   could be parsed.  Just `touch real_test.opening_hours.stats.csv` to
 *   generate this for the tag opening_hours.
 *
 *   * You can restrict the tags which should be parsed. Just specify them as
 *   parameter.
 */

/* Required modules {{{ */
var opening_hours = require('./opening_hours.js');
var fs = require('fs');
var colors = require('colors');
var sprintf = require('sprintf-js').sprintf;
/* }}} */

colors.setTheme({
	result: [ 'green', 'bold' ],
});

/* Run tests {{{ */
var test = new opening_hours_test();

/* Add as much tests (for different tags) as you like. Just make sure that the
 * export is present by added it as dependence to the make file. Tests will not
 * be executed in order listed here due to non-blocking aspect of JS and
 * node.js.
 */

test.exported_json('opening_hours');

test.exported_json('happy_hours');

test.exported_json('delivery_hours');

test.exported_json('opening_hours:delivery');

test.exported_json('lit', { ignore: [ 'yes', 'no', 'on', 'automatic', 'interval', 'limited' ]});

test.exported_json('opening_hours:kitchen', { ignore: [ 'opening_hours' ]});

test.exported_json('opening_hours:warm_kitchen', { ignore: [ 'opening_hours' ]});

test.exported_json('smoking_hours', { ignore: [ 'yes' ]});

test.exported_json('collection_times', { oh_mode: 2 });
// oh_mode 2: "including the hyphen because there are post boxes which are emptied several (undefined) times or one (undefined) time in a certain time frame. This shall be covered also.". Ref: http://wiki.openstreetmap.org/wiki/Key:collection_times

test.exported_json('service_times', { oh_mode: 2, ignore: [ 'automatic' ] });
// Mostly points in time are used. But there are 244 values which use time ranges. Both seems useful.

test.exported_json('fee', { ignore: [ 'yes', 'no', 'interval', 'unknown' ]});
/* }}} */

/* Test framework {{{ */
function opening_hours_test() {
	var args = process.argv.splice(2);

	// var percent_number_format     = '%04.1f %%';
	// Looks kind of unusual.
	var percent_number_format            = '%.1f %%';
	var total_value_number_format        = '%7d';
	var total_differ_value_number_format = '%6d';
	var ms_runtime_number_format         = '%5d';

	var nominatiomTestJSON = {"place_id":"44651229","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36248375","lat":"49.5400039","lon":"9.7937133","display_name":"K 2847, Lauda-K\u00f6nigshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-W\u00fcrttemberg, Germany, European Union","address":{"road":"K 2847","city":"Lauda-K\u00f6nigshofen","county":"Main-Tauber-Kreis","state_district":"Regierungsbezirk Stuttgart","state":"Baden-W\u00fcrttemberg","country":"Germany","country_code":"de","continent":"European Union"}};

	console.log('The holiday defintions for the country ' + nominatiomTestJSON.address.country_code + ' are used so the result will probably be a bit worse in reality but you can change that by providing the definition for missing holidays.\n');


	this.exported_json = function (tagname /* file exported by the taginfo API */, options) {
		if (args.length > 0) {
			if (args.indexOf(tagname) === -1)
				return;
		}

		var how_often_print_stats = 15000;
		var importance_threshold  = 30;
		var global_ignore = [ 'fixme', 'FIXME' ];

		fs.readFile(__dirname + '/export.' + tagname + '.json', 'utf8', function (err, data) {
			if (err) {
				console.log('Error for tag "' + tagname + '": ' + err);
				return;
			}

			var ignored_values = global_ignore;
			if (typeof options !== 'undefined' && typeof options.ignore !== 'undefined')
				ignored_values.push.apply(ignored_values, options.ignore);

			var oh_mode = 0;
			if (typeof options !== 'undefined' && typeof options.oh_mode == 'number')
				oh_mode = options.oh_mode;

			console.log('Parsing ' + tagname.blue.bold + (ignored_values.length !== 0 ? ' (ignoring: ' + ignored_values.join(', ') + ')': '') + ' …');

			var success_differ       = 0; // increment only by one despite that the value might appears more than one time
			var success              = 0; // increment by number of appearances
			var total_differ         = 0; // number of different values
			var total                = 0; // total number of values (if one value appears more than one, it counts more than one)
			var warnings             = 0; // number of values which throw warnings
			var warnings_differ      = 0; // number of values which throw warnings (only one warning is counted for each value if more appear)
			var not_pretty           = 0; // number of values which are not the same as the value returned by oh.prettifyValue()
			var not_pretty_differ    = 0; // number of values which are not pretty (only one warning is counted for each value if more appear)
			var important_and_failed = [];

			var logfile_out_string = '';

			data = JSON.parse(data);

			for (var i = 0; i < data.data.length; i++) {
				if (indexOf.call(ignored_values, data.data[i].value) == -1) {
					total_differ++;
					total += data.data[i].count;
				}
			}

			var time_at_test_begin = new Date();

			var parsed_values = 0; // total number of values which are "parsed" (if one value appears more than one, it counts more than one)
			for (var i = 0; i < total_differ; i++) {
				if (indexOf.call(ignored_values, data.data[i].value) == -1) {
					var result = test_value(data.data[i].value, oh_mode);
					logfile_out_string += (+result[0]) + ' ' + data.data[i].value + '\n';
					if (result[0]) {
						success_differ++;
						success += data.data[i].count;
						warnings_differ += !!result[1];
						warnings += data.data[i].count * !!result[1];
						not_pretty += result[2];
						not_pretty_differ += data.data[i].count * result[2];
						// console.log('passed', data.data[i].value);
					} else if (data.data[i].count > importance_threshold) {
						important_and_failed.push([data.data[i].value, data.data[i].count]);
					}
					parsed_values += data.data[i].count;

					if (i !== 0 && i % how_often_print_stats === 0) {
						log_to_user(false, total, i, i, parsed_values,
							success, success_differ, warnings, warnings_differ, not_pretty, not_pretty_differ,
							time_at_test_begin);
					}
				}
			}
			if (total_differ >= how_often_print_stats)
				console.log();

			log_to_user(true, total, total_differ, undefined, parsed_values,
				success, success_differ, warnings, warnings_differ, not_pretty, not_pretty_differ,
				time_at_test_begin);

			if (important_and_failed.length > 0) {
				important_and_failed = important_and_failed.sort(Comparator);
				for (var i = 0; i < important_and_failed.length; i++) {
					var value = important_and_failed[i][0];
					var count = important_and_failed[i][1];
					console.log('Failed with value which appears ' + sprintf(total_differ_value_number_format, count) + ' times: ' + value);
				}
			}
			console.log();

			/* Just `touch` the file that you want logs for. */
			if (fs.existsSync('real_test.' + tagname + '.log')) {
				try {
					fs.renameSync('real_test.' + tagname + '.log', 'real_test.last.' + tagname + '.log');
				} catch (err) {
					/* Ignore */
				}
				fs.writeFile('real_test.' + tagname + '.log', logfile_out_string, function(err) {
						if (err)
							throw(err);
					}
				);
			}
			if (fs.existsSync('real_test.' + tagname + '.stats.csv')) {
				if (fs.statSync('real_test.' + tagname + '.stats.csv').size === 0) {
					fs.appendFile(
						'real_test.' + tagname + '.stats.csv',
						[
							"Time",
							"Number of values", "Number of different values",
							"Number of values which could be parsed", "Number of different values which could be parsed",
							"Number of values which returned a warning", "Number of different values which returned a warning",
							"Number of values which are not prettified", "Number of different values which are not prettified",
						].join(', ') + '\n',
						function(err) {
							if (err)
								throw(err);
						}
					);
				}
				var current_dump_creation_time = get_dump_creation_time_from_file('taginfo_sources.json');
				if (typeof current_dump_creation_time != 'object') {
				    throw('dump creation time is unknown.');
				}
				fs.appendFile(
					'real_test.' + tagname + '.stats.csv',
					current_dump_creation_time.toISOString() + ', ' + [
						total, total_differ,
						success, success_differ,
						warnings, warnings_differ,
						not_pretty, not_pretty_differ
					].join(', ') + '\n',
					function(err) {
						if (err)
							throw(err);
					}
				);
			}
		});
	};

	function log_to_user(tests_done, total, total_differ, currently_parsed_value, parsed_values,
		success, success_differ, warnings, warnings_differ, not_pretty, not_pretty_differ, time_at_test_begin) {

		var delta = (new Date()).getTime() - time_at_test_begin.getTime();

		// if (tests_done)
			// console.log('Done:');

		console.log(
			sprintf(total_value_number_format, success) + '/' + sprintf(total_value_number_format, total) +
			' (' + get_percent(success, parsed_values) +
				( tests_done ?
					', not pretty: ' + get_percent(not_pretty, parsed_values)
				  :
					'' /* Need the space to fit one line on the screen … */
				) +
			', with warnings: ' + get_percent(warnings , parsed_values) + ')' +
			', only different values: '+ sprintf(total_differ_value_number_format, success_differ) +'/'+ sprintf(total_differ_value_number_format, total_differ) +
			' (' + get_percent(success_differ, total_differ) + ')' +
			' tests passed. ' +
				( tests_done ?
					sprintf(total_value_number_format, total) + ' values' +
					' in ' + sprintf(ms_runtime_number_format, delta) + ' ms (' + sprintf('%0.1f', total/delta*1000) + ' n/sec).\n'
				:
					// sprintf(total_value_number_format, total_differ - currently_parsed_value) + ' left … ' +
					sprintf(total_value_number_format, currently_parsed_value) + ' values' +
					' in ' + sprintf(ms_runtime_number_format, delta) + ' ms (' + sprintf('%0.1f', currently_parsed_value/delta*1000) + ' n/sec).'
				)
		);
	}

	function get_percent(passing_values, parsed_values) {
		return sprintf('%6s', sprintf(percent_number_format, passing_values / parsed_values * 100)).result;
		/* "100.0 %" would be 7 characters long, but that does not happen to often. */
	}

	function test_value(value, oh_mode) {
		var crashed = true, warnings = [], prettified;
		try {
			oh = new opening_hours(value, nominatiomTestJSON, oh_mode);
			warnings = oh.getWarnings();
			prettified = oh.prettifyValue();

			crashed = false;
		} catch (err) {
			crashed = true;
		}

		if (typeof warnings != 'object')
			warnings = 1; // crashed by oh.getWarnings()
		else
			warnings = warnings.length;

		return [ !crashed, warnings, prettified == value ];
	}

	/* Helper functions {{{ */
	function Comparator(a,b){
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	}

	function indexOf(needle) {
		if(typeof Array.prototype.indexOf === 'function') {
			indexOf = Array.prototype.indexOf;
		} else {
			indexOf = function(needle) {
				var i = -1, index = -1;

				for(i = 0; i < this.length; i++) {
					if(this[i] === needle) {
						index = i;
						break;
					}
				}

				return index;
			};
		}

		return indexOf.call(this, needle);
	}

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
}
/* }}} */
