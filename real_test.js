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
		var success_differ = 0; // increment only by one despite that the value might appears more than one time
		var success        = 0; // increment by number of appearances
		var total_differ   = 0; // number of different values
		var total          = 0; // total number of values (if one value appears more than one, it counts more than one)
		var important_and_failed = [];

		fs.readFile(file, 'utf8', function (err, data) {
			if (err) {
				console.log('Error: ' + err);
				return;
			}

			var data = JSON.parse(data);

			total_differ = data.data.length;
			for (var i = 0; i < total_differ; i++)
				total += data.data[i].count;

			var before = new Date();

			var parsed_values = 0; // total number of values which are "parsed" (if one value appears more than one, it counts more than one)
			for (var i = 0; i < total_differ; i++) {
				importance = data.data[i].count + data.data[i].in_wiki * 50;
				if (test_value(data.data[i].value)) {
					success_differ++;
					success += data.data[i].count;
				} else if (importance > 150) {
					important_and_failed.push([data.data[i].value, importance]);
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
					console.log('Failed with importance ' + important_and_failed[i][1] + ': ' + important_and_failed[i][0]);
				}
			}
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
	function Comparator(a,b){
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	}
}
