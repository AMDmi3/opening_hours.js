var opening_hours = require('./opening_hours.js');

var tests = 3;
var iterations = 40000;

var test_value = 'Mo,Tu,Th,Fr 12:00-18:00; Sa 12:00-17:00; Th[3] off; Th[-1] off';

console.log('Construction:');
for (var t = 0; t < tests; t++) {
	var before = new Date();
	for (var i = 0; i < iterations; i++)
		var oh = new opening_hours(test_value);
	var delta = (new Date()).getTime() - before.getTime();

	console.log(iterations + ' iterations, ' + delta + ' ms (' + (iterations/delta*1000).toFixed(2) + ' n/sec)');
}

iterations = 20000;

console.log('Checking:');
for (var t = 0; t < tests; t++) {
	var oh = new opening_hours(test_value);
	var before = new Date();
	for (var i = 0; i < iterations; i++)
		oh.getOpenIntervals(new Date('2012.01.01 00:00'), new Date('2012.01.07 00:00'));
	var delta = (new Date()).getTime() - before.getTime();

	console.log(iterations + ' iterations, ' + delta + ' ms (' + (iterations/delta*1000).toFixed(2) + ' n/sec)');
}
