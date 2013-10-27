var opening_hours = require('./opening_hours.js');
var fs = require('fs');

var nominatiomTestJSON = {"place_id":"44651229","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36248375","lat":"49.5400039","lon":"9.7937133","display_name":"K 2847, Lauda-K\u00f6nigshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-W\u00fcrttemberg, Germany, European Union","address":{"road":"K 2847","city":"Lauda-K\u00f6nigshofen","county":"Main-Tauber-Kreis","state_district":"Regierungsbezirk Stuttgart","state":"Baden-W\u00fcrttemberg","country":"Germany","country_code":"de","continent":"European Union"}};

var test = new opening_hours_test();

console.log('For holidays the ' + nominatiomTestJSON.address.country_code + ' definition is used so the result will probably a bit worser if run in reality but you can change that by providing the definition of the holidays.\n');

// Add as much as you like. Just make sure that the export is
// pressed by added it as dependence in the make file.
// Tests will not be executed in order listed here due to non-blocking aspect
// of JS and node.js.

test.exported_json('opening_hours');

test.exported_json('lit', { ignore: [ 'yes', 'no', 'on', 'automatic', 'interval', 'limited' ]});

test.exported_json('opening_hours:kitchen', { ignore: [ 'opening_hours' ]});

test.exported_json('opening_hours:warm_kitchen', { ignore: [ 'opening_hours' ]});

test.exported_json('smoking_hours', { ignore: [ 'yes' ]});

test.exported_json('collection_times', { mode: 2 });
// mode 2: "including the hyphen because there are post boxes which are emptied several (undefined) times or one (undefined) time in a certain time frame. This shall be covered also.". Ref: http://wiki.openstreetmap.org/wiki/Key:collection_times

test.exported_json('service_times', { mode: 2, ignore: [ 'automatic' ] });
// Mostly points in time are used. But there are 244 values which use time ranges. Both seems useful.

//======================================================================
// Test framework
//======================================================================
function opening_hours_test() {
	this.exported_json = function (tagname /* file exported by the taginfo API */, options) {
		var how_often_print_stats = 15000;
		var importance_threshold  = 30;
		var global_ignore = [ 'fixme', 'FIXME' ];

		fs.readFile(__dirname + '/export.' + tagname + '.json', 'utf8', function (err, data) {
			if (err) {
				console.log('Error: ' + err);
				return;
			}

			var ignored_values = global_ignore;
			if (typeof options !== 'undefined' && typeof options.ignore !== 'undefined')
				ignored_values.push.apply(ignored_values, options.ignore);

			var mode = 0;
			if (typeof options !== 'undefined' && typeof options.mode == 'number')
				mode = options.mode;

			console.log('[1;34mParsing ' + tagname + '[0m' + (ignored_values.length != 0 ? ' (ignoring ' + ignored_values + ')': '') + ' …');

			var success_differ = 0; // increment only by one despite that the value might appears more than one time
			var success        = 0; // increment by number of appearances
			var total_differ   = 0; // number of different values
			var total          = 0; // total number of values (if one value appears more than one, it counts more than one)
			var important_and_failed = [];

			var data = JSON.parse(data);

			for (var i = 0; i < data.data.length; i++) {
				if (indexOf.call(ignored_values, data.data[i].value) == -1) {
					total_differ++;
					total += data.data[i].count;
				}
			}

			var before = new Date();

			var parsed_values = 0; // total number of values which are "parsed" (if one value appears more than one, it counts more than one)
			for (var i = 0; i < total_differ; i++) {
				if (indexOf.call(ignored_values, data.data[i].value) == -1) {
					if (test_value(data.data[i].value, mode)) {
						success_differ++;
						success += data.data[i].count;
						// console.log('passed', data.data[i].value);
					} else if (data.data[i].count > importance_threshold) {
						important_and_failed.push([data.data[i].value, data.data[i].count]);
					}
					parsed_values += data.data[i].count;

					if (i != 0 && i % how_often_print_stats == 0) {
						var delta = (new Date()).getTime() - before.getTime();
						console.log(success + '/' + total + ' ([1;32m' + Math.round(success / parsed_values * 100) + ' %[0m),'
							+ ' only different values: '+ success_differ +'/'+ total_differ
							+' ([1;32m'+ Math.round(success_differ / i * 100) + ' %[0m)'
							+ ' tests passed.\t'
							+ (total_differ - i) + ' left …\t'+ i + ' values, ' + delta + ' ms (' + (i/delta*1000).toFixed(2) + ' n/sec).');
					}
				}
			}

			if (total_differ >= how_often_print_stats)
				console.log();

			console.log('Done :)');
			console.log(success + '/' + total + ' ([1;32m' + Math.round(success / total * 100) + ' %[0m),'
				+ ' only different values: '+ success_differ +'/'+ total_differ
				+' ([1;32m'+ Math.round(success_differ / total_differ * 100) + ' %[0m)'
				+ ' tests passed.');
			var delta = (new Date()).getTime() - before.getTime();
			console.log(total + ' values, ' + delta + ' ms (' + (total/delta*1000).toFixed(2) + ' n/sec).\n');

			if (important_and_failed.length > 0) {
				important_and_failed = important_and_failed.sort(Comparator);
				for (var i = 0; i < important_and_failed.length; i++) {
					var value = important_and_failed[i][0];
					var count = important_and_failed[i][1];
					console.log('Failed with value which appears ' + count + ' times:\t' + value);
				}
			}
			console.log();
		});
	}

	function test_value(value, mode) {
		var crashed = true;
		try {
			oh = new opening_hours(value, nominatiomTestJSON, mode);

			crashed = false;
		} catch (err) {
			// ignore
		}

		return !crashed;
	}

	// helper functions
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
}
