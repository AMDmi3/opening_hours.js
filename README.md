# opening_hours.js #

[opening_hours](http://wiki.openstreetmap.org/wiki/Key:opening_hours) tag is used in [OpenStreetMap](http://openstreetmap.org) project to describe time ranges when a specific facility (for example, a café) is open. As it has pretty complex syntax which require special parsing and additional processing to extract some useful information (e.g. whether a facility is open at specific time, next time it's going to open/close, or a readable set of working hours), this library was written.

Examples of some complex real-life opening_hours values:

```
Mo,Tu,Th,Fr 12:00-18:00; Sa 12:00-17:00; Th[3],Th[-1] off
```

a library which works from 12:00 to 18:00 on workdays except Wednesday, and from 12:00 to 17:00 on Saturday. It also has breaks on third and last Thursday of each month.

```
00:00-24:00; Tu-Su 08:30-09:00 off; Tu-Su 14:00-14:30 off; Mo 08:00-13:00 off
```

around-the-clock shop with some breaks.

## evaluation tool/demo.html ##

Please have a look at the [evaluation tool][] which can give you an impression how this library can be used and what it is capable of.

[evaluation tool]: http://openingh.openstreetmap.de/evaluation_tool/

## Install ##

### For Developer ###
Just clone the repository:

```Shell
git clone --recursive https://github.com/ypid/opening_hours.js.git
```

and install it’s dependencies (execute inside the repository):
```Shell
npm install
```

### Web developer ###

If you are a web developer and want to use this library you can do so by including the current version from here:

```
http://openingh.openstreetmap.de/evaluation_tool/opening_hours.js
```

However, before you load opening_hours.js you have to load its dependencies (either from here or somewhere else):

```
http://openingh.openstreetmap.de/evaluation_tool/node_modules/suncalc/suncalc.js
```

### NodeJS developer ###

This library is packaged with npm and is available under the name [opening_hours](https://www.npmjs.org/package/opening_hours) so you should have no problems using it.

## Synopsis ##

```javascript
var oh = new opening_hours('We 12:00-14:00');

var from = new Date("01 Jan 2012");
var to   = new Date("01 Feb 2012");

// high-level API
{
	var intervals = oh.getOpenIntervals(from, to);
	for (var i in intervals)
		console.log('We are ' + (intervals[i][2] ? 'maybe ' : '')
			+ 'open from ' + (intervals[i][3] ? '("' + intervals[i][3] + '") ' : '')
			+ intervals[i][0] + ' till ' + intervals[i][1] + '.');

	var duration_hours = oh.getOpenDuration(from, to).map(function(x) { return x / 1000 / 60 / 60 });
	if (duration_hours[0])
		console.log('For the given range, we are open for ' + duration_hours[0] + ' hours');
	if (duration_hours[1])
		console.log('For the given range, we are maybe open for ' + duration_hours[1] + ' hours');
}

// helper function
function getReadableState(startString, endString, oh, past) {
	if (past === true) past = 'd';
	else past = '';

	var output = '';
	if (oh.getUnknown()) {
		output += ' maybe open'
			+ (oh.getComment() ? ' but that depends on: "' + oh.getComment() + '"' : '');
	} else {
		output += ' ' + (oh.getState() ? 'open' : 'close' + past)
			+ (oh.getComment() ? ', comment "' + oh.getComment() + '"' : '');
	}
	return startString + output + endString + '.';
}

// simple API
{
	var state      = oh.getState(); // we use current date
	var unknown    = oh.getUnknown();
	var comment    = oh.getComment();
	var nextchange = oh.getNextChange();

	console.log(getReadableState('We\'re', '', oh, true));

	if (typeof nextchange === 'undefined')
		console.log('And we will never ' + (state ? 'close' : 'open'));
	else
		console.log('And we will '
			+ (oh.getUnknown(nextchange) ? 'maybe ' : '')
			+ (state ? 'close' : 'open') + ' on ' + nextchange);
}

// iterator API
{
	var iterator = oh.getIterator(from);

	console.log(getReadableState('Initially, we\'re', '', iterator, true));

	while (iterator.advance(to))
		console.log(getReadableState('Then we', ' at ' + iterator.getDate(), iterator));

	console.log(getReadableState('And till the end we\'re', '', iterator, true));
}
```

## Library API ##

* ```javascript
  var oh = new opening_hours('We 12:00-14:00', nominatiomJSON, mode);
  ```

  * value (mandadory): Constructs opening_hours object, given the opening_hours tag value.

  Throws an error string if the expression is malformed or unsupported.

  * nominatiomJSON (optional): In order to calculate the correct times for variable times (e.g. sunrise, dusk, see under [Time ranges][ohlib.time-ranges]) the coordinates are needed. To apply the correct holidays (PH) and school holidays (SH) the country code and the state is needed. The only thing you as programmer need to know are the coordinates or preferably the OSM id (for the node, way or relation) of the facility (where the opening hours do apply) anything else can be queried for using [reverse geocoding with Nominatim][Nominatim]. So just use as second parameter the returned JSON from [Nominatim][] (example URL: http://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=5&addressdetails=1) and you are good to go. Note that this second parameter is optional. The data returned by Nominatim should be in the local language (the language of the country for which the opening hours apply). If not *accept-language* can be used as parameter in the request URL.

  * mode (optional): In OSM, the syntax originally designed to describe opening hours is now used to describe a few other things as well. Some of those other tags work with points in time instead of time ranges. To support this the mode can be specified. If there is no mode specified, opening_hours.js will only operate with time ranges and will throw an error message when points in times are used in the value.

    * 0: time ranges (opening_hours, lit, …) default
    * 1: points in time
    * 2: both (time ranges and points in time, used by collection_times, service_times, …)

* ```javascript
  var warnings = oh.getWarnings();
  ```

  Get warnings which appeared during parsing as human readable string array. Every violation is described in one element of the array. Almost all warnings can be auto corrected and are probably interpreted as indented by the mapper. However, this is not a granite of course. The appearance of  warning means that the value has not been tested by the mapper.

  This function does also some additional testing and because of that it theoretically possible that this function throws an error like all other functions which go through time.


* ```javascript
  var prettified = oh.prettifyValue(conf);
  ```

  Return a prettified version of the opening_hours value. The value is generated by putting the tokens back together to a string.

  The function excepts one optional argument which must be a hash. This hash can hold configuration options. One example: ```{ block_sep_string: '\n', print_semicolon: false }```. Look in the source code if you need more.

* ```javascript
  var every_week_is_same = oh.isWeekStable();
  ```

  Checks whether open intervals are same for every week. Useful for giving a user hint whether time table may change for another week.

### High-level API ###

Here and below, unless noted otherwise, all arguments are expected to be and all output will be in the form of Date objects.

* ```javascript
  var intervals = oh.getOpenIntervals(from, to);
  ```

  Returns array of open intervals in a given range, in a form of ```[ [ from1, to1, unknown1, comment1 ], [ from2, to2, unknown2, comment2 ] ]```

  Intervals are cropped with the input range.

* ```javascript
  var duration = oh.getOpenDuration(from, to);
  ```

  Returns an array with two durations for a given date range, in milliseconds. The first element is the duration for which the facility is open and the second is the duration for which the facility is maybe open (unknown is used).

### Simple API ###

This API is useful for one-shot checks, but for iteration over intervals you should use the more efficient **Iterator API**.

* ```javascript
  var is_open = oh.getState(date);
  ```

  Checks whether the facility is open at the given *date*. You may omit *date* to use current date.

* ```javascript
  var unknown = oh.getUnknown(date);
  ```

  Checks whether the opening state is conditional or unknown at the given *date*. You may omit *date* to use current date.
  Conditions can be expressed in comments.
  If unknown is true then is_open will be false since it is not sure if it is open.

* ```javascript
  var state_string = oh.getStateString(date, past);
  ```

  Return state string at given *date*. Either 'open', 'unknown' or 'closed?'. You may omit *date* to use current date.

  If the boolean parameter `past` is true you will get 'closed' else you will get 'close'.

* ```javascript
  var comment = oh.getComment(date);
  ```

  Returns the comment (if one is specified) for the facility at the given *date*. You may omit *date* to use current date.
  Comments can be specified for any state.

  If no comment is specified this function will return undefined.

* ```javascript
  var next_change = oh.getNextChange(date, limit);
  ```

  Returns date of next state change. You may omit *date* to use current date.

  Returns undefined if the next change cannot be found. This may happen if the state won't ever change (e.g. ```24/7```) or if search goes beyond *limit* (which is *date* + ~5 years if omitted).

* ```javascript
  var matching_rule = oh.getMatchingRule(date);
  ```

  Returns the matching rule. You may omit *date* to use current date.
  A opening_hours string can consist of multiple rules (or internally called blocks) from which one of them is used for a given point in time. If no rule applies, the state will be closed and this function returns undefined.


### Iterator API ###

* ```javascript
  var iterator = oh.getIterator(date);
  ```

  Constructs an iterator which can go through open/close points, starting at *date*. You may omit *date* to use current date.

* ```javascript
  var current_date = iterator.getDate();
  ```

  Returns current iterator position.

* ```javascript
  iterator.setDate(date);
  ```

  Set interator position to date.

* ```javascript
  var is_open = iterator.getState();
  ```

  Returns whether the facility is open at the current iterator position in time.

* ```javascript
  var unknown = iterator.getUnknown();
  ```

  Checks whether the opening state is conditional or unknown at the current iterator position in time.

* ```javascript
  var state_string = iterator.getStateString(past);
  ```

  Return state string. Either 'open', 'unknown' or 'closed?'.

  If the boolean parameter `past` is true you will get 'closed' else you will get 'close'.

* ```javascript
  var comment = iterator.getComment();
  ```

  Returns the comment (if one is specified) for the facility at the current iterator position in time.

  If no comment is specified this function will return undefined.

* ```javascript
  var matching_rule = iterator.getMatchingRule();
  ```

  Returns the matching rule.

* ```javascript
  var had_advanced = iterator.advance(limit);
  ```

  Advances an iterator to the next position, but not further than *limit* (which is current position + ~5 years if omitted and is used to prevent infinite loop on non-periodic opening_hours, e.g. ```24/7```), returns whether the iterator was moved.

  For instance, returns false if the iterator would go beyond *limit* or if there's no next position (```24/7``` case).

## Features ##

Almost everything from opening_hours definition is supported, as well as some extensions (indicated as **EXT:** below).

**WARN** indicates that the syntax element is evaluated correctly, but there is a better way to express this. A warning will be shown.

* See the [formal specification][]
* Opening hours consist of multiple rules separated by semicolon (```Mo 10:00-20:00; Tu 12:00-18:00```) or by other separated mentioned by the next to points.
* Supports [fallback rules][] (```We-Fr 10:00-24:00 open "it is open" || "please call"```).

  Note that only the rule which starts with ```||``` is a fallback rule. Other rules which might follow are considered as normal rules.
* Supports [additional rules][] or cooperative values (```Mo-Fr 08:00-12:00, We 14:00-18:00```). A additional rule is treated exactly the same as a normal rule, except that a additional rule does not overwrite the day for which it applies. Note that a additional rule does not use any data from previous or from following rules.

  A rule does only count as additional rule if the previous rule ends with a time range (```12:00-14:00, We 16:00-18:00```, but does not continue with a time range of course), a comment (```12:00-14:00 "call us", We 16:00-18:00```) or the keywords 'open', 'unknown' or 'closed' (```12:00-14:00 unknown, We 16:00-18:00```)

* Rule may use ```off``` keyword to indicate that the facility is closed at that time (```Mo-Fr 10:00-20:00; 12:00-14:00 off```). ```closed``` can be used instead if you like. They mean exactly the same.
* Rule consists of multiple date (```Mo-Fr```, ```Jan-Feb```, ```week 2-10```, ```Jan 10-Feb 10```) and time (```12:00-16:00```, ```12:00-14:00,16:00-18:00```) conditions
* If a rule's date condition overlap with previous rule, it overrides (as opposed to extends) the previous rule. E.g. ```Mo-Fr 10:00-16:00; We 12:00-18:00``` means that on Wednesday the facility is open from 12:00 till 18:00, not from 10:00 to 18:00.

  This also applies for time ranges spanning midnight.	This is the only way to be consistent. Example: ```22:00-02:00; Th 12:00-14:00```. By not overriding specifically for midnight ranges, we could get either ```22:00-02:00; Th 00:00-02:00,12:00-14:00,22:00-02:00``` or ```22:00-02:00; Th 00:00-02:00,12:00-14:00``` and deciding which interpretation was really intended cannot always be guessed.

* Date ranges (calendar ranges) can be separated from the time range by a colon (```Jan 10-Feb 10: 07:30-12:00```) but this is not required. This was implemented to also parse the syntax proposed by [Netzwolf][formal specification].

### Time ranges ###

* Supports sets of time ranges (```10:00-12:00,14:00-16:00```)
  * **WARN:** Accept ```10-12,14-16``` as abbreviation for the previous example. Please don’t use this as this is not very explicit.
  * Correctly supports ranges wrapping over midnight (```10:00-26:00```, ```10:00-02:00```)
* Supports 24/7 keyword (```24/7```, which means always open. Use [state keywords][ohlib.states] to express always closed.)
  * **WARN:** 24/7 is handled as a synonym for ```00:00-24:00```, so ```Mo-Fr 24/7``` (though not really correct, because of that you should avoid it or replace it with "open". A warning will be given if you use it anyway for that purpose) will be handled correctly

    *The use of 24/7 as synonym is never needed and should be avoided in cases where it does not mean 24/7.* In cases where a facility is really open 24 hours 7 days a week thats where this value is for.
* **EXT:** Supports omitting time range (```Mo-Fr; Tu off```)
* **EXT:** Supports space as time interval separator, i.e. ```Mo 12:00-14:00,16:00-20:00``` and ```Mo 12:00-14:00 16:00-20:00``` are the same thing
* Complete support for dawn/sunrise/sunset/dusk (variable times) keywords (```10:00-sunset```, ```dawn-dusk```). To calculate the correct values, the latitude and longitude are required which are included in the JSON returned by [Nominatim] \(see in the [Library API][ohlib.library-api] how to provide it\). The calculation is done by [suncalc][].

  If the coordinates are missing, constant times will be used (dawn: '05:30', sunrise: '06:00', sunset: '18:00', dusk: '18:30').

  If the end time (second time in time range) is near the sunrise (for instance ```sunrise-08:00```) than it can happen that the sunrise would actually be after 08:00 which would normally be interpreted as as time spanning midnight. But with variable times, this only partly applies. The rule here is that if the end time is lesser than the constant time (or the actual time) for the variable time in the start time (in that example sunrise: '06:00') then it is interpreted as the end time spanning over midnight. So this would be a valid time range spanning midnight: ```sunrise-05:59```.

  A second thing to notice is that if the variable time becomes greater than the end time and the end time is greater than the constant time than this time range will be ignored (e.g ```sunrise-08:00``` becomes ```08:03-08:00``` for one day, it  is ignored for this day).

* Support calculation with variable times (e.g. ```sunrise-(sunset-00:30)```: meaning that the time range ends 30 minutes before sunset; ```(sunrise+01:02)-(sunset-00:30)```).

* Supports open end (```10:00+```). It is interpreted as state unknown and the comment "Specified as open end. Closing time was guessed." if there is no comment specified. You might need to limit open end times in cases like: ```07:00+,12:00-16:00; 16:00-24:00 closed "needed because of open end"```.

  If a facility is open for a fix time followed by open end the shortcut ```14:00-17:00+``` can be used (see also [proposal page](http://wiki.openstreetmap.org/wiki/Proposed_features/opening_hours_open_end_fixed_time_extension)).

  Open end applies until the end of the day if the opening time is before 17:00. If the opening time is between 17:00 and 21:59 the open end time ends 10 hours after the opening. And if the opening time is after 22:00 (including 22:00) the closing time will be interpreted as 8 hours after the opening time.
* **WARN:** Supports dot as time separator (```12.00-16.00```)

[suncalc]: https://github.com/mourner/suncalc

### Points in time ###

* In mode 1 or 2, points in time are evaluated. Example: ```Mo-Fr 12:00,15:00,18:00; Su (sunrise+01:00)```. Currently a point in time is interpreted as an interval of one minute. It was the easiest thing to implement and has some advantages. See [here](https://github.com/AMDmi3/opening_hours.js/issues/12) for discussion.
* To express regular points in time, like each hour, a abbreviation can be used to express the above example ```Mo-Fr 12:00-18:00/03:00``` which means from 12:00 to 18:00 every three hours.

### Weekday ranges ###

* Supports set of weekdays and weekday ranges (```Mo-We,Fr```)
* Supports weekdays which wrap to the next week (```Fr-Mo```)
* Supports constrained weekdays (```Th[1,2-3]```, ```Fr[-1]```)
* Supports calculations based on constrained weekdays (```Sa[-1],Sa[-1] +1 day``` e.g. last weekend in the month, this also works if Sunday is in the next month)

### Holidays ###

* Supports public holidays (```open; PH off```, ```PH 12:00-13:00```).
  * Currently Germany (including the little variations between confederations) is supported. Note that there are a few [footnotes][PH-de] which are ignored. The same applies for [Austria][PH-at]. Also supported:
    * [France][PH-fr]
    * [Canada][PH-ca]
    * [Ukraine][PH-ua]
    * [Slovenian][PH-si]
  * **EXT:** Supports limited calculations based on holidays (e.g. ```Sa,PH -1 day open```). The only two possibilities are currently +1 and -1. All other cases are not handled. This seems to be enough because the only thing which is really used is -1.

[PH-de]: http://de.wikipedia.org/wiki/Feiertage_in_Deutschland
[PH-at]: http://de.wikipedia.org/wiki/Feiertage_in_%C3%96sterreich
[PH-fr]: https://fr.wikipedia.org/wiki/F%EAtes_et_jours_f%E9ri%E9s_en_France
[PH-ca]: https://en.wikipedia.org/wiki/Public_holidays_in_Canada
[PH-ua]: http://uk.wikipedia.org/wiki/%D0%A1%D0%B2%D1%8F%D1%82%D0%B0_%D1%82%D0%B0_%D0%BF%D0%B0%D0%BC%27%D1%8F%D1%82%D0%BD%D1%96_%D0%B4%D0%BD%D1%96_%D0%B2_%D0%A3%D0%BA%D1%80%D0%B0%D1%97%D0%BD%D1%96
[PH-si]: http://www.vlada.si/o_sloveniji/politicni_sistem/prazniki/

* Support for school holidays (```SH 10:00-14:00```).
  * Currently only Germany is supported (based on ical files from [schulferien.org][]).
  * To update the school holiday definition or add definitions for other countries the script [convert\_ical\_to\_json][convert-ical-to-json] can be used (probably includes a little bit of adjustment of the script) to generate JSON definition based on ical calendar files, which can then be added to the library.

[schulferien.org]: http://www.schulferien.org/iCal/
<!-- [convert&#45;ical&#45;to&#45;json]: blob/feature/convert_ical_to_json -->
[convert-ical-to-json]: https://github.com/ypid/opening_hours.js/blob/feature/convert_ical_to_json

* There can be two cases which need to be separated (this applies for PH and SH):
  1. ```Mo-Fr,PH```: The facility is open Mo-Fr and PH. If PH is a Sunday for example the facility is also open. This is the default case.
  2. **EXT:** ```PH Mo-Fr```: The facility is only open if a PH falls on Mo-Fr. For example if a PH is on the weekday Wednesday then the facility will be open, if PH is Saturday it will be closed.
* If there is no comment specified by the rule, the name of the holiday is used as comment.
* To evaluate the correct holidays, the country code and the state (could be omitted but this will probably result in less exactitude) are required which are included in the JSON returned by [Nominatim] \(see in the [Library API][ohlib.library-api] how to provide it\).
* If your country or state is missing or wrong you can add it or open an [issue][issue-report] (and point to a definition of the holidays).

### Year ranges ###

* **EXT:** Supports year ranges (```2013,2015,2050-2053,2055/2,2020-2029/3 10:00-20:00```)
* **EXT:** Supports periodic year (either limited by range or unlimited starting with given year) (```2020-2029/3,2055/2 10:00-20:00```)

  There is one exception. It is not necessary to use a year range with a period of one (```2055-2066/1 10:00-20:00```) because this means the same as just the year range without the period (```2055-2066 10:00-20:00```) and should be expressed like this …

 The *oh.getWarnings()* function will give you a warning if you use this anyway.
* **EXT:** Supports way to say that a facility is open (or closed) from a specified year without limit in the future (```2055+ 10:00-20:00```)

### Month ranges ###

* Supports set of months and month ranges (```Jan,Mar-Apr```)
* Supports months which wrap to the next year (```Dec-Jan```)

### Monthday ranges ###

* Supports monthday ranges across multiple months (```Jan 01-Feb 03 10:00-20:00```)
* Supports monthday ranges within single month (```Jan 01-26 10:00-20:00```), with periods as well ```Jan 01-29/7 10:00-20:00```, period equals 1 should be avoided)
* Supports monthday ranges with years (```2013 Dec 31-2014 Jan 02 10:00-20:00```, ```2012 Jan 23-31 10:00-24:00```)
* Supports monthday ranges based on constrained weekdays (```Jan Su[1]-Feb 03 10:00-20:00```)
* Supports calculation based on constrained weekdays in monthday range (```Jan Su[1] +1 day-Feb 03 10:00-20:00```)
* Supports movable events like easter (```easter - Apr 20: open "Around easter"```)

  Note that if easter would be after the 20th of April for one year, this will be interpreted as spanning into the next year currently.
* Supports calculations based on movable events (```2012 easter - 2 days - 2012 easter + 2 days: open "Around easter"```)
* **EXT:** Supports multiple monthday ranges separated by a comma (```Jan 23-31/3,Feb 1-12,Mar 1```)

### Week ranges ###

* Supports week ranges (```week 04-07 10:00-20:00```)
* Supports periodic weeks (```week 2-53/2 10:00-20:00```)
* **EXT:** Supports multiple week ranges (```week 1,3-5,7-30/2 10:00-20:00```)

### States ###
* A facility can be in two main states for a given point in time: open (true) or closed (false).
  * But since the state can also depend on other information (e.g. weather depending, call us) than just the time, a third state can be expressed (```Mo unknown; Th-Fr 09:00-18:00 open```)

  In that case the main state is false and unknown is true for Monday.

### Comments ###
* Supports (additional) comments (```Mo unknown "on appointment"; Th-Fr 09:00-18:00 open "female only"; Su closed "really"```)
  * The string which is delimited by double-quotes can contain any character (except a double-quote sign)
  * instead of "closed" "off" will also work
  * unknown can be omitted (just a comment (without [state][ohlib.states]) will also result in unknown)
  * value can also be just a double-quoted string (```"on appointment"```) which will result in unknown for any given time.

## Test ##

Simple node.js based test framework is bundled. You can run it with ```node test.js``` or with ```make test```.

The current results of this test are also tracked in the repository and can be viewed [here](/test.log). Note that this file uses [ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code) which can be interpreted by cat in the terminal.

## Testing with real data ##

### Large scale ###
To see how this library performance in the real OpenStreetMap world you can run ```make real_test``` or ```node real_test.js``` (data needs to be exported first) to try to process every value which uses the opening_hours syntax from [taginfo][] with this library.

Currently (March 2014) this library can parse 97 % (245639/253588) of all opening_hours values in OSM. If identical values appear multiple times then each value counts.

### Small scale ###
Python script to search with regular expressions over OSM opening_hours style tags is bundled. You can run it with ```make regex_search``` or ```./regex_search``` which will search on the opening_hours tag. To search over different tags either use ```make regex_search SEARCH=$tagname``` (this also makes sure that the tag you would like to search on will be downloaded if necessary) or run ```./regex_search $path_to_downloaded_taginfo_json_file```.

This script not only shows you if the found value can be processed with this library or not, it also indicates using different colors if the facility is currently open (open: green, unknown: magenta, closed: blue).

It also offers filter options (e.g. only errors) and additional things like links to [taginfo][].

Hint: If you want to do quality assurance on tags like opening_hours you can also use this script and enter a regex for values you would like to check and correct (if you have no particular case just enter a dot which matches any character which results in every value being selected). Now you see how many values match your search pattern. As you do QA you probably only want to see values which can not be evaluated. To do this enter the filter "failed".
To improve the speed of fixing errors, a [feature](https://github.com/ypid/opening_hours.js/issues/29) was added to load those failed values in JOSM. To enable this, append " josm" to the input line. So you will have something like "failed josm" as argument. Now you can hit enter and go through the values.

[taginfo]: http://taginfo.openstreetmap.org/

## Test it yourself (the geeky way) ##
You want to try some opening_hours yourself? Just run ```make interactive_testing``` or ```node interactive_testing.js``` which will open an primitive interpreter. Just write your opening_hours value and hit enter and you will see if it can be processed (with current state) or not (with error message). In return you will get an JSON blob as answer.

Testing is much easier by now. Have a look at the [evaluation tool][ohlib.evaluation-tooldemohtml]. The reason way this peace of code was written is to have an interface which can be accessed from other programming languages. It is used by the python module [pyopening\_hours][].

## Performance ##

Simple node.js based benchmark is bundled. You can run it with ```node benchmark.js``` or with ```make benchmark```.

On author's Intel Core i5-2540M CPU @ 2.60GHz library allows ~8k/sec constructor calls and ~2.5k/sec openIntervals() calls with one week period. This may further improve in future.

## Used by other projects ##
This library is used by the following projects:

* [ulm-opening-hours](https://github.com/cmichi/ulm-opening-hours) (old version of this library)
* [gdzie.bl.ee](http://gdzie.bl.ee) (old version of this library)
* [JOSM](http://josm.openstreetmap.de/) ([ticket for integration](http://josm.openstreetmap.de/ticket/9157))
* [opening\_hours\_map][]
* [pyopening\_hours][] (python module for opening_hours.js)

[opening\_hours\_map]: https://github.com/ypid/opening_hours_map
[pyopening\_hours]: https://github.com/ypid/pyopening_hours

## Related links ##

* [fossgis project page on the OSM wiki][fossgis-project]

[fossgis-project]: http://wiki.openstreetmap.org/wiki/FOSSGIS/Server/Projects/opening_hours.js

## ToDo ##
List of missing features which can currently not be expressing in any other way without much pain.
Please share your opinion on the [talk page](http://wiki.openstreetmap.org/wiki/Talk:Key:opening_hours) (or the discussion page to the proposal if that does exist) if you have any idea how to express this (better).

* Select single (or more, comma separated) (school|public) holidays. [Proposed syntax](http://wiki.openstreetmap.org/wiki/Proposed_features/opening_hours_holiday_select): ```SH(Sommerferien)```
* Depending on moon position like ```"low tide only"```. Suncalc lib does support moon position. Syntax needed.
* If weekday is PH than the facility will be open weekday-1 this week. Syntax something like: ```We if (We +1 day == PH) else Th``` ???

List of features which can make writing easier:

* ```May-Aug: (Mo-Th 9:00-20:00; Fr 11:00-22:00; Sa-Su 11:00-20:00)```

* Last day of the month. Better syntax needed? Can be expressed with (but not perfect, it will fail for some leap years):
  ```
  Jan 31,Mar 31,Apr 30,May 31,Jun 30,Jul 31,Aug 31,Sep 30,Oct 31,Nov 30,Dec 31 open "last day in month";
  Feb 29 open "last day in month (Feb, leap year)";
  2009/4,2010/4,2011/4 Feb 28 open "last day in month (Feb, not leap year)"
  ```

## How to contribute ##

You can contribute in the usual manner as known from GitHub. Just fork, change and make a pull request.

### Translating ###

This project uses http://i18next.com/ for translation.

Translations can be made in the file [js/i18n-resources.js][ohlib.js/i18n-resources.js]. Just copy the whole English block, change the language code to the one you are adding and make your translation. You can open the [demo.html](/demo.html) to see the result of your work. To complete your localization add the translated language name to the other languages.

Note that this resource file does also provide the localization for the [opening\_hours\_map][]. This can also be tested by cloning the project and linking your modified opening_hours.js working copy to the opening_hours.js directory (after renaming it) inside the opening_hours_map project.

### Holidays ###

Holidays can be added to the file [opening_hours.js][ohlib.opening_hours.js] as JavaScript Object notation. Have a look at the current definitions for [other holidays][ohlib.holidays] . Please add the source for this information (in form of an URL) as comment.

### Core code ###

Note that there is a git pre-commit hook used to run and compare the test framework before each commit. To activate the hook, run:

    ./hooks/link_hooks

All functions are documented, which should help contributers to get started.

The documentation looks like this:

```javascript
/* List parser for constrained weekdays in month range {{{
 * e.g. Su[-1] which selects the last Sunday of the month.
 *
 * :param tokens: List of token objects.
 * :param at: Position where to start.
 * :returns: Array:
 *			0. Constrained weekday number.
 *			1. Position at which the token does not belong to the list any more (after ']' token).
 */
function getConstrainedWeekday(tokens, at) {
```

The opening brackets ```{{{``` (and the corresponding closing onces) are used to fold the source code. See [Vim folds](http://vim.wikia.com/wiki/Folding).

## Author ##

* [Dmitry Marakasov](https://github.com/AMDmi3) <amdmi3@amdmi3.ru> (initial coding and design and all basic features like time ranges, week ranges, month ranges and week ranges)
* [Robin Schneider](https://github.com/ypid)   (Current maintainer. Added support for years, holidays, unknown, comments, open end, fallback/additional rules (and more), wrote getWarnings, prettifyValue, translated [demo page][ohlib.evaluation-tooldemohtml] to English and German and extended it to enter values yourself.)

## Contributors ##

* [Sergey Leschina](https://github.com/putnik)     ([demo][ohlib.evaluation-tooldemohtml] improvements)
* [don-vip](https://github.com/don-vip)            (French localization and public holidays for France)
* [Charly Koza](https://github.com/Cactusbone)     (fixed package.json)
* [Simon B.](https://github.com/sesam)             (improved understandability of overlapping rules in README.md)
* [NonnEmilia](https://github.com/NonnEmilia)      (Italian localization and fixes in the [demo page][ohlib.evaluation-tooldemohtml])
* [João G. Packer](https://github.com/jgpacker)    (Portuguese localization)
* [James Badger](https://github.com/openfirmware)  (add Canadian national, provincial public holidays and fixed Russian localization)
* [Zgarbul Andrey](https://github.com/burrbull)    (Ukrainian localization and public holidays for Ukraine)
* [Blaž Lorger](https://github.com/blorger)        (public holidays for Slovenian)

## Credits ##

* [Netzwolf](http://www.netzwolf.info/) (He developed the first and very feature complete JS implementation for opening_hours (time_domain.js). His implementation did not create selector code to go through time as this library does (which is a more advanced design). time_domain.js has been withdrawn in favor of opening_hours.js but a few parts where reused (mainly the input tolerance and the online evaluation for the [demo page][ohlib.evaluation-tooldemohtml]). It was also very useful as prove and motivation that all those complex things used in opening_hours values are possible to evaluate with software :) )

## License ##

* opening_hours.js is published under the New (2-clause) BSD license


[Nominatim]: http://wiki.openstreetmap.org/wiki/Nominatim#Reverse_Geocoding_.2F_Address_lookup
[issue-report]: https://github.com/ypid/opening_hours.js/issues
[formal specification]: http://wiki.openstreetmap.org/wiki/Key:opening_hours:specification
[fallback rules]: http://wiki.openstreetmap.org/wiki/Key:opening_hours:specification#rule1
[additional rules]: http://wiki.openstreetmap.org/wiki/Key:opening_hours#Examples

<!-- References to other parts of this documentation. Can not use short links only referring to the section inside the README.md any more because this will not work on other pages like https://www.npmjs.org/package/opening_hours. Edit: This does also work on npmjs in this short version … -->
[ohlib.time-ranges]: #time-ranges
[ohlib.states]: #states
[ohlib.holidays]: #holidays
[ohlib.evaluation-tooldemohtml]: #evaluation-tooldemohtml
[ohlib.library-api]: #library-api
[ohlib.opening_hours.js]: /opening_hours.js
[ohlib.js/i18n-resources.js]: /js/i18n-resources.js
