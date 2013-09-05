var opening_hours = require('./opening_hours.js');

var test = new opening_hours_test();

test.addTest('Time intervals', [
		'10:00-12:00',
		'10:00-12:00;',
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
	], 1000 * 60 * 60 * 2 * 7, 0, true);

test.addTest('Time intervals', [
		'24/7; Mo 15:00-16:00 off',
		'00:00-24:00; Mo 15:00-16:00 off',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 00:00', '2012.10.01 15:00' ],
		[ '2012.10.01 16:00', '2012.10.08 00:00' ],
	], 1000 * 60 * 60 * (24 * 6 + 23), 0, true);

test.addTest('sunrise, sunset (current implementation uses fix times)', [
		'Mo sunrise-sunset',
		'sunrise-18:00',
		'06:00-18:00',
	], '2012.10.01 0:00', '2012.10.02 0:00', [
		[ '2012.10.01 06:00', '2012.10.01 18:00' ],
	], 1000 * 60 * 60 * 12, 0, true);

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
	], 1000 * 60 * 60 * 4 * 7, 0, true);

test.addTest('Time ranges spanning midnight with date overwriting', [
		'22:00-02:00; Tu 12:00-14:00',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
        [ '2012.10.01 00:00', '2012.10.01 02:00' ],
        [ '2012.10.01 22:00', '2012.10.02 00:00' ],
        [ '2012.10.02 12:00', '2012.10.02 14:00' ],
        [ '2012.10.03 00:00', '2012.10.03 02:00' ],
        [ '2012.10.03 22:00', '2012.10.04 02:00' ],
        [ '2012.10.04 22:00', '2012.10.05 02:00' ],
        [ '2012.10.05 22:00', '2012.10.06 02:00' ],
        [ '2012.10.06 22:00', '2012.10.07 02:00' ],
        [ '2012.10.07 22:00', '2012.10.08 00:00' ],
	], 1000 * 60 * 60 * (6 * 4 + 2), 0, true);

test.addTest('Weekdays', [
		'Mo,Th,Sa,Su 10:00-12:00',
		'Mo,Th,Sa-Su 10:00-12:00',
		'Th,Sa-Mo 10:00-12:00',
		'10:00-12:00; Tu-We 00:00-24:00 off; Fr 00:00-24:00 off',
		'10:00-12:00; Tu-We off; Fr off',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 12:00' ],
		[ '2012.10.04 10:00', '2012.10.04 12:00' ],
		[ '2012.10.06 10:00', '2012.10.06 12:00' ],
		[ '2012.10.07 10:00', '2012.10.07 12:00' ],
	], 1000 * 60 * 60 * 2 * 4, 0, true);

test.addTest('Omitted time', [
		'Mo,We',
		'Mo-We; Tu off',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 0:00', '2012.10.02 0:00' ],
		[ '2012.10.03 0:00', '2012.10.04 0:00' ],
	], 1000 * 60 * 60 * 24 * 2, 0, true);

test.addTest('Time ranges spanning midnight w/weekdays', [
		'We 22:00-02:00',
		'We 22:00-26:00',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.03 22:00', '2012.10.04 02:00' ],
	], 1000 * 60 * 60 * 4, 0, true);

test.addTest('Full range', [
		'00:00-24:00',
		'Mo-Su 00:00-24:00',
		'Tu-Mo 00:00-24:00',
		'We-Tu 00:00-24:00',
		'Th-We 00:00-24:00',
		'Fr-Th 00:00-24:00',
		'Sa-Fr 00:00-24:00',
		'Su-Sa 00:00-24:00',
		'24/7',
		'Jan-Dec',       // week stable actually, but check for that needs extra logic
		'Feb-Jan',       // week stable actually, but check for that needs extra logic
		'Jan 01-Dec 31', // week stable actually, but check for that needs extra logic
		'week 1-54',     // week stable actually, but check for that needs extra logic
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 0:00', '2012.10.08 0:00' ],
	], 1000 * 60 * 60 * 24 * 7, 0, undefined);

