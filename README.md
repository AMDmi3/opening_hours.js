# opening_hours.js #

[opening_hours](http://wiki.openstreetmap.org/wiki/Key:opening_hours) tag is used in [OpenStreetMap](http://openstreetmap.org) project to describe time ranges when a specific facility (for example, a cafe) is open. As it has pretty complex syntax which require special parsing and additional processing to extract some useful information (e.g. whether a facility is open at specific time, next time it's going to open/close, or a readable set of working hours), this library was written.

Examples of some complex real-life opening_hours values:

```
Mo,Tu,Th,Fr 12:00-18:00;Sa 12:00-17:00; Th[3] off; Th[-1] off
```

a library which works from 12:00 to 18:00 on workdays except Wednesday, and from 12:00 to 17:00 on Saturday. It also has breaks on third and last Thursday of each month.

```
00:00-24:00; Tu-Su 8:30-9:00 off; Tu-Su 14:00-14:30 off; Mo 08:00-13:00 off
```

around-the-clock shop with some breaks.

## Library API

```javascript
// constructor takes opening_hours tag value
var oh = new opening_hours('Mo-Fr 12:00-14:00');

// you can feed any date to library functions
// here we take current date, but for the same result you may just omit date argument
var now = new Date();

// check whether the facility is `open' at the given date
var state_msg = 'The facility is now ' + oh.isOpen(now) ? 'open' : 'close';

// get the date of the closest status change (opening or closing)
var next_msg = 'And that will change on' + oh.nextChange(now);

// let us use another date, 1 day from now to the future
var then = new Date(now); then.setDate(then.getDate() + 1);

// get array of open intervals for a given date range
var intervals = oh.openIntervals(now, then);
for (var i in intervals)  {
	var interval_msg = 'We are open from ' + intervals[i][0] + ' till ' + intervals[i][1];
}

// get a open duration for a given date range
var duration_msg = 'We are open for ' + oh.openDuraton(now, then) + ' milliseconds today';
```

## Features

This library is on the early stage of development, so only the most basic opening_hours features are supported. Still, these should cover larger part of real-world data.

### General rules ###

* Supports multiple rules separated by semicolon (```Mo 10:00-20:00; Tu 12:00-18:00```)
* Supports off keyword (```Mo-Fr 10:00-20:00; 12:00-14:00 off```)
* Handles exception rules correctly, e.g ```Mo-Fr 10:00-16:00; We 12:00-18:00``` is processed according to wiki, e.g. rule for Wednesday override, not extend previous rule

### Time ranges ###

* Supports set of simple time ranges (```10:00-12:00,14:00-16:00```)
* Supports 24/7 keyword (as a synonym for ```00:00-24:00```, so ```Mo-Fr 24/7```, though not correct, will be handled as intended)
* Supports omitting time range (```Mo-Fr; Tu off```)
* Doesn't support ranges wrapping over midnight (```10:00-26:00```, ```10:00-02:00```) correctly (wrapped interval goes to the *same* day, while it should go to the *next* one)
* Doesn't support open end (```10:00+```)
* Doesn't support sunrise/sunset keywords (```10:00-sunset```)

### Weekday ranges ###

* Supports set of weekdays and weekday ranges (```Mo-We,Fr```)
* Supports weekdays which wrap to the next week (```Fr-Mo```)
* Doesn't support constrained weekdays (```Th[1]```, ```Fr[-1]```)

### Month ranges ###

* Not supported (```10:00-20:00; Feb off```)

### Monthday ranges ###

* Not supported (```Jan 01-26 10:00-20:00```, ```Jan 01-Feb 03 10:00-20:00```)

### Week ranges ###

* Not supported (```week 04-07 10:00-20:00```, ```week 2-53/2 10:00-20:00```)

### Other ###

* Doesn't support PH/SH keywords

## Test ##

Simple node.js based test framework is bundled. You can run it with ```node test.js``` or with make.

## Author ##

* [Dmitry Marakasov](https://github.com/rodneyrehm) <amdmi3@amdmi3.ru>

## License ##

* opening_hours.js is published under the New (2-clause) BSD license
