var assert = require('assert');
var sys = require('sys');

var opening_hours = require('./opening_hours.js');

var total_tests = 0;
var successfull_tests = 0;

// Simple time
test('10:00-12:00', [
	[ '2012.10.10 0:00', false, '2012.10.10 10:00' ],
	[ '2012.10.10 9:59', false, '2012.10.10 10:00' ],
	[ '2012.10.10 10:00', true, '2012.10.10 12:00' ],
	[ '2012.10.10 10:01', true, '2012.10.10 12:00' ],
	[ '2012.10.10 11:59', true, '2012.10.10 12:00' ],
	[ '2012.10.10 12:00', false, '2012.10.11 10:00' ],
	[ '2012.10.10 12:01', false, '2012.10.11 10:00' ],
	[ '2012.10.10 23:59', false, '2012.10.11 10:00' ],
]);

// Time wrapping over midnight
// XXX: this works, but this won't work with date constraints
test([ '22:00-02:00', '22:00-26:00' ], [
	[ '2012.10.10 0:00', true, '2012.10.10 02:00' ],
	[ '2012.10.10 01:59', true, '2012.10.10 02:00' ],
	[ '2012.10.10 02:00', false, '2012.10.10 22:00' ],
	[ '2012.10.10 02:01', false, '2012.10.10 22:00' ],
	[ '2012.10.10 21:59', false, '2012.10.10 22:00' ],
	[ '2012.10.10 22:00', true, '2012.10.11 02:00' ],
	[ '2012.10.10 22:01', true, '2012.10.11 02:00' ],
	[ '2012.10.10 23:59', true, '2012.10.11 02:00' ],
]);

// Multiple rules, multiple selectors, exclusions
test([ '10:00-12:00;14:00-20:00', '10:00-12:00,14:00-20:00', '10:00-20:00;12:00-14:00 off' ], [
	[ '2012.10.10 9:59', false, '2012.10.10 10:00' ],
	[ '2012.10.10 10:00', true, '2012.10.10 12:00' ],
	[ '2012.10.10 11:59', true, '2012.10.10 12:00' ],
	[ '2012.10.10 12:00', false, '2012.10.10 14:00' ],
	[ '2012.10.10 13:59', false, '2012.10.10 14:00' ],
	[ '2012.10.10 14:00', true, '2012.10.10 20:00' ],
	[ '2012.10.10 19:59', true, '2012.10.10 20:00' ],
	[ '2012.10.10 20:00', false, '2012.10.11 10:00' ],
]);

// More exclusions
test('00:00-24:00; 10:00-12:00 off', [
	[ '2012.10.10 9:59', true, '2012.10.10 10:00' ],
	[ '2012.10.10 10:00', false, '2012.10.10 12:00' ],
	[ '2012.10.10 11:59', false, '2012.10.10 12:00' ],
	[ '2012.10.10 12:00', true, '2012.10.11 10:00' ],
	[ '2012.10.11 9:59', true, '2012.10.11 10:00' ],
	[ '2012.10.11 10:00', false, '2012.10.11 12:00' ],
	[ '2012.10.11 11:59', false, '2012.10.11 12:00' ],
	[ '2012.10.11 12:00', true, '2012.10.12 10:00' ],
]);

// Weekdays
test('Mo,We,Fr-Sa 10:00-12:00', [
	// Mo
	[ '2012.10.08 9:59', false, '2012.10.08 10:00' ],
	[ '2012.10.08 10:00', true, '2012.10.08 12:00' ],
	[ '2012.10.08 11:59', true, '2012.10.08 12:00' ],
	[ '2012.10.08 12:00', false, '2012.10.10 10:00' ],
	// Tu
	[ '2012.10.09 9:59', false, '2012.10.10 10:00' ],
	[ '2012.10.09 10:00', false, '2012.10.10 10:00' ],
	[ '2012.10.09 11:59', false, '2012.10.10 10:00' ],
	[ '2012.10.09 12:00', false, '2012.10.10 10:00' ],
	// We
	[ '2012.10.10 9:59', false, '2012.10.10 10:00' ],
	[ '2012.10.10 10:00', true, '2012.10.10 12:00' ],
	[ '2012.10.10 11:59', true, '2012.10.10 12:00' ],
	[ '2012.10.10 12:00', false, '2012.10.12 10:00' ],
	// Th
	[ '2012.10.11 9:59', false, '2012.10.12 10:00' ],
	[ '2012.10.11 10:00', false, '2012.10.12 10:00' ],
	[ '2012.10.11 11:59', false, '2012.10.12 10:00' ],
	[ '2012.10.11 12:00', false, '2012.10.12 10:00' ],
	// Fr
	[ '2012.10.12 9:59', false, '2012.10.12 10:00' ],
	[ '2012.10.12 10:00', true, '2012.10.12 12:00' ],
	[ '2012.10.12 11:59', true, '2012.10.12 12:00' ],
	[ '2012.10.12 12:00', false, '2012.10.13 10:00' ],
	// Sa
	[ '2012.10.13 9:59', false, '2012.10.13 10:00' ],
	[ '2012.10.13 10:00', true, '2012.10.13 12:00' ],
	[ '2012.10.13 11:59', true, '2012.10.13 12:00' ],
	[ '2012.10.13 12:00', false, '2012.10.15 10:00' ],
	// Su
	[ '2012.10.14 9:59', false, '2012.10.15 10:00' ],
	[ '2012.10.14 10:00', false, '2012.10.15 10:00' ],
	[ '2012.10.14 11:59', false, '2012.10.15 10:00' ],
	[ '2012.10.14 12:00', false, '2012.10.15 10:00' ],
]);