test.addTest('24/7 as time interval alias', [
		'Mo,We 24/7',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 0:00', '2012.10.02 0:00' ],
		[ '2012.10.03 0:00', '2012.10.04 0:00' ],
	], 1000 * 60 * 60 * 24 * 2, 0, true);

test.addTest('Constrained weekdays', [
		'We[4,5] 10:00-12:00',
		'We[4-5] 10:00-12:00',
		'We[4],We[5] 10:00-12:00',
		'We[4] 10:00-12:00; We[-1] 10:00-12:00',
		'We[-1,-2] 10:00-12:00',
	], '2012.10.01 0:00', '2012.11.01 0:00', [
		[ '2012.10.24 10:00', '2012.10.24 12:00' ],
		[ '2012.10.31 10:00', '2012.10.31 12:00' ],
	], 1000 * 60 * 60 * 2 * 2, 0, false);

test.addTest('Exception rules', [
		'Mo-Fr 10:00-16:00; We 12:00-18:00'
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 16:00' ],
		[ '2012.10.02 10:00', '2012.10.02 16:00' ],
		[ '2012.10.03 12:00', '2012.10.03 18:00' ], // Not 10:00-18:00
		[ '2012.10.04 10:00', '2012.10.04 16:00' ],
		[ '2012.10.05 10:00', '2012.10.05 16:00' ],
	], 1000 * 60 * 60 * 6 * 5, 0, true);

test.addTest('Additional rules', [
		ignored('Mo-Fr 10:00-16:00, We 12:00-18:00'),
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 16:00' ],
		[ '2012.10.02 10:00', '2012.10.02 16:00' ],
		[ '2012.10.03 10:00', '2012.10.03 18:00' ],
		[ '2012.10.04 10:00', '2012.10.04 16:00' ],
		[ '2012.10.05 10:00', '2012.10.05 16:00' ],
	], 1000 * 60 * 60 * (6 * 5 + 2), 0, true);

test.addTest('Month ranges', [
		'Nov-Feb 00:00-24:00',
		'Nov-Feb: 00:00-24:00',
		'Jan,Feb,Nov,Dec 00:00-24:00',
		'00:00-24:00; Mar-Oct off',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.01 00:00', '2012.03.01 00:00' ],
		[ '2012.11.01 00:00', '2013.01.01 00:00' ],
	], 1000 * 60 * 60 * 24 * (31 + 29 + 30 + 31), 0, false);

test.addTest('Week ranges', [
		'week 1,3 00:00-24:00',
		'week 1,3: 00:00-24:00',
		'week 1-3/2 00:00-24:00',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.01 00:00', '2012.01.02 00:00' ],
		[ '2012.01.09 00:00', '2012.01.16 00:00' ],
	], 1000 * 60 * 60 * 24 * (1 + 7), 0, false);

test.addTest('Week ranges', [
		'week 2,4 00:00-24:00',
		'week 2-4/2 00:00-24:00',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.02 00:00', '2012.01.09 00:00' ],
		[ '2012.01.16 00:00', '2012.01.23 00:00' ],
	], 1000 * 60 * 60 * 24 * (7 + 7), 0, false);

test.addTest('Week range limit', [
		'week 2-54 00:00-24:00',
		'week 2-54: 00:00-24:00',
		'week 2-57',
	], '2012.01.01 0:00', '2014.01.01 0:00', [
		[ '2012.01.02 00:00', '2013.01.01 00:00' ],
		[ '2013.01.07 00:00', '2014.01.01 00:00' ],
	], 1000 * 60 * 60 * 24 * 724, 0, false);

test.addTest('Monthday ranges', [
		'Jan 23-31 00:00-24:00; Feb 1-12 00:00-24:00',
		'Jan 23-Feb 12 00:00-24:00',
		'Jan 23-Feb 12: 00:00-24:00',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.23 0:00', '2012.02.13 00:00' ],
	], 1000 * 60 * 60 * 24 * 21, 0, false);

