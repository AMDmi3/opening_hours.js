var opening_hours = require('./opening_hours.js');
var fs = require('fs');

var test = new opening_hours_test();

var file = __dirname + '/export.opening_hours.json';
// var file = __dirname + '/test.json';

test.json_export_file(file);

//======================================================================
// Test framework
//======================================================================
function opening_hours_test() {
	this.json_export_file = function (file /* file exported by the taginfo API */) {
		var success = 0, total = 0;
		fs.readFile(file, 'utf8', function (err, data) {
			if (err) {
				console.log('Error: ' + err);
				return;
			}

			var data = JSON.parse(data);

			total = data.data.length;

			var before = new Date();

			for (var i = 0; i < total; i++) {
				importance = data.data[i].count + data.data[i].in_wiki * 5;
				success += test_value(data.data[i].value);
				// console.log('importance: ' + importance, data.data[i].value);
				if (i % 15000 == 0) {
					var delta = (new Date()).getTime() - before.getTime();
					console.log(success + '/' + i + ' of ' + total + ' (' + Math.round(success / i * 100) + ' %) tests passed. '
						+ (total - i) + ' left …    '+ i + ' values, ' + delta + ' ms (' + (i/delta*1000).toFixed(2) + ' n/sec).');
				}
			}

			// console.dir(data.data.length);
			// console.dir(data.data[0]);
			console.log('\nDone :)');
			console.log(success + '/' + total + ' (' + Math.round(success / total * 100) + ' %) tests passed.');
			var delta = (new Date()).getTime() - before.getTime();
			console.log(total + ' values, ' + delta + ' ms (' + (total/delta*1000).toFixed(2) + ' n/sec).');
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
}
