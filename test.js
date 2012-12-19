var assert = require('assert');
var sys = require('sys');

var opening_hours = require('./opening_hours.js');

var test = new opening_hours_test();

test.addTest('Time intervals', [
		'10:00-12:00',
		'10:00-11:00,11:00-12:00',
		'10:00-11:00;11:00-12:00',
		'10:00-14:00;12:00-14:00 off',
		'10:00-12:00;10:30-11:30',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 12:00' ],
		[ '2012.10.02 10:00', '2012.10.02 12:00' ],
		[ '2012.10.03 10:00', '2012.10.03 12:00' ],
		[ '2012.10.04 10:00', '2012.10.04 12:00' ],
		[ '2012.10.05 10:00', '2012.10.05 12:00' ],
		[ '2012.10.06 10:00', '2012.10.06 12:00' ],
		[ '2012.10.07 10:00', '2012.10.07 12:00' ],
	], 1000 * 60 * 60 * 2 * 7);

test.addTest('Time ranges spanning midnight', [
		'22:00-02:00',
		'22:00-26:00',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 00:00', '2012.10.01 02:00' ],
		[ '2012.10.01 22:00', '2012.10.02 02:00' ],
		[ '2012.10.02 22:00', '2012.10.03 02:00' ],
		[ '2012.10.03 22:00', '2012.10.04 02:00' ],
		[ '2012.10.04 22:00', '2012.10.05 02:00' ],
		[ '2012.10.05 22:00', '2012.10.06 02:00' ],
		[ '2012.10.06 22:00', '2012.10.07 02:00' ],
		[ '2012.10.07 22:00', '2012.10.08 00:00' ],
	], 1000 * 60 * 60 * 4 * 7);

test.addTest('Weekdays', [
		'Mo,Th,Sa,Su 10:00-12:00',
		'Mo,Th,Sa-Su 10:00-12:00',
		'Th,Sa-Mo 10:00-12:00',
		'10:00-12:00; Tu-We 00:00-24:00 off; Fr 00:00-24:00 off',
		ignored('10:00-12:00; Tu-We off; Fr off', 'omitting time interval not implemented'),
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 12:00' ],
		[ '2012.10.04 10:00', '2012.10.04 12:00' ],
		[ '2012.10.06 10:00', '2012.10.06 12:00' ],
		[ '2012.10.07 10:00', '2012.10.07 12:00' ],
	], 1000 * 60 * 60 * 2 * 4, true);

test.addTest('Time ranges spanning midnight w/weekdays', [
		ignored('We 22:00-02:00'),
		ignored('We 22:00-26:00'),
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.03 22:00', '2012.10.04 02:00' ],
	], 1000 * 60 * 60 * 4);

test.addTest('Full range', [
		'00:00-24:00',
		'Mo-Su 00:00-24:00',
		'Fr-Th 00:00-24:00',
		'24/7',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 0:00', '2012.10.08 0:00' ],
	], 1000 * 60 * 60 * 24 * 7);

test.addTest('24/7 as time interval alias', [
		ignored('Mo,We 24/7'),
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 0:00', '2012.10.02 0:00' ],
		[ '2012.10.03 0:00', '2012.10.04 0:00' ],
	], 1000 * 60 * 60 * 24 * 2);

test.addTest('Constrained weekdays', [
		ignored('We[4,5] 10:00-12:00'),
		ignored('We[4-5] 10:00-12:00'),
		ignored('We[4],We[5] 10:00-12:00'),
		ignored('We[4] 10:00-12:00; We[-1] 10:00-12:00'),
		ignored('We[-1,-2] 10:00-12:00'),
	], '2012.10.01 0:00', '2012.11.01 0:00', [
		[ '2012.10.24 10:00', '2012.10.24 12:00' ],
		[ '2012.10.31 10:00', '2012.10.31 12:00' ],
	], 1000 * 60 * 60 * 2 * 2);

test.addTest('Exception rules', [
		'Mo-Fr 10:00-16:00; We 12:00-18:00'
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 16:00' ],
		[ '2012.10.02 10:00', '2012.10.02 16:00' ],
		[ '2012.10.03 12:00', '2012.10.03 18:00' ], // Not 10:00-18:00
		[ '2012.10.04 10:00', '2012.10.04 16:00' ],
		[ '2012.10.05 10:00', '2012.10.05 16:00' ],
	], 1000 * 60 * 60 * 6 * 5);

test.addTest('Month ranges', [
		ignored('Nov-Feb 00:00-24:00'),
		ignored('Jan,Feb,Nov,Dec 00:00-24:00'),
		ignored('00:00-24:00; Mar-Oct off'),
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.01 10:00', '2012.03.01 00:00' ],
		[ '2012.11.01 10:00', '2013.01.01 00:00' ],
	], 1000 * 60 * 60 * 24 * (31 + 29 + 30 + 31));