test.addTest('Monthday ranges (with year)', [
		'2012 Jan 23-31 00:00-24:00; Feb 1-12 00:00-24:00 2012',
	], '2012.01.01 0:00', '2015.01.01 0:00', [
		[ '2012.01.23 0:00', '2012.02.13 00:00' ],
	], 1000 * 60 * 60 * 24 * 21, 0, false);

test.addTest('Monthday ranges spanning year boundary', [
		'Dec 31-Jan 01',
	], '2012.01.01 0:00', '2014.01.01 0:00', [
		[ '2012.01.01 0:00', '2012.01.02 00:00' ],
		[ '2012.12.31 0:00', '2013.01.02 00:00' ],
		[ '2013.12.31 0:00', '2014.01.01 00:00' ],
	], 1000 * 60 * 60 * 24 * 4, 0, false);

test.addTest('Full date (with year)', [
		'2013 Dec 31,2014 Jan 5',
		'2013 Dec 31;2014 Jan 5',
		'2013-2013 Dec 31;2014-2014 Jan 5', // force to use parseYearRange
		// '2013-2013 Dec 31,2014 Jan 5',   // FIXME: infinite loop
	], '2011.01.01 0:00', '2015.01.01 0:00', [
		[ '2013.12.31 00:00', '2014.01.01 00:00' ],
		[ '2014.01.05 00:00', '2014.01.06 00:00' ],
	], 1000 * 60 * 60 * 24 * 2, 0, false);

test.addTest('Date range which only applies for one year', [
		'2013 Dec 31',
		'2013 Dec 31;2014 Jan 5; 2014/1 off',
	], '2011.01.01 0:00', '2015.01.01 0:00', [
		[ '2013.12.31 0:00', '2014.01.01 00:00' ],
	], 1000 * 60 * 60 * 24, 0, false);

test.addTest('Monthday (with year) ranges spanning year boundary', [
		'2013 Dec 31-2014 Jan 02',
		'24/7; 2010 Jan 01-2013 Dec 30 off; 2014 Jan 03-2016 Jan 01 off',
	], '2011.01.01 0:00', '2015.01.01 0:00', [
		[ '2013.12.31 0:00', '2014.01.03 00:00' ],
	], 1000 * 60 * 60 * 24 * 3, 0, false);

test.addTest('Date range which only applies for specific year', [
		'2013,2015,2050-2053,2055/2,2020-2029/3,2060/1 Jan 1',
		'2013,2015,2050-2053,2055/2,2020-2029/3,2060/1 Jan 1 Mo-Su',
	], '2011.01.01 0:00', '2065.01.01 0:00', [
		[ '2013.01.01 00:00', '2013.01.02 00:00' ],
		[ '2015.01.01 00:00', '2015.01.02 00:00' ],
		[ '2020.01.01 00:00', '2020.01.02 00:00' ],
		[ '2023.01.01 00:00', '2023.01.02 00:00' ],
		[ '2026.01.01 00:00', '2026.01.02 00:00' ],
		[ '2029.01.01 00:00', '2029.01.02 00:00' ],
		[ '2050.01.01 00:00', '2050.01.02 00:00' ],
		[ '2051.01.01 00:00', '2051.01.02 00:00' ],
		[ '2052.01.01 00:00', '2052.01.02 00:00' ],
		[ '2053.01.01 00:00', '2053.01.02 00:00' ],
		[ '2055.01.01 00:00', '2055.01.02 00:00' ],
		[ '2057.01.01 00:00', '2057.01.02 00:00' ],
		[ '2059.01.01 00:00', '2059.01.02 00:00' ],
		[ '2060.01.01 00:00', '2060.01.02 00:00' ],
		[ '2061.01.01 00:00', '2061.01.02 00:00' ],
		[ '2062.01.01 00:00', '2062.01.02 00:00' ],
		[ '2063.01.01 00:00', '2063.01.02 00:00' ],
		[ '2064.01.01 00:00', '2064.01.02 00:00' ],
	], 1000 * 60 * 60 * 24 * 18, 0, false);

