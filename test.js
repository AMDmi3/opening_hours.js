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
]);

// Weekdays
test('We 10:00-12:00', [ // 2012.10.10 is Wednesday
	[ '2012.10.10 9:59', false, '2012.10.10 10:00' ],
	[ '2012.10.10 10:00', true, '2012.10.10 12:00' ],
	[ '2012.10.10 11:59', true, '2012.10.10 12:00' ],
	[ '2012.10.10 12:00', false, '2012.10.17 10:00' ],
	[ '2012.10.11 9:59', false, '2012.10.17 10:00' ],
	[ '2012.10.11 10:00', false, '2012.10.17 10:00' ],
	[ '2012.10.11 11:59', false, '2012.10.17 10:00' ],
	[ '2012.10.11 12:00', false, '2012.10.17 10:00' ],
]);

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

sys.puts(successfull_tests + '/' + total_tests + ' successfull')

function test(values, checks) {
	if (typeof values === 'string')
		values = [ values ];
	for (var value = 0; value < values.length; value++) {
		var oh = new opening_hours(values[value]);
		sys.puts('opening_hours=' + value);
		for (var ncheck = 0; ncheck < checks.length; ncheck++) {
			var sample = new Date(checks[ncheck][0]);
			var expected_state = checks[ncheck][1];
			var expected_change = typeof checks[ncheck][2] === 'undefined' ? undefined : new Date(checks[ncheck][2]);

			sys.puts('  #' + ncheck + ': sample=' + sample + ', expected state=' + expected_state + ', expected change=' + expected_change + ': ');

			var state = oh.isOpen(sample);
			var change = oh.nextChange(sample);

			var error = false;

			if (state !== expected_state) {
				sys.puts('    [[1;31mFAILED[0m], unexpected state: ' + state);
				error = true;
			}
			if (typeof expected_change !== 'undefined' && (typeof change === 'undefined' || change.getTime() !== expected_change.getTime())) {
				sys.puts('    [[1;31mFAILED[0m], mismatch of date=' + state[1]);
				error = true;
			}

			total_tests++;
			if (!error)
				successfull_tests++;
		}
	}
}