test.addTest('Week ranges', [
		ignored('week 1,3 00:00-24:00'),
		ignored('week 1-3/2 00:00-24:00'),
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.01 00:00', '2012.01.02 00:00' ],
		[ '2012.01.09 00:00', '2012.01.16 00:00' ],
	], 1000 * 60 * 60 * 24 * (1 + 7));

test.addTest('Week ranges', [
		ignored('week 2,4 00:00-24:00'),
		ignored('week 2-4/2 00:00-24:00'),
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.02 00:00', '2012.01.09 00:00' ],
		[ '2012.01.16 00:00', '2012.01.23 00:00' ],
	], 1000 * 60 * 60 * 24 * (7 + 7));

// TODO: monthday ranges
// TODO: monthday ranges w/o month
// TODO: monthday ranges with /n

test.run();

//======================================================================
// Test framework
//======================================================================
function opening_hours_test() {
	var tests = [];

	function runSingleTest(name, value, from, to, expected_intervals, expected_duration) {
		var ignored = typeof value !== 'string';
		if (ignored) {
			ignored = value[1];
			value = value[0];
		}

		var oh, intervals, duration, intervals_ok, duration_ok, crashed = true;

		try {
			oh = new opening_hours(value);

			intervals = oh.openIntervals(new Date(from), new Date(to));
			duration = oh.openDuration(new Date(from), new Date(to));

			intervals_ok = intervals.length == expected_intervals.length;
			duration_ok = duration === expected_duration;

			crashed = false;
		} catch (err) {
			crashed = err;
		}

		if (intervals_ok) {
			for (var interval = 0; interval < intervals.length; interval++) {
				var expected_from = new Date(expected_intervals[interval][0]);
				var expected_to = new Date(expected_intervals[interval][1]);

				if (intervals[interval][0].getTime() != expected_from.getTime() ||
						intervals[interval][1].getTime() != expected_to.getTime())
					intervals_ok = false;
			}
		}

		var passed = false;
		var str = '"' + name + '" for "' + value + '": ';
		if (intervals_ok && duration_ok) {
			str += '[1;32mPASSED[0m';
			if (ignored)
				str += ', [1;33malso ignored, please unignore since the test passes![0m';
			passed = true;
		} else if (ignored) {
			str += '[1;33mIGNORED[0m, reason: ' + ignored;
		} else if (crashed) {
			str += '[1;35mCRASHED[0m, reason: ' + crashed;
		} else {
			str += '[1;31mFAILED[0m';
			if (!duration_ok)
				str += ', bad duration: ' + duration + ', expected ' + expected_duration;
			if (!intervals_ok)
				str += ', bad intervals: \n' + intervalsToString(intervals) + '\nexpected:\n' + intervalsToString(expected_intervals);
		}

		sys.puts(str);
		return passed;
	}

	function intervalsToString(intervals) {
		var res = '';

		for (var interval = 0; interval < intervals.length; interval++) {
			var from = formatDate(intervals[interval][0]);
			var to = formatDate(intervals[interval][1]);

			if (interval != 0)
				res += '\n';

			res += '[ ' + from + ' - ' + to + ' ]';
		}

		return res;
	}

	function formatDate(date) {
		if (typeof date === 'string')
			return date;

		var res = '';
		res += date.getFullYear() + '.';
		res += ('0' + (date.getMonth() + 1)).substr(-2, 2) + '.';
		res += ('0' + date.getDate()).substr(-2, 2) + ' ';
		res += ('0' + date.getHours()).substr(-2, 2) + ':';
		res += ('0' + date.getMinutes()).substr(-2, 2);
		return res;
	}

	this.run = function() {
		var success = 0;
		for (var test = 0; test < tests.length; test++) {
			if (runSingleTest(tests[test][0], tests[test][1], tests[test][2], tests[test][3], tests[test][4], tests[test][5]))
				success++;
		}
				
		sys.puts(success + '/' + tests.length + ' tests passed');
	}

	this.addTest = function(name, values, from, to, expected_intervals, expected_duration) {
		if (typeof values === 'string')
			tests.push([name, values, from, to, expected_intervals, expected_duration]);
		else
			for (var value = 0; value < values.length; value++)
				tests.push([name, values[value], from, to, expected_intervals, expected_duration]);
	}
}

function ignored(value, reason) {
	if (typeof reason === 'undefined')
		reason = 'not implemented yet';
	return [ value, reason ];
}