test.addTest('Periodical monthdays', [
		'Jan 01-31/8 00:00-24:00',
		'Jan 01-31/8: 00:00-24:00',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.01 0:00', '2012.01.02 00:00' ],
		[ '2012.01.09 0:00', '2012.01.10 00:00' ],
		[ '2012.01.17 0:00', '2012.01.18 00:00' ],
		[ '2012.01.25 0:00', '2012.01.26 00:00' ],
	], 1000 * 60 * 60 * 24 * 4, 0, false);

test.addTest('Periodical monthdays', [
		'Jan 10-31/7',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.10 0:00', '2012.01.11 00:00' ],
		[ '2012.01.17 0:00', '2012.01.18 00:00' ],
		[ '2012.01.24 0:00', '2012.01.25 00:00' ],
		[ '2012.01.31 0:00', '2012.02.01 00:00' ],
	], 1000 * 60 * 60 * 24 * 4, 0, false);

test.addTest('Selector order', [ // result should not depend on selector order
		'Feb week 6',
		'week 6 Feb',
		'00:00-24:00 week 6 Feb',
		'week 6 00:00-24:00 Feb',
		'week 6 Feb 00:00-24:00',
		'week 6 Feb Mo-Su 00:00-24:00',
		'Mo-Su week 6 Feb 00:00-24:00',
		'00:00-24:00 Mo-Su week 6 Feb',
		'00:00-24:00 week 6 Mo-Su Feb',
		'Mo-Su 00:00-24:00 week 6 Feb',
		'2012 00:00-24:00 week 6 Feb',
		'00:00-24:00 2012 week 6 Feb',
		'week 6 Feb 2012-2014',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.02.01 0:00', '2012.02.06 00:00' ],
	], 1000 * 60 * 60 * 24 * 5, 0, false);

test.addTest('Selector order', [
		'Feb week 7',
		'week 7 Feb',
		'week 7 Feb 24/7',
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.02.06 0:00', '2012.02.13 00:00' ],
	], 1000 * 60 * 60 * 24 * 7, 0, false);

test.addTest('Input tolerance: case and whitespace', [
		'   mo,    Tu, wE,   TH    12:00 - 20:00  ; 14:00-16:00    Off  ',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 12:00', '2012.10.01 14:00' ],
		[ '2012.10.01 16:00', '2012.10.01 20:00' ],
		[ '2012.10.02 12:00', '2012.10.02 14:00' ],
		[ '2012.10.02 16:00', '2012.10.02 20:00' ],
		[ '2012.10.03 12:00', '2012.10.03 14:00' ],
		[ '2012.10.03 16:00', '2012.10.03 20:00' ],
		[ '2012.10.04 12:00', '2012.10.04 14:00' ],
		[ '2012.10.04 16:00', '2012.10.04 20:00' ],
	], 1000 * 60 * 60 * 6 * 4, 0, true);

test.addTest('Input tolerance: dot as time separator', [
		'10.00-12.00',
		'10.00-11.00,11.00-12.00',
		'10.00-11.00;11.00-12.00',
		'10.00-14.00;12.00-14.00 off',
		'10.00-12.00;10.30-11.30',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 12:00' ],
		[ '2012.10.02 10:00', '2012.10.02 12:00' ],
		[ '2012.10.03 10:00', '2012.10.03 12:00' ],
		[ '2012.10.04 10:00', '2012.10.04 12:00' ],
		[ '2012.10.05 10:00', '2012.10.05 12:00' ],
		[ '2012.10.06 10:00', '2012.10.06 12:00' ],
		[ '2012.10.07 10:00', '2012.10.07 12:00' ],
	], 1000 * 60 * 60 * 2 * 7, 0, true);