// Reversed weekday range
test('Sa-Mo 10:00-12:00', [
	// Mo
	[ '2012.10.08 9:59', false, '2012.10.08 10:00' ],
	[ '2012.10.08 10:00', true, '2012.10.08 12:00' ],
	[ '2012.10.08 11:59', true, '2012.10.08 12:00' ],
	[ '2012.10.08 12:00', false, '2012.10.13 10:00' ],
	// Tu
	[ '2012.10.09 9:59', false, '2012.10.13 10:00' ],
	[ '2012.10.09 10:00', false, '2012.10.13 10:00' ],
	[ '2012.10.09 11:59', false, '2012.10.13 10:00' ],
	[ '2012.10.09 12:00', false, '2012.10.13 10:00' ],
	// We
	[ '2012.10.10 9:59', false, '2012.10.13 10:00' ],
	[ '2012.10.10 10:00', false, '2012.10.13 10:00' ],
	[ '2012.10.10 11:59', false, '2012.10.13 10:00' ],
	[ '2012.10.10 12:00', false, '2012.10.13 10:00' ],
	// Th
	[ '2012.10.11 9:59', false, '2012.10.13 10:00' ],
	[ '2012.10.11 10:00', false, '2012.10.13 10:00' ],
	[ '2012.10.11 11:59', false, '2012.10.13 10:00' ],
	[ '2012.10.11 12:00', false, '2012.10.13 10:00' ],
	// Fr
	[ '2012.10.12 9:59', false, '2012.10.13 10:00' ],
	[ '2012.10.12 10:00', false, '2012.10.13 10:00' ],
	[ '2012.10.12 11:59', false, '2012.10.13 10:00' ],
	[ '2012.10.12 12:00', false, '2012.10.13 10:00' ],
	// Sa
	[ '2012.10.13 9:59', false, '2012.10.13 10:00' ],
	[ '2012.10.13 10:00', true, '2012.10.13 12:00' ],
	[ '2012.10.13 11:59', true, '2012.10.13 12:00' ],
	[ '2012.10.13 12:00', false, '2012.10.14 10:00' ],
	// Su
	[ '2012.10.14 9:59', false, '2012.10.14 10:00' ],
	[ '2012.10.14 10:00', true, '2012.10.14 12:00' ],
	[ '2012.10.14 11:59', true, '2012.10.14 12:00' ],
	[ '2012.10.14 12:00', false, '2012.10.15 10:00' ],
]);

// Wrapped time w/weekdays
/*test('We 22:00-02:00', [
	[ '2012.10.10 00:00', false, '2012.10.10 22:00' ],
	[ '2012.10.10 21:59', false, '2012.10.10 22:00' ],
	[ '2012.10.10 22:00', true, '2012.10.11 02:00' ],
	[ '2012.10.10 23:59', true, '2012.10.11 02:00' ],
	[ '2012.10.11 00:00', true, '2012.10.11 02:00' ],
	[ '2012.10.11 01:59', true, '2012.10.11 02:00' ],
	[ '2012.10.11 02:00', false, '2012.10.17 22:00' ],
	[ '2012.10.10 23:59', false, '2012.10.17 22:00' ],
]);*/

// Full range
test('Mo,Tu,We-Su 00:00-24:00', [
	[ '2012.10.10 0:0', true ],
	[ '2012.10.11 0:0', true ],
	[ '2012.10.12 0:0', true ],
	[ '2012.10.13 0:0', true ],
	[ '2012.10.14 0:0', true ],
	[ '2012.10.15 0:0', true ],
	[ '2012.10.16 0:0', true ],
]);

