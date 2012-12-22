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

## Synopsis

```javascript
var oh = new opening_hours('We 12:00-14:00');

var from = new Date("01 Jan 2012");
var to = new Date("01 Feb 2012");

// high-level API
{
	var intervals = oh.getOpenIntervals(from, to);
	for (var i in intervals)
		console.log('We are open from ' + intervals[i][0] + ' till ' + intervals[i][1]);

	var duration_hours = oh.getOpenDuration(from, to) / 1000 / 60 / 60;
	console.log('For a given range, we are open for ' + duration_hours + ' hours');
}

// simple API
{
	var state = oh.getState(); // we use current date
	var nextchange = oh.getNextChange();

	console.log('Currently we\'re ' + (state ? 'open' : 'closed'));

	if (typeof nextchange === 'undefined')
		console.log('And we will never ' + (state ? 'close' : 'open'));
	else
		console.log('And we will ' + (state ? 'close' : 'open') + ' on ' + nextchange);
}

// iterator API
{
	var iterator = oh.getIterator(from);

	console.log('Initially, we\'re ' + (iterator.getState() ? 'open' : 'close'));

	while (iterator.advance(to))
		console.log('Then we ' + (iterator.getState() ? 'open' : 'close') +
			' at ' + iterator.getDate());

	console.log('Finally, at we\'re ' + (iterator.getState() ? 'open' : 'closed'));
}
```

## Library API

* ```javascript
  var oh = new opening_hours('We 12:00-14:00');
  ```

  Constructs opening_hours object, given the opening_hours tag value.

  Throws an error string if the expression is malformed or unsupported.

* ```javascript
  var every_week_is_same = oh.isWeekSame();
  ```

  Checks whether open intervals are same for every week. Useful for giving a user hint whether time table may change for another week.

### High-level API

Here and below, unless noted otherwise, all arguments are expected to be and all output will be in the form of Date objects.

* ```javascript
  var intervals = oh.getOpenIntervals(from, to);
  ```

  Returns array of open intervals in a given range, in a form of ```[ [ from1, to1 ], [ from2, to2 ], [ from3, to3 ] ]```

  Intervals are cropped with the input range.

* ```javascript
  var duration = oh.getOpenDuration(from, to);
  ```

  Returns duration for which the facility is open in a given date range, in milliseconds.

### Simple API

This API is useful for one-shot checks, but for iteration over intervals you should use more effecient **Iterator API**.

* ```javascript
  var is_open = oh.getState(date);
  ```

  Checks whether the facility is open at the given *date*. You may omit *date* to use current date.

* ```javascript
  var next_change = oh.getNextDate(date, limit);
  ```

  Returns date of next state change. You may omit *date* to use current date.

  Returns undefined if the next change cannot be found. This may happen if there's no such position (e.g. ```24/7```) or if seatch goes beyond *limit* (which is *date* + ~5 years if omitted).

### Iterator API

* ```javascript
  var iterator = oh.getIterator(date);
  ```

  Constructs an iterator which can go through open/close points, starting at *date*. You may omit *date* to use current date.

* ```javascript
  var current_date = iterator.getDate();
  ```

  Returns current iterator position.

* ```javascript
  var is_open = iterator.getState();
  ```

  Returns whether the facility is open at the current iterator position in time.

* ```javascript
  var next_change = iterator.getNextDate(limit);
  ```

  Returns date of next iterator position.

  Returns undefined if the next change cannot be found. This may happen if there's no such position (e.g. ```24/7```) or if seatch goes beyond *limit* (which is *date* + ~5 years if omitted).

* ```javascript
  var had_advanced = iterator.advance(limit);
  ```

  Advances an iterator to the next position, but not further that a *limit* (which is current position + ~5 years if omitted and is used to prevent infinite loop on non-pediodic opening_hours, e.g. ```24/7```), returns whether the iterator was moved.

  For instance, returns false if the iterator would go beyond *limit* or if there's no next position (```24/7``` case).

## Features

Almost everything from opening_hours definition is supported, as well as some extensions (indicated as **EXT:** below). For instance, the library is able to process 98% of opening_hours values from Russia OSM data.

* Opening hours consist of multiple rules separated by semicolon (```Mo 10:00-20:00; Tu 12:00-18:00```)
* Rule may use ```off``` keyword to indicate that the facility is closed at that time (```Mo-Fr 10:00-20:00; 12:00-14:00 off```)
* Rule consists of multiple date (```Mo-Fr```, ```Jan-Feb```, ```week 2-10```, ```Jan 10-Feb 10```) and time (```12:00-16:00```, ```12:00-14:00,16:00-18:00```) conditions
* If a rule's date condition overlap with previous rule, it overrides (as opposed to extends) the previous rule. E.g. ```Mo-Fr 10:00-16:00; We 12:00-18:00``` means that on Wednesday the facility is open from 12:00 till 18:00, not from 10:00 to 18:00.

### Time ranges ###

* Supports sets of time ranges (```10:00-12:00,14:00-16:00```)
  * *Doesn't support ranges wrapping over midnight (```10:00-26:00```, ```10:00-02:00```) correctly: wrapped interval goes to the same day, while it should go to the next one*
* Supports 24/7 keyword
  * **EXT:** 24/7 is handled as a synonym for ```00:00-24:00```, so ```Mo-Fr 24/7``` (though not really correct) it valid and will be handled correctly
* **EXT:** Supports omitting time range (```Mo-Fr; Tu off```)
* **EXT:** Supports dot as time separator, so ```12.00-16.00``` is valid (this is used quite widely)
* **EXT:** Supports space as time interval separator, i.e. ```Mo 12:00-14:00,16:00-20:00``` and ```Mo 12:00-14:00 16:00-20:00``` are the same thing
* *Doesn't support open end (```10:00+```)*
* *Doesn't support sunrise/sunset keywords (```10:00-sunset```)*

### Weekday ranges ###

* Supports set of weekdays and weekday ranges (```Mo-We,Fr```)
* Supports weekdays which wrap to the next week (```Fr-Mo```)
* Supports constrained weekdays (```Th[1,2-3]```, ```Fr[-1]```)

### Month ranges ###

* Supports set of months and month ranges (```Jan,Mar-Apr```)
* Supports months which wrap to the next year (```Dec-Jan```)

### Monthday ranges ###

* Supports monthday ranges across multiple months (```Jan 01-Feb 03 10:00-20:00```)
* Supports monthday ranges within single month (```Jan 01-26 10:00-20:00```), with periods as well ```Jan 01-29/7 10:00-20:00```)
* **EXT:** Supports multiple monthday ranges separated by a comma (```Jan 23-31/3,Feb 1-12,Mar 1```)

### Week ranges ###

* Supports week ranges (```week 04-07 10:00-20:00```)
* Supports periodic weeks (```week 2-53/2 10:00-20:00```)
* **EXT:** Supports multiple week ranges (```week 1,3-5,7-30/2 10:00-20:00```)

### Other ###

* *Doesn't support PH/SH keywords*

## Test ##

Simple node.js based test framework is bundled. You can run it with ```node test.js``` or with ```make test```.

## Performance ##

Simple node.js based benchmark is bundled. You can run it with ```node benchmark.js``` or with ```make benchmark```.

On author's Intel Core i5-2400 library allows ~20k/sec constructor calls and ~7.5k/sec openIntervals() calls with one week period. This may further improve in future.

## Author ##

* [Dmitry Marakasov](https://github.com/AMDmi3) <amdmi3@amdmi3.ru>

## License ##

* opening_hours.js is published under the New (2-clause) BSD license