test.addTest('Extensions: complex monthday ranges', [
		'Jan 23-31,Feb 1-12 00:00-24:00',
		'Jan 23-Feb 11,Feb 12 00:00-24:00', //
		ignored('Jan 23-30,31-Feb 1-2,3-12 12 00:00-24:00'), // FIXME: What should the ending '12' mean?
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.23 0:00', '2012.02.13 00:00' ],
	], 1000 * 60 * 60 * 24 * 21, 0, false);

test.addTest('Extensions: missing time range separators', [
		'Mo 12:00-14:00 16:00-18:00 20:00-22:00',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 12:00', '2012.10.01 14:00' ],
		[ '2012.10.01 16:00', '2012.10.01 18:00' ],
		[ '2012.10.01 20:00', '2012.10.01 22:00' ],
	], 1000 * 60 * 60 * 6, 0, true);

test.addTest('Selector combination', [
		'week 3 We',            // week + weekday
		'week 3 Jan 11-Jan 11', // week + monthday
		'week 3 Jan 11',        // week + monthday
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.11 0:00', '2012.01.12 00:00' ],
	], 1000 * 60 * 60 * 24, 0, false);

test.addTest('Selector combination', [
		'week 3 Jan',           // week + month
		'Jan-Feb Jan 9-Jan 15', // month + monthday
		'Jan-Feb Jan 9-15',     // month + monthday
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.09 0:00', '2012.01.16 00:00' ],
	], 1000 * 60 * 60 * 24 * 7, 0, false);

test.addTest('Selector combination', [
		'Jan We',           // month + weekday
		'Jan 2-27 We',      // weekday + monthday
		'Dec 30-Jan 27 We', // weekday + monthday
	], '2012.01.01 0:00', '2013.01.01 0:00', [
		[ '2012.01.04 0:00', '2012.01.05 00:00' ],
		[ '2012.01.11 0:00', '2012.01.12 00:00' ],
		[ '2012.01.18 0:00', '2012.01.19 00:00' ],
		[ '2012.01.25 0:00', '2012.01.26 00:00' ],
	], 1000 * 60 * 60 * 24 * 4, 0, false);

test.addTest('Additional comments', [
		'Mo,Tu 10:00-16:00 open "no warranty"; We 12:00-18:00 open "female only"; Th closed "Not open because we are coding :)"; Fr 10:00-16:00 open "male only"; Sa 10:00-12:00 "Maybe open. Call us."',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 16:00', false, "no warranty" ],
		[ '2012.10.02 10:00', '2012.10.02 16:00', false, "no warranty" ],
		[ '2012.10.03 12:00', '2012.10.03 18:00', false, "female only" ],
		[ '2012.10.05 10:00', '2012.10.05 16:00', false, "male only" ],
		[ '2012.10.06 10:00', '2012.10.06 12:00', true, "Maybe open. Call us." ],
	], 1000 * 60 * 60 * 6 * 4, 1000 * 60 * 60 * 2, true);

test.addTest('Additional comments for unknown', [
		'Sa 10:00-12:00 "Maybe open. Call us."',
		'Sa 10:00-12:00 unknown "Maybe open. Call us."',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.06 10:00', '2012.10.06 12:00', true, "Maybe open. Call us." ],
	], 0, 1000 * 60 * 60 * 2, true);

test.addTest('Date overwriting with additional comments for unknown ', [
		'Mo-Fr 10:00-20:00 unknown "Maybe"; We 10:00-16:00 "Maybe open. Call us."',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 10:00', '2012.10.01 20:00', true, "Maybe" ],
		[ '2012.10.02 10:00', '2012.10.02 20:00', true, "Maybe" ],
		[ '2012.10.03 10:00', '2012.10.03 16:00', true, "Maybe open. Call us." ],
		[ '2012.10.04 10:00', '2012.10.04 20:00', true, "Maybe" ],
		[ '2012.10.05 10:00', '2012.10.05 20:00', true, "Maybe" ],
	], 0, 1000 * 60 * 60 * (4 * 10 + 6), true);

