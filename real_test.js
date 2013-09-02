var opening_hours = require('./opening_hours.js');
var fs = require('fs');

var test = new opening_hours_test();

// Add as much as you like. Just make sure to make sure that the export is
// pressed by added it as dependence in the make file.
// Tests will not be executed in order listed here due to non-blocking aspect
// of JS and node.js.

test.export_json('opening_hours');

test.export_json('lit', { ignore: [ 'yes', 'no', 'on', 'automatic', 'interval' ]});

test.export_json('opening_hours:kitchen', { ignore: [ 'opening_hours' ]});

//======================================================================
// Test framework
//======================================================================
function opening_hours_test() {
	this.export_json = function (tagname /* file exported by the taginfo API */, options) {
		fs.readFile(__dirname + '/export.' + tagname + '.json', 'utf8', function (err, data) {
			if (err) {
				console.log('Error: ' + err);
				return;
			}

			var ignored_values = [];
			if (typeof options !== 'undefined' && typeof options.ignore !== 'undefined')
				ignored_values = options.ignore;

			console.log('Parsing ' + tagname + (ignored_values.length != 0 ? ' (ignoring ' + ignored_values + ')': '') + ' …');

			var success_differ = 0; // increment only by one despite that the value might appears more than one time
			var success        = 0; // increment by number of appearances
			var total_differ   = 0; // number of different values
			var total          = 0; // total number of values (if one value appears more than one, it counts more than one)
			var important_and_failed = [];

			var data = JSON.parse(data);

			total_differ = data.data.length;
			for (var i = 0; i < total_differ; i++)
				total += data.data[i].count;

			var before = new Date();

			var parsed_values = 0; // total number of values which are "parsed" (if one value appears more than one, it counts more than one)
			for (var i = 0; i < total_differ; i++) {
				if (indexOf.call(ignored_values, data.data[i].value) == -1) {
					if (test_value(data.data[i].value)) {
						success_differ++;
						success += data.data[i].count;
					} else if (data.data[i].count > 150) {
						important_and_failed.push([data.data[i].value, data.data[i].count]);
					}
					parsed_values += data.data[i].count;

					if (i != 0 && i % 15000 == 0) {
						var delta = (new Date()).getTime() - before.getTime();
						console.log(success + '/' + total + ' ([1;32m' + Math.round(success / parsed_values * 100) + ' %[0m),'
							+ ' only different values: '+ success_differ +'/'+ total_differ
							+' ([1;32m'+ Math.round(success_differ / i * 100) + ' %[0m)'
							+ ' tests passed.\t'
							+ (total_differ - i) + ' left …    '+ i + ' values, ' + delta + ' ms (' + (i/delta*1000).toFixed(2) + ' n/sec).');
					}
				}
			}

			console.log('\nDone :)');
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
			console.log('\n');
		});
	}

	function test_value(value) {
		var crashed = true;
		try {
			oh = new opening_hours(value);

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