// Intervals
intervals_test(['10:00-12:00,14:00-16:00', '10:00-16:00;12:00-14:00 off'], '2012.10.10 00:00', '2012.10.12 00:00', [
	[ '2012.10.10 10:00', '2012.10.10 12:00' ],
	[ '2012.10.10 14:00', '2012.10.10 16:00' ],
	[ '2012.10.11 10:00', '2012.10.11 12:00' ],
	[ '2012.10.11 14:00', '2012.10.11 16:00' ],
]);
intervals_test(['00:00-02:00;22:00-24:00', '22:00-02:00', '22:00-26:00'], '2012.10.10 00:00', '2012.10.12 00:00', [
	[ '2012.10.10 00:00', '2012.10.10 02:00' ],
	[ '2012.10.10 22:00', '2012.10.11 02:00' ],
	[ '2012.10.11 22:00', '2012.10.12 00:00' ],
]);

// Durations
duration_test(['10:00-12:00,14:00-16:00', '10:00-16:00;12:00-14:00 off'], '2012.10.10 00:00', '2012.10.12 00:00', 8*60*60*1000);
duration_test(['00:00-02:00;22:00-24:00', '22:00-02:00', '22:00-26:00'], '2012.10.10 00:00', '2012.10.12 00:00', 8*60*60*1000);

sys.puts(successfull_tests + '/' + total_tests + ' successfull')

function test(values, checks) {
	if (typeof values === 'string')
		values = [ values ];
	for (var value = 0; value < values.length; value++) {
		var oh = new opening_hours(values[value]);
		sys.puts('opening_hours=' + values[value]);
		for (var ncheck = 0; ncheck < checks.length; ncheck++) {
			var sample = new Date(checks[ncheck][0]);
			var expected_state = checks[ncheck][1];
			var expected_change = typeof checks[ncheck][2] === 'undefined' ? undefined : new Date(checks[ncheck][2]);

			sys.puts('  #' + ncheck + ': sample=' + sample + ', exp.state=' + expected_state + ', exp.change=' + expected_change + ': ');

			var state = oh.isOpen(sample);
			var change = oh.nextChange(sample);

			var error = false;

			if (state !== expected_state) {
				sys.puts('    [[1;31mFAILED[0m], unexpected state: ' + state);
				error = true;
			}
			if (typeof expected_change !== 'undefined' && (typeof change === 'undefined' || change.getTime() !== expected_change.getTime())) {
				sys.puts('    [[1;31mFAILED[0m], mismatch of date=' + change);
				error = true;
			}

			total_tests++;
			if (!error)
				successfull_tests++;
		}
	}
}

function intervals_test(values, from, to, expected_intervals) {
	if (typeof values === 'string')
		values = [ values ];
	for (var value = 0; value < values.length; value++) {
		var oh = new opening_hours(values[value]);
		sys.puts('opening_hours=' + values[value]);

		sys.puts('  intervals at (' + from + ', ' + to + '), exp.intervals=(' + expected_intervals.join('; ') + '):');

		var error = false;

		var intervals = oh.openIntervals(new Date(from), new Date(to));

		if (intervals.length != expected_intervals.length) {
			sys.puts('    [[1;31mFAILED[0m], unexpected number of intervals: ' + intervals.length);
			error = true;
		} else {
			for (var nint = 0; nint < intervals.length; nint++) {
				var expected_from = new Date(expected_intervals[nint][0]);
				var expected_to = new Date(expected_intervals[nint][1]);

				if (intervals[nint][0].getTime() !== expected_from.getTime() || intervals[nint][1].getTime() !== expected_to.getTime()) {
					sys.puts('    [[1;31mFAILED[0m], unexpected interval ' + nint + ': [' + intervals[nint][0] + ':' + intervals[nint][1] + ']');
					error = true;
					break;
				}
			}
		}

		total_tests++;
		if (!error)
			successfull_tests++;
	}
}

function duration_test(values, from, to, expected_duration) {
	if (typeof values === 'string')
		values = [ values ];
	for (var value = 0; value < values.length; value++) {
		var oh = new opening_hours(values[value]);
		sys.puts('opening_hours=' + values[value]);
		sys.puts('  open duration at (' + from + ', ' + to + '), exp.duration=' + expected_duration + '):');

		var duration = oh.openDuration(new Date(from), new Date(to));

		if (duration != expected_duration) {
			sys.puts('    [[1;31mFAILED[0m], unexpected open duration: ' + duration);
			error = true;
		} else {
			successfull_tests++;
		}

		total_tests++;
	}
}