test.addTest('Additional comments with time ranges spanning midnight', [
		'22:00-02:00 open "Lets party"; We 12:00-14:00 "Maybe open. Call us."',
		'22:00-26:00; We 12:00-14:00 unknown "Maybe open. Call us."',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 00:00', '2012.10.01 02:00', false, "Lets party" ],
		[ '2012.10.01 22:00', '2012.10.02 02:00', false, "Lets party" ],
		[ '2012.10.02 22:00', '2012.10.03 00:00', false, "Lets party" ],
		[ '2012.10.03 12:00', '2012.10.03 14:00', true, "Maybe open. Call us." ],
		[ '2012.10.04 00:00', '2012.10.04 02:00', false, "Lets party" ],
		[ '2012.10.04 22:00', '2012.10.05 02:00', false, "Lets party" ],
		[ '2012.10.05 22:00', '2012.10.06 02:00', false, "Lets party" ],
		[ '2012.10.06 22:00', '2012.10.07 02:00', false, "Lets party" ],
		[ '2012.10.07 22:00', '2012.10.08 00:00', false, "Lets party" ],
	], 1000 * 60 * 60 * 4 * 6, 1000 * 60 * 60 * 2, true);

test.addTest('Additional comments for closed with time ranges spanning midnight', [
		'22:00-26:00; We 12:00-14:00 off "Not open because we are too tired"',
		'22:00-26:00; We 12:00-14:00 closed "Not open because we are too tired"',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 00:00', '2012.10.01 02:00' ],
		[ '2012.10.01 22:00', '2012.10.02 02:00' ],
		[ '2012.10.02 22:00', '2012.10.03 02:00' ],
		[ '2012.10.03 22:00', '2012.10.04 02:00' ],
		[ '2012.10.04 22:00', '2012.10.05 02:00' ],
		[ '2012.10.05 22:00', '2012.10.06 02:00' ],
		[ '2012.10.06 22:00', '2012.10.07 02:00' ],
		[ '2012.10.07 22:00', '2012.10.08 00:00' ],
	], 1000 * 60 * 60 * 4 * 7, 0, true);

test.addTest('Complex example used in README', [
		'00:00-24:00; Tu-Su 8:30-9:00 off; Tu-Su 14:00-14:30 off; Mo 08:00-13:00 off',
	], '2012.10.01 0:00', '2012.10.08 0:00', [
		[ '2012.10.01 00:00', '2012.10.01 08:00' ],
		[ '2012.10.01 13:00', '2012.10.02 08:30' ],
		[ '2012.10.02 09:00', '2012.10.02 14:00' ],
		[ '2012.10.02 14:30', '2012.10.03 08:30' ],
		[ '2012.10.03 09:00', '2012.10.03 14:00' ],
		[ '2012.10.03 14:30', '2012.10.04 08:30' ],
		[ '2012.10.04 09:00', '2012.10.04 14:00' ],
		[ '2012.10.04 14:30', '2012.10.05 08:30' ],
		[ '2012.10.05 09:00', '2012.10.05 14:00' ],
		[ '2012.10.05 14:30', '2012.10.06 08:30' ],
		[ '2012.10.06 09:00', '2012.10.06 14:00' ],
		[ '2012.10.06 14:30', '2012.10.07 08:30' ],
		[ '2012.10.07 09:00', '2012.10.07 14:00' ],
		[ '2012.10.07 14:30', '2012.10.08 00:00' ],
	], 1000 * 60 * 60 * (24 * 7 - 5 - 0.5 * 6 - 0.5 * 6), 0, true);

test.addTest('Complex example used in README and benchmark', [
		'Mo,Tu,Th,Fr 12:00-18:00;Sa 12:00-17:00; Th[3] off; Th[-1] off',
	], '2012.10.01 0:00', '2012.10.31 0:00', [
		[ '2012.10.01 12:00', '2012.10.01 18:00' ],
		[ '2012.10.02 12:00', '2012.10.02 18:00' ],
		[ '2012.10.04 12:00', '2012.10.04 18:00' ],
		[ '2012.10.05 12:00', '2012.10.05 18:00' ],
		[ '2012.10.06 12:00', '2012.10.06 17:00' ],
		[ '2012.10.08 12:00', '2012.10.08 18:00' ],
		[ '2012.10.09 12:00', '2012.10.09 18:00' ],
		[ '2012.10.11 12:00', '2012.10.11 18:00' ],
		[ '2012.10.12 12:00', '2012.10.12 18:00' ],
		[ '2012.10.13 12:00', '2012.10.13 17:00' ],
		[ '2012.10.15 12:00', '2012.10.15 18:00' ],
		[ '2012.10.16 12:00', '2012.10.16 18:00' ],
		[ '2012.10.19 12:00', '2012.10.19 18:00' ],
		[ '2012.10.20 12:00', '2012.10.20 17:00' ],
		[ '2012.10.22 12:00', '2012.10.22 18:00' ],
		[ '2012.10.23 12:00', '2012.10.23 18:00' ],
		[ '2012.10.26 12:00', '2012.10.26 18:00' ],
		[ '2012.10.27 12:00', '2012.10.27 17:00' ],
		[ '2012.10.29 12:00', '2012.10.29 18:00' ],
		[ '2012.10.30 12:00', '2012.10.30 18:00' ],
	], 1000 * 60 * 60 * (6 * 16 + 5 * 4), 0, false);

test.addShouldFail('Incorrect syntax which should throw an error', [
		'sdasdlasdj a3reaw', // Test for the test framwork. This test should pass :)
		':week 2-54 00:00-24:00',
		':::week 2-54 00:00-24:00',
		'week :2-54 00:00-24:00',
		'week 2-54 00:00-24:00:',
		'week 2-54 00:00-24:00:::',
		'week 2-54 00::00-24:00',
		'2013,2015,2050-2053,2055/2,2020-2029/3,2060-2065/1 Jan 1',
		'', // empty string
		';', // only rule delimiter
		' ', // empty string
		"\n", // newline
	]);

process.exit(test.run() ? 0 : 1);

//======================================================================
// Test framework
//======================================================================
function opening_hours_test() {
	var tests = [];
	var tests_should_fail = [];

	function runSingleTestShouldFail(name, value) {
		try {
			oh = new opening_hours(value);

			crashed = false;
		} catch (err) {
			crashed = err;
		}

		var passed = false;
		var str = '"' + name + '" for "' + value + '": ';
		if (crashed) {
			str += '[1;32mPASSED[0m';
			passed = true;
		} else {
			str += '[1;31mFAILED[0m';
		}

		console.log(str);
		return crashed;
	}

	function runSingleTest(name, value, from, to, expected_intervals, expected_durations, expected_weekstable) {
		var ignored = typeof value !== 'string';
		if (ignored) {
			ignored = value[1];
			value   = value[0];
		}

		var oh, intervals, durations, weekstable, intervals_ok, duration_ok, weekstable_ok, crashed = true;

		try {
			oh = new opening_hours(value);

			intervals  = oh.getOpenIntervals(new Date(from), new Date(to));
			durations  = oh.getOpenDuration(new Date(from), new Date(to));
			weekstable = oh.isWeekStable();

			intervals_ok  = typeof expected_intervals  === 'undefined' || intervals.length == expected_intervals.length;
			duration_ok   = (typeof expected_durations[0] === 'undefined' || durations[0] === expected_durations[0])
				&& (typeof expected_durations[1] === 'undefined' || durations[1] === expected_durations[1]);
			weekstable_ok = typeof expected_weekstable === 'undefined' || weekstable === expected_weekstable;

			crashed = false;
		} catch (err) {
			crashed = err;
		}

		if (intervals_ok) {
			for (var interval = 0; interval < intervals.length; interval++) {
				var expected_from = new Date(expected_intervals[interval][0]);
				var expected_to   = new Date(expected_intervals[interval][1]);

				if (intervals[interval][0].getTime() != expected_from.getTime()
						|| intervals[interval][1].getTime() != expected_to.getTime()
						|| (typeof intervals[interval][2] !== 'undefined'
							&& intervals[interval][2] !== expected_intervals[interval][2])
						|| (typeof intervals[interval][3] !== 'undefined'
							&& intervals[interval][3] !== expected_intervals[interval][3])
						)
					intervals_ok = false;
			}
		}

		var passed = false;
		var str = '"' + name + '" for "' + value + '": ';
		if (intervals_ok && duration_ok && weekstable_ok) {
			str += '[1;32mPASSED[0m';
			if (ignored)
				str += ', [1;33malso ignored, please unignore since the test passes![0m';
			passed = true;
		} else if (ignored) {
			str += '[1;33mIGNORED[0m, reason: ' + ignored;
			passed = true;
		} else if (crashed) {
			str += '[1;35mCRASHED[0m, reason: ' + crashed;
		} else {
			str += '[1;31mFAILED[0m';
			if (!duration_ok)
				str += ', bad duration(s): ' + durations + ', expected ' + expected_durations;
			if (!intervals_ok)
				str += ', bad intervals: \n' + intervalsToString(intervals) + '\nexpected:\n' + intervalsToString(expected_intervals);
			if (!weekstable_ok)
				str += ', bad weekstable flag: ' + weekstable + ', expected ' + expected_weekstable;
		}

		console.log(str);
		return passed;
	}

	function intervalsToString(intervals) {
		var res = '';

		if (intervals.length == 0)
			return '(none)';

		for (var interval = 0; interval < intervals.length; interval++) {
			var item = intervals[interval];
			var from = formatDate(item[0]);
			var to   = formatDate(item[1]);
			var comment = typeof item[3] !== 'undefined' ? '"' + item[3] + '"' : item[3];

			if (interval != 0)
				res += '\n';

			res += '[ \'' + from + '\', \'' + to + '\', ' + item[2] + ', ' + comment + ' ],';
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
		var tests_length = tests.length + tests_should_fail.length;
		var success = 0;
		for (var test = 0; test < tests.length; test++) {
			if (runSingleTest(tests[test][0], tests[test][1], tests[test][2], tests[test][3], tests[test][4], tests[test][5], tests[test][6]))
				success++;
		}
		for (var test = 0; test < tests_should_fail.length; test++) {
			if (runSingleTestShouldFail(tests_should_fail[test][0], tests_should_fail[test][1]))
				success++;
		}

		console.log(success + '/' + tests_length + ' tests passed');

		return success == tests_length;
	}

	this.addTest = function(name, values, from, to, expected_intervals, expected_duration, expected_unknown_duration, expected_weekstable) {
		for (var expected_interval = 0; expected_interval < expected_intervals.length; expected_interval++) {
			// Set default of unknown to false. If you expect something else you
			// will have to specify it.
			if (typeof expected_intervals[expected_interval][2] === 'undefined')
				expected_intervals[expected_interval][2] = false;
		}
		if (typeof values === 'string')
			tests.push([name, values, from, to, expected_intervals, [ expected_duration, expected_unknown_duration ], expected_weekstable]);
		else
			for (var value = 0; value < values.length; value++)
				tests.push([name, values[value], from, to, expected_intervals, [ expected_duration, expected_unknown_duration ], expected_weekstable]);
	}

	this.addShouldFail = function(name, values) {
		if (typeof values === 'string')
			tests_should_fail.push([name, values]);
		else
			for (var value = 0; value < values.length; value++)
				tests_should_fail.push([name, values[value]]);
	}
}

function ignored(value, reason) {
	if (typeof reason === 'undefined')
		reason = 'not implemented yet';
	return [ value, reason ];
}
