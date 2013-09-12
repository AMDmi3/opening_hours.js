(function (root, factory) {
	if (typeof exports === 'object') {
		// For nodejs
		var SunCalc = require('suncalc');
		module.exports = factory(SunCalc);
	} else {
		// For browsers
		root.opening_hours = factory();
	}
}(this, function (SunCalc) {
	var SunCalc;
	return function(value, nominatiomJSON) {
		//======================================================================
		// Constants
		//======================================================================
		var months   = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
		var weekdays = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
		var word_replacement = { // if the correct values can not be calculated
			dawn    : 60 * 5 + 30,
			sunrise : 60 * 6,
			sunset  : 60 * 18,
			dusk    : 60 * 18 + 30,
		};
		var holidays = {
			'de': {
				'PH': { // http://de.wikipedia.org/wiki/Feiertage_in_Deutschland
					'Neujahrstag'               : [ 1, 1 ], // month 1, day 1, whole Germany
					'Heilige Drei Könige'       : [ 1, 6, [ 'Baden-Württemberg', 'Bayern', 'Sachsen-Anhalt'] ], // only in the specified states
					'Tag der Arbeit'            : [ 5, 1 ], // whole Germany
					'Karfreitag'                : [ 'easter', -2 ], // two days before easter
					'Ostersonntag'              : [ 'easter',  0, [ 'Brandenburg'] ],
					'Ostermontag'               : [ 'easter',  1 ],
					'Christi Himmelfahrt'       : [ 'easter', 39 ],
					'Pfingstsonntag'            : [ 'easter', 49, [ 'Brandenburg'] ],
					'Pfingstmontag'             : [ 'easter', 50 ],
					'Fronleichnam'              : [ 'easter', 60, [ 'Baden-Württemberg', 'Bayern', 'Hessen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland' ] ],
					'Mariä Himmelfahrt'         : [  8,  3, [ 'Saarland'] ],
					'Tag der Deutschen Einheit' : [ 10,  3 ],
					'Reformationstag'           : [ 10, 31, [ 'Brandenburg', 'Mecklenburg-Vorpommern', 'Sachsen', 'Sachsen-Anhalt', 'Thüringen'] ],
					'Allerheiligen'             : [ 11,  1, [ 'Baden-Württemberg', 'Bayern', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland' ] ],
					'1. Weihnachtstag'          : [ 12, 25 ],
					'2. Weihnachtstag'          : [ 12, 26 ],
				},
				'Baden-Württemberg': { // does only apply in Baden-Württemberg
					// This more specific rule set overwrites the country wide one (they are just ignored).
					// You may use this instead of the country wide with some
					// additional holidays for some states, if one state
					// totally disagrees about how to do public holidays …
					// 'PH': {
					// 	'2. Weihnachtstag'          : [ 12, 26 ],
					// },
					'SH': [
						// For Germany http://www.schulferien.org/ is a great resource.
						// They also provide ics which could be parsed …
						{
							name: 'Osterferien',
							2014:      [ 3, 25, /* to */ 4, 5 ],
							2012:      [ 3, 25, /* to */ 4, 5 ],
							2013:      [ 3, 25, /* to */ 4, 5 ],
							// 'default': [ 4, 25, /* to */ 5, 5 ],
						},
						{
							name: 'asd',
							'default': [ 5, 25, /* to */ 1, 5 ],
						},
					]
				},
			}
		};

		var minutes_in_day = 60 * 24;
		var msec_in_day    = 1000 * 60 * minutes_in_day;
		var msec_in_week   = msec_in_day * 7;

		//======================================================================
		// Constructor - entry to parsing code
		//======================================================================
		// Terminology:
		//
		// Mo-Fr 10:00-11:00; Th 10:00-12:00
		// \_____block_____/  \____block___/
		//
		// Mo-Fr Jan 10:00-11:00
		// \__/  \_/ \_________/
		// selectors (left to right: weekday, month, time)
		//
		// Logic:
		// - Split blocks; foreach block:
		// - Tokenize
		// - Run toplevel (block) parser
		//   - Which calls subparser for specific selector types
		//     - Which produce selectors


		// Evaluate additional information which can be given. They are
		// required to reasonably calculate 'sunrise' and so on and to use the
		// correct holidays.
		var location_cc, location_state, lat, lon;
		if (typeof nominatiomJSON != 'undefined') {
			if (typeof nominatiomJSON.address != 'undefined' &&
					typeof nominatiomJSON.address.state != 'undefined') { // country_code will be tested later …
				location_cc    = nominatiomJSON.address.country_code;
				location_state = nominatiomJSON.address.state;
			}

			if (typeof nominatiomJSON.lon != 'undefined') { // lat will be tested later …
				var lat = nominatiomJSON.lat;
				var lon = nominatiomJSON.lon;
			}
		}

		if (value.match(/^(\s*;?\s*)+$/)) throw 'Value contains nothing meaningful which can be parsed';

		var rules = value.split(/\s*;\s*/);
		var week_stable = true;

		var blocks = [];

		for (var rule = 0; rule < rules.length; rule++) {
			var tokens = tokenize(rules[rule]);
			if (tokens.length == 0) continue; // Rule does contain nothing useful e.g. second rule of '10:00-12:00;' (empty) which needs to be handled.

			var selectors = {
				// Time selectors
				time: [],

				// Temporary array of selectors from time wrapped to the next day
				wraptime: [],

				// Date selectors
				weekday: [],
				holiday: [],
				week: [],
				month: [],
				monthday: [],
				year: [],

				// Array with non-empty date selector types, with most optimal ordering
				date: [],

				meaning: true,
				unknown: false,
				comment: undefined,
			};

			parseGroup(tokens, 0, selectors);

			if (selectors.holiday.length > 0)
				selectors.date.push(selectors.holiday);
			if (selectors.month.length > 0)
				selectors.date.push(selectors.month);
			if (selectors.monthday.length > 0)
				selectors.date.push(selectors.monthday);
			if (selectors.year.length > 0) // FIXME: Can not be put in optimal order (at the top).
				selectors.date.push(selectors.year);
			if (selectors.week.length > 0)
				selectors.date.push(selectors.week);
			if (selectors.weekday.length > 0)
				selectors.date.push(selectors.weekday);

			blocks.push(selectors);

			// this handles selectors with time ranges wrapping over midnight (e.g. 10:00-02:00)
			// it generates wrappers for all selectors and creates a new block
			if (selectors.wraptime.length > 0) {
				var wrapselectors = {
					time: selectors.wraptime,
					date: [],

					meaning: selectors.meaning,
					unknown: selectors.unknown,
					comment: selectors.comment,

					wrapped: true,
				};

				for (var dselg = 0; dselg < selectors.date.length; dselg++) {
					wrapselectors.date.push([]);
					for (var dsel = 0; dsel < selectors.date[dselg].length; dsel++) {
						wrapselectors.date[wrapselectors.date.length-1].push(
								generateDateShifter(selectors.date[dselg][dsel], -msec_in_day)
							);
					}
				}

				blocks.push(wrapselectors);
			}
		}

		// Tokenization function: Splits string into parts.
		// output: array of pairs [content, type]
		function tokenize(value) {
			var tokens = new Array();

			while (value != '') {
				var tmp;
				if (tmp = value.match(/^(?:week|24\/7|off|open|closed|unknown)/i)) {
					// reserved word
					tokens.push([tmp[0].toLowerCase(), tmp[0].toLowerCase()]);
					value = value.substr(tmp[0].length);
				} else if (tmp = value.match(/^(?:sunrise|sunset|dawn|dusk)/i)) {
					// Special time variables which actual value depends on the date and the position of the facility.
					tokens.push([tmp[0].toLowerCase(), 'timevar']);
					value = value.substr(tmp[0].length);
				} else if (tmp = value.match(/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
					// month name
					tokens.push([months[tmp[0].toLowerCase()], 'month']);
					value = value.substr(3);
				} else if (tmp = value.match(/^(?:mo|tu|we|th|fr|sa|su)/i)) {
					// weekday name
					tokens.push([weekdays[tmp[0].toLowerCase()], 'weekday']);
					value = value.substr(2);
				} else if (tmp = value.match(/^(?:PH|SH)/i)) {
					// special day name (holidays)
					tokens.push([tmp[0].toUpperCase(), 'holiday']);
					value = value.substr(2);
				} else if (tmp = value.match(/^\d+/)) {
					// number
					if (tmp[0] > 1900) // assumed to be a year number
						tokens.push([tmp[0], 'year']);
					else
						tokens.push([+tmp[0], 'number']);
					value = value.substr(tmp[0].length);
				} else if (tmp = value.match(/^"([^"]+)"/)) {
					// comment
					tokens.push([tmp[1], 'comment']);
					value = value.substr(tmp[0].length);
				} else if (value.match(/^\s/)) {
					// whitespace is ignored
					value = value.substr(1);
				} else if (value.match(/^[:.]/)) {
					// time separator
					tokens.push([value[0].toLowerCase(), 'timesep']);
					value = value.substr(1);
				} else {
					// other single-character tokens
					tokens.push([value[0].toLowerCase(), value[0].toLowerCase()]);
					value = value.substr(1);
				}
			}

			return tokens;
		}

		// Function to check token array for specific pattern
		function matchTokens(tokens, at /*, matches... */) {
			if (at + arguments.length - 2 > tokens.length)
				return false;
			for (var i = 0; i < arguments.length - 2; i++) {
				if (tokens[at + i][1] !== arguments[i + 2])
					return false;
			}

			return true;
		}

		function generateDateShifter(func, shift) {
			return function(date) {
				var res = func(new Date(date.getTime() + shift));

				if (typeof res[1] === 'undefined')
					return res;
				return [ res[0], new Date(res[1].getTime() - shift) ];
			}
		}

		//======================================================================
		// Top-level parser
		//======================================================================
		function parseGroup(tokens, at, selectors) {
			// console.log(tokens); // useful for debugging of tokenize
			while (at < tokens.length) {
				// console.log('Parsing at position '+ at +': '+tokens[at]);
				if (matchTokens(tokens, at, 'weekday')) {
					at = parseWeekdayRange(tokens, at, selectors);
				} else if (matchTokens(tokens, at, 'holiday')) {
					at = parseHoliday(tokens, at, selectors);
					week_stable = false;
				} else if (matchTokens(tokens, at, 'month', 'number') || matchTokens(tokens, at, 'year', 'month', 'number')) {
					at = parseMonthdayRange(tokens, at);
					week_stable = false;
				} else if (matchTokens(tokens, at, 'year')) {
					at = parseYearRange(tokens, at);
					week_stable = false;
				} else if (matchTokens(tokens, at, 'month')) {
					at = parseMonthRange(tokens, at);
					// week_stable = false; // decided based on actual values
				} else if (matchTokens(tokens, at, 'week')) {
					at = parseWeekRange(tokens, at + 1);
					week_stable = false;
				} else if (at != 0 && at != tokens.length - 1 && tokens[at][0] === ':') {
					// Ignore colon if they appear somewhere else than as time separator.
					// This provides compatibility with the syntax proposed by Netzwolf:
					// http://www.netzwolf.info/en/cartography/osm/time_domain/specification
					at++;
				} else if (matchTokens(tokens, at, 'number', 'timesep')
						|| matchTokens(tokens, at, 'timevar')
						|| matchTokens(tokens, at, '(', 'timevar')) {
					at = parseTimeRange(tokens, at, selectors);
				} else if (matchTokens(tokens, at, 'off') || matchTokens(tokens, at, 'closed')) {
					selectors.meaning = false;
					at++;
				} else if (matchTokens(tokens, at, 'open')) {
					selectors.meaning = true;
					at++;
				} else if (matchTokens(tokens, at, 'unknown')) {
					selectors.meaning = false;
					selectors.unknown = true;
					at++;
				} else if (matchTokens(tokens, at, 'comment')) {
					selectors.comment = tokens[at][0];
					if (at > 0) {
						if (!matchTokens(tokens, at - 1, 'open')
							&& !matchTokens(tokens, at - 1, 'closed')
							&& !matchTokens(tokens, at - 1, 'off')) {
							// Then it is unknown. Either with unknown explicitly
							// specified or just a comment behind.
							selectors.meaning = false;
							selectors.unknown = true;
						}
					} else { // rule starts with comment
						selectors.time.push(function(date) { return [true]; });
						selectors.meaning = false;
						selectors.unknown = true;
					}
					at++;
				} else if (matchTokens(tokens, at, '24/7')) {
					selectors.time.push(function(date) { return [true]; });
					at++;
				} else {
					throw 'Unexpected token: "' + tokens[at] + '"';
				}
			}

			return tokens;
		}

		//======================================================================
		// Time range parser (10:00-12:00,14:00-16:00)
		//======================================================================
		function parseTimeRange(tokens, at, selectors) {
			for (; at < tokens.length; at++) {
				var has_time_var_calc = [], has_normal_time = []; // element 0: start time, 1: end time
				has_normal_time[0] = matchTokens(tokens, at, 'number', 'timesep', 'number');
				has_time_var_calc[0] = matchTokens(tokens, at, '(', 'timevar');
				if (has_normal_time[0] || matchTokens(tokens, at, 'timevar') || has_time_var_calc[0]) {
					// relying on the fact that always *one* of them is true

					var has_open_end = false;
					if (!matchTokens(tokens, at+(has_normal_time[0] ? 3 : (has_time_var_calc[0] ? 7 : 1)), '-')) {
						if (matchTokens(tokens, at+(has_normal_time[0] ? 3 : (has_time_var_calc[0] ? 7 : 1))), '+')
							has_open_end = true;
						else
							throw 'hyphen or open end (+) in time range expected';
					}

					if (has_normal_time[0])
						var minutes_from = tokens[at+has_time_var_calc[0]][0] * 60 + tokens[at+has_time_var_calc[0]+2][0];
					else
						var minutes_from = word_replacement[tokens[at+has_time_var_calc[0]][0]];

					var timevar_add = [ 0, 0 ];
					if (has_time_var_calc[0]) {
						timevar_add[0] = parseTimevarCalc(tokens, at);
						minutes_from += timevar_add[0];
					}

					var at_end_time = at+(has_normal_time[0] ? 3 : (has_time_var_calc[0] ? 7 : 1))+1; // after '-'
					if (has_open_end) {
						var minutes_to = minutes_from + 1;
					} else {
						has_normal_time[1] = matchTokens(tokens, at_end_time, 'number', 'timesep', 'number');
						has_time_var_calc[1]      = matchTokens(tokens, at_end_time, '(', 'timevar');
						if (!has_normal_time[1] && !matchTokens(tokens, at_end_time, 'timevar') && !has_time_var_calc[1])
							throw 'time range does not continue as expected';

						if (has_normal_time[1])
							var minutes_to = tokens[at_end_time][0] * 60 + tokens[at_end_time+2][0]
						else
							var minutes_to = word_replacement[tokens[at_end_time+has_time_var_calc[1]][0]];

						if (has_time_var_calc[1]) {
							timevar_add[1] = parseTimevarCalc(tokens, at_end_time);
							minutes_to += timevar_add[1];
						}

						// this shortcut makes always-open range check faster
						// and is also useful in tests, as it doesn't produce
						// extra check points which may hide errors in other
						// selectors
						if (minutes_from == 0 && minutes_to == minutes_in_day)
							selectors.time.push(function(date) { return [true]; });
					}

					// normalize minutes into range
					// XXX: what if it's further than tomorrow?
					// XXX: this is incorrect, as it assumes the same day
					//      should cooperate with date selectors to select the next day
					if (minutes_from >= minutes_in_day)
						throw 'Time range start outside a day';
					if (minutes_to < minutes_from)
						minutes_to += minutes_in_day;
					if (minutes_to > minutes_in_day * 2)
						throw 'Time spanning more than two midnights not supported';

					var timevar_string = [];
					if (typeof lat != 'undefined') { // lon will also be defined (see above)
						if (!has_normal_time[0] || !has_normal_time[1]) // has_open_end does not count here
							week_stable = false;
						if (!has_normal_time[0])
							timevar_string[0] = tokens[at+has_time_var_calc[0]][0];
						if (!has_normal_time[1])
							timevar_string[1]   = tokens[at_end_time+has_time_var_calc[1]][0]
					} // else: we can not calculate exact times so we use the already applied constants (word_replacement).

					if (minutes_to > minutes_in_day) { // has_normal_time[1] must be true
						selectors.time.push(function(minutes_from, minutes_to, timevar_string, timevar_add) { return function(date) {
							var ourminutes = date.getHours() * 60 + date.getMinutes();

							if (timevar_string[0]) {
								var date_from = eval('SunCalc.getTimes(date, lat, lon).' + timevar_string[0]);
								minutes_from  = date_from.getHours() * 60 + date_from.getMinutes() + timevar_add[0];
							}
							if (timevar_string[1]) {
								var date_to = eval('SunCalc.getTimes(date, lat, lon).' + timevar_string[1]);
								minutes_to  = date_to.getHours() * 60 + date_to.getMinutes() + timevar_add[1];
								minutes_to += minutes_in_day;
								// Needs to be added because it was added by
								// normal times in: if (minutes_to < // minutes_from)
								// above the selector construction.
							}

							if (ourminutes < minutes_from)
								return [false, dateAtDayMinutes(date, minutes_from)];
							else
								return [true, dateAtDayMinutes(date, minutes_to)];
						}}(minutes_from, minutes_to, timevar_string, timevar_add));

						selectors.wraptime.push(function(minutes_from, minutes_to, timevar_string, timevar_add) { return function(date) {
							var ourminutes = date.getHours() * 60 + date.getMinutes();

							if (timevar_string[0]) {
								var date_from = eval('SunCalc.getTimes(date, lat, lon).' + timevar_string[0]);
								minutes_from  = date_from.getHours() * 60 + date_from.getMinutes() + timevar_add[0];
							}
							if (timevar_string[1]) {
								var date_to = eval('SunCalc.getTimes(date, lat, lon).' + timevar_string[1]);
								minutes_to  = date_to.getHours() * 60 + date_to.getMinutes() + timevar_add[1];
								// minutes_in_day does not need to be added.
								// For normal times in it was added in: if (minutes_to < // minutes_from)
								// above the selector construction and
								// subtracted in the selector construction call
								// which returns the selector function.
							}

							if (ourminutes < minutes_to)
								return [true, dateAtDayMinutes(date, minutes_to)];
							else
								return [false, undefined];
						}}(minutes_from, minutes_to - minutes_in_day, timevar_string, timevar_add));
					} else {
						selectors.time.push(function(minutes_from, minutes_to, timevar_string, timevar_add) { return function(date) {
							var ourminutes = date.getHours() * 60 + date.getMinutes();

							if (timevar_string[0]) {
								var date_from = eval('SunCalc.getTimes(date, lat, lon).' + timevar_string[0]);
								minutes_from  = date_from.getHours() * 60 + date_from.getMinutes() + timevar_add[0];
							}
							if (timevar_string[1]) {
								var date_to = eval('SunCalc.getTimes(date, lat, lon).' + timevar_string[1]);
								minutes_to  = date_to.getHours() * 60 + date_to.getMinutes() + timevar_add[1];
							}

							if (ourminutes < minutes_from)
								return [false, dateAtDayMinutes(date, minutes_from)];
							else if (ourminutes < minutes_to)
								return [true, dateAtDayMinutes(date, minutes_to)];
							else
								return [false, dateAtDayMinutes(date, minutes_from + minutes_in_day)];
						}}(minutes_from, minutes_to, timevar_string, timevar_add));
					}

					at = at_end_time + (has_normal_time[1] ? 3 : (has_time_var_calc[1] ? 7 : 1));
				} else {
					throw 'Unexpected token in time range: "' + tokens[at][0] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		// for given date, returns date moved to the start of specified day minute
		function dateAtDayMinutes(date, minutes) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minutes);
		}

		// extract the added or subtracted time of "(sunrise-01:30)"
		// returns in minutes e.g. -90
		function parseTimevarCalc(tokens, at) {
			if ((matchTokens(tokens, at+2, '+') || matchTokens(tokens, at+2, '-'))
					&& matchTokens(tokens, at+3, 'number', 'timesep', 'number', ')')) {
				var add_or_subtract = tokens[at+2][0] == '+' ? '1' : '-1';
				return (tokens[at+3][0] * 60 + tokens[at+5][0]) * add_or_subtract;
			} else {
				throw 'Calculcation with variable time is not in the right syntax.';
			}
		}

		//======================================================================
		// Weekday range parser (Mo,We-Fr,Sa[1-2,-1])
		//======================================================================
		function parseWeekdayRange(tokens, at, selectors) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'weekday', '[')) {
					// Conditional weekday (Mo[3])
					var numbers = [];

					// Get list of constraints
					var endat = parseNumRange(tokens, at+2, function(from, to) {
						if (from == to)
							numbers.push(from);
						else if (from < to)
							for (var i = from; i <= to; i++)
								numbers.push(i);
						else
							throw 'Bad range ' + from + '-' + to;
					});

					if (!matchTokens(tokens, endat, ']'))
						throw '"]" expected';

					week_stable = false;

					// Create selector for each list element
					for (var nnumber = 0; nnumber < numbers.length; nnumber++) {
						// bad number
						if (numbers[nnumber] == 0 || numbers[nnumber] < -5 || numbers[nnumber] > 5)
							throw 'Number between -5 and 5 (except 0) expected';

						selectors.weekday.push(function(weekday, number) { return function(date) {
							var start_of_this_month = new Date(date.getFullYear(), date.getMonth(), 1);
							var start_of_next_month = new Date(date.getFullYear(), date.getMonth() + 1, 1);

							var target_day_this_month;

							if (number > 0) {
								target_day_this_month = dateAtNextWeekday(start_of_this_month, weekday);
								target_day_this_month.setDate(target_day_this_month.getDate() + (number - 1) * 7);
							} else {
								target_day_this_month = dateAtNextWeekday(start_of_next_month, weekday);
								target_day_this_month.setDate(target_day_this_month.getDate() + number * 7);
							}

							if (target_day_this_month.getTime() < start_of_this_month.getTime()
								|| target_day_this_month.getTime() >= start_of_next_month.getTime())
								return [false, start_of_next_month];

							// we hit the target day
							if (date.getDate() == target_day_this_month.getDate())
								return [true, dateAtDayMinutes(date, minutes_in_day)];

							// we're before target day
							if (date.getDate() < target_day_this_month.getDate())
								return [false, target_day_this_month];

							// we're after target day, set check date to next month
							return [false, start_of_next_month];
						}}(tokens[at][0], numbers[nnumber]));
					}

					at = endat + 1;
				} else if (matchTokens(tokens, at, 'weekday')) {
					// Single weekday (Mo) or weekday range (Mo-Fr)
					var is_range = matchTokens(tokens, at+1, '-', 'weekday');

					var weekday_from = tokens[at][0];
					var weekday_to = is_range ? tokens[at+2][0] : weekday_from;

					var inside = true;

					// handle reversed range
					if (weekday_to < weekday_from) {
						var tmp = weekday_to;
						weekday_to = weekday_from - 1;
						weekday_from = tmp + 1;
						inside = false;
					}

					if (weekday_to < weekday_from) {
						// handle full range
						selectors.weekday.push(function(date) { return [true]; });
					} else {
						selectors.weekday.push(function(weekday_from, weekday_to, inside) { return function(date) {
							var ourweekday = date.getDay();

							if (ourweekday < weekday_from || ourweekday > weekday_to) {
								return [!inside, dateAtNextWeekday(date, weekday_from)];
							} else {
								return [inside, dateAtNextWeekday(date, weekday_to + 1)];
							}
						}}(weekday_from, weekday_to, inside));
					}

					at += is_range ? 3 : 1;
				} else if (matchTokens(tokens, at, 'holiday')) {
					at = parseHoliday(tokens, at, selectors);
					week_stable = false;
				} else {
					throw 'Unexpected token in weekday range: "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		// Numeric list parser (1,2,3-4,-1), used in weekday parser above
		function parseNumRange(tokens, at, func) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'number', '-', 'number')) {
					// Number range
					func(tokens[at][0], tokens[at+2][0]);
					at += 3;
				} else if (matchTokens(tokens, at, '-', 'number')) {
					// Negative number
					func(-tokens[at+1][0], -tokens[at+1][0]);
					at += 2
				} else if (matchTokens(tokens, at, 'number')) {
					// Single number
					func(tokens[at][0], tokens[at][0]);
					at++;
				} else {
					throw 'Unexpected token in number range: "' + tokens[at][0] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		// for given date, returns date moved to the specific day of week
		function dateAtNextWeekday(date, day) {
			var delta = day - date.getDay();
			return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta + (delta < 0 ? 7 : 0));
		}

		//======================================================================
		// Holiday parser for public and school holidays (PH,SH)
		// Wrapper function
		//======================================================================
		function parseHoliday(tokens, at, selectors) {
			if (tokens[at][0] == 'PH')
				at = parsePublicHoliday(tokens, at, selectors);
			else
				at = parseSchoolHoliday(tokens, at, selectors);
			return at;
		}

		//======================================================================
		// Holiday parser for public holidays (PH)
		//======================================================================
		function parsePublicHoliday(tokens, at, selectors) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'holiday')) {
					var applying_holidays = getMatchingHoliday(tokens[at][0]);

					selectors.holiday.push(function(applying_holidays) { return function(date) {

						var movableDays = getMovableEventsForYear(date.getFullYear());

						var sorted_holidays = []; // needs to be sorted each time because of movable days

						for (var holiday_name in applying_holidays) {
							if (typeof applying_holidays[holiday_name][0] == 'string') {
								var selected_movableDay = movableDays[applying_holidays[holiday_name][0]];
								if (!selected_movableDay)
									throw 'Movable day ' + applying_holidays[holiday_name][0] + ' can not not be calculated.'
										+ ' Please add the formula how to calculate it.';
								var next_holiday = new Date(selected_movableDay.getFullYear(),
										selected_movableDay.getMonth(),
										selected_movableDay.getDate()
										+ applying_holidays[holiday_name][1]
									);
								if (date.getFullYear() != next_holiday.getFullYear())
									throw 'The movable day ' + applying_holidays[holiday_name][0] + ' plus '
										+ applying_holidays[holiday_name][1]
										+ ' days is not in the year of the movable day anymore. Currently not supported.';
							} else {
								var next_holiday = new Date(date.getFullYear(),
										applying_holidays[holiday_name][0] - 1,
										applying_holidays[holiday_name][1]
									);
							}
							sorted_holidays.push(next_holiday);
						}

						sorted_holidays = sorted_holidays.sort(function(a,b){
							if (a.getTime() < b.getTime()) return -1;
							if (a.getTime() > b.getTime()) return 1;
							return 0;
						});

						var date_num = date.getMonth() * 100 + date.getDate();

						for (var i = 0; i < sorted_holidays.length; i++) {
							var next_holiday_date_num = sorted_holidays[i].getMonth() * 100 + sorted_holidays[i].getDate();
							if (date_num < next_holiday_date_num) {
								return [ false, sorted_holidays[i] ];
							}
							else if (date_num == next_holiday_date_num) {
								return [true, new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) ];
							}
						}

						// continue next year
						return [ false, new Date(sorted_holidays[0].getFullYear() + 1,
								sorted_holidays[0].getMonth(),
								sorted_holidays[0].getDate()) ];

					}}(applying_holidays));

					at += 1;
				} else if (matchTokens(tokens, at, 'weekday')) {
					at = parseWeekdayRange(tokens, at, selectors);
				} else {
					throw 'Unexpected token (public holiday parser): "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		//======================================================================
		// Holiday parser for school holidays (SH)
		//======================================================================
		function parseSchoolHoliday(tokens, at, selectors) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'holiday')) {
					var applying_holidays = getMatchingHoliday(tokens[at][0]);

					var sorted_holidays = []; // needs to be sorted each time because of movable days

					selectors.holiday.push(function(applying_holidays) { return function(date) {
						var date_num = date.getMonth() * 100 + date.getDate();

						// Iterate over holiday array containing the different holiday ranges.
						for (var i = 0; i < applying_holidays.length; i++) {

							var holiday = getSHForYear(applying_holidays[i], date.getFullYear());

							var holiday_from = (holiday[0] - 1) * 100 + holiday[1];
							var holiday_to   = (holiday[2] - 1) * 100 + holiday[3];

							var holiday_ends_next_year = holiday_to < holiday_from;

							if (date_num < holiday_from) { // selected holiday is before the date
								return [ false, new Date(date.getFullYear(), holiday[0] - 1, holiday[1]) ];
							} else if (holiday_from <= date_num && (date_num < holiday_to || holiday_ends_next_year)) {
								return [ true, new Date(date.getFullYear() + holiday_ends_next_year, holiday[2] - 1, holiday[3]) ];
							} else if (holiday_to == date_num) { // selected holiday end is equal to month and day
								if (i + 1 == applying_holidays.length) { // last holidays are handled, continue all over again
									var holiday = getSHForYear(applying_holidays[0], date.getFullYear() + 1);
									return [ false, new Date(date.getFullYear() + !holiday_ends_next_year, holiday[0] - 1, holiday[1]) ];
								} else { // return the start of the next holidays
									var holiday = getSHForYear(applying_holidays[i+1], date.getFullYear());
									return [ false, new Date(date.getFullYear(), holiday[0] - 1, holiday[1]) ];
								}
							}
						}

						return [ false ];

					}}(applying_holidays));

					at += 1;
				} else if (matchTokens(tokens, at, 'weekday')) {
					at = parseWeekdayRange(tokens, at, selectors);
				} else {
					throw 'Unexpected token (school holiday parser): "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		// return the school holiday definition e.g. [ 5, 25, /* to */ 6, 5 ],
		// for the specified year
		function getSHForYear(SH_hash, year) {
			var holiday = SH_hash[year];
			if (typeof holiday == 'undefined') {
				holiday = SH_hash['default']; // applies for any year without explicit definition
				if (typeof holiday == 'undefined')
					throw 'School holiday ' + SH_hash.name + ' has no definition for the year ' + year + '.';
			}
			return holiday;
		}

		// Return closed holiday definition available.
		// First try to get the state, if missing get the country wide holidays
		// (which can be limited to some states).
		function getMatchingHoliday(type_of_holidays) {
			if (typeof location_cc != 'undefined') {
				if (holidays.hasOwnProperty(location_cc)) {
					if (typeof location_state != 'undefined') {
						if (holidays[location_cc][location_state]
								&& holidays[location_cc][location_state][type_of_holidays]) {
							// if holidays for the state are specified use it
							// and ignore lesser specific ones (for the country)
							return holidays[location_cc][location_state][type_of_holidays];
						} else if (holidays[location_cc][type_of_holidays]) {
							// holidays are only defined country wide
							matching_holiday = {}; // holidays in the country wide scope can be limited to certain states
							for (var holiday_name in holidays[location_cc][type_of_holidays]) {
								if (typeof holidays[location_cc][type_of_holidays][holiday_name][2] === 'object') {
									if (-1 != indexOf.call(holidays[location_cc][type_of_holidays][holiday_name][2], location_state))
										matching_holiday[holiday_name] = holidays[location_cc][type_of_holidays][holiday_name];
								} else {
									matching_holiday[holiday_name] = holidays[location_cc][type_of_holidays][holiday_name];
								}
							}
							if (Object.keys(matching_holiday).length == 0)
								throw 'There are no holidays ' + type_of_holidays + ' defined for country ' + location_cc + '.'
									+ ' Please add them.';
							return matching_holiday;
						} else {
							throw 'Holidays ' + type_of_holidays + ' are not defined for country ' + location_cc + '.'
								+ ' Please add them.';
						}
					}
				} else {
					throw 'No holidays are defined for country ' + location_cc + '. Please add them.';
				}
			} else { // we have no idea which holidays do apply because the country code was not provided
				throw 'Country code missing which is needed to select the correct holidays (see README how to provide it)'
			}
		}

		function getMovableEventsForYear(Y) {
			// calculate easter
			var C = Math.floor(Y/100);
			var N = Y - 19*Math.floor(Y/19);
			var K = Math.floor((C - 17)/25);
			var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
			I = I - 30*Math.floor((I/30));
			I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
			var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
			J = J - 7*Math.floor(J/7);
			var L = I - J;
			var M = 3 + Math.floor((L + 40)/44);
			var D = L + 28 - 31*Math.floor(M/4);

			return {
				'easter': new Date(Y, M - 1, D),
			};
		}

		function indexOf(needle) {
			if(typeof Array.prototype.indexOf === 'function') {
				indexOf = Array.prototype.indexOf;
			} else {
				indexOf = function(needle) {
					var i = -1, index = -1;
					for(i = 0; i < this.length; i++) {
						if(this[i] === needle) {
							index = i;
							break;
						}
					}
					return index;
				};
			}
			return indexOf.call(this, needle);
		}

		//======================================================================
		// Year range parser (2013,2016-2018,2020/2)
		//======================================================================
		function parseYearRange(tokens, at) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'year')) {
					var is_range = false, has_period = false;
					if (matchTokens(tokens, at+1, '-', 'year', '/', 'number')) {
						var is_range   = true;
						var has_period = true;
					} else {
						var is_range   = matchTokens(tokens, at+1, '-', 'year');
						var has_period = matchTokens(tokens, at+1, '/', 'number');
					}

					selectors.year.push(function(tokens, at, is_range, has_period) { return function(date) {
						var ouryear = date.getFullYear();
						var year_from = tokens[at][0];
						var year_to = is_range ? tokens[at+2][0] : year_from;

						// handle reversed range
						if (year_to < year_from) {
							var tmp = year_to;
							year_to = year_from;
							year_from = tmp;
						}

						if (has_period) {
							if (year_from <= ouryear) {
								if (is_range) {
									var period = tokens[at+4][0];

									if (year_to < ouryear)
										return [false];
								} else {
									var period = tokens[at+2][0];
								}
								if (period > 0) {
									if (period == 1 && is_range)
										throw 'Please don’t use year ranges with period equals one (see README)';
									if ((ouryear - year_from) % period == 0) {
										return [true, new Date(ouryear + 1, 0, 1)];
									}
									else {
										return [false, new Date(ouryear + period - 1, 0, 1)];
									}
								}
							}
						} else if (is_range) {
							if (year_from <= ouryear && ouryear <= year_to)
								return [true, new Date(year_to + 1, 0, 1)];
						} else if (ouryear == year_from) {
							return [true];
						}

						return [false];

					}}(tokens, at, is_range, has_period));

					at += 1 + (is_range ? 2 : 0) + (has_period ? 2 : 0);
				} else {
					throw 'Unexpected token in year range: "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		//======================================================================
		// Week range parser (week 11-20, week 1-53/2)
		//======================================================================
		function parseWeekRange(tokens, at) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'number')) {
					var is_range = matchTokens(tokens, at+1, '-', 'number'), has_period = false;
					if (is_range) {
						has_period = matchTokens(tokens, at+3, '/', 'number');
						// if (week_stable) {
						// 	if (tokens[at][0] == 1 && tokens[at+2][0] >) // Maximum?
						// 		week_stable = true;
						// 	else
						// 		week_stable = false;
						// } else {
						// 	week_stable = false;
						// }
					}

					selectors.week.push(function(tokens, at, is_range, has_period) { return function(date) {
						var ourweek = Math.floor((date - dateAtWeek(date, 0)) / msec_in_week);

						var week_from = tokens[at][0] - 1;
						var week_to = is_range ? tokens[at+2][0] - 1 : week_from;

						var start_of_next_year = new Date(date.getFullYear() + 1, 0, 1);

						// before range
						if (ourweek < week_from)
							return [false, getMinDate(dateAtWeek(date, week_from), start_of_next_year)];

						// we're after range, set check date to next year
						if (ourweek > week_to)
							return [false, start_of_next_year];

						// we're in range
						var period;
						if (has_period) {
							var period = tokens[at+4][0];
							if (period > 1) {
								var in_period = (ourweek - week_from) % period == 0;
								if (in_period)
									return [true, getMinDate(dateAtWeek(date, ourweek + 1), start_of_next_year)];
								else
									return [false, getMinDate(dateAtWeek(date, ourweek + period - 1), start_of_next_year)];
							}
						}

						return [true, getMinDate(dateAtWeek(date, week_to + 1), start_of_next_year)];
					}}(tokens, at, is_range, has_period));

					at += 1 + (is_range ? 2 : 0) + (has_period ? 2 : 0);
				} else {
					throw 'Unexpected token in week range: "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		function dateAtWeek(date, week) {
			var tmpdate = new Date(date.getFullYear(), 0, 1);
			tmpdate.setDate(1 - (tmpdate.getDay() + 6) % 7 + week * 7); // start of week n where week starts on Monday
			return tmpdate;
		}

		function getMinDate(date /*, ...*/) {
			for (var i = 1; i < arguments.length; i++)
				if (arguments[i].getTime() < date.getTime())
					date = arguments[i];
			return date;
		}

		//======================================================================
		// Month range parser (Jan,Feb-Mar)
		//======================================================================
		function parseMonthRange(tokens, at) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'month')) {
					// Single month (Jan) or month range (Feb-Mar)
					var is_range = matchTokens(tokens, at+1, '-', 'month');

					if (is_range && week_stable) {
						var month_from = tokens[at][0];
						var month_to   = tokens[at+2][0];
						if (month_from == (month_to + 1) % 12)
							week_stable = true;
						else
							week_stable = false;
					} else {
						week_stable = false;
					}

					selectors.month.push(function(tokens, at, is_range) { return function(date) {
						var ourmonth = date.getMonth();
						var month_from = tokens[at][0];
						var month_to = is_range ? tokens[at+2][0] : month_from;

						var inside = true;

						// handle reversed range
						if (month_to < month_from) {
							var tmp = month_to;
							month_to = month_from - 1;
							month_from = tmp + 1;
							inside = false;
						}

						// handle full range
						if (month_to < month_from)
							return [!inside];

						if (ourmonth < month_from || ourmonth > month_to) {
							return [!inside, dateAtNextMonth(date, month_from)];
						} else {
							return [inside, dateAtNextMonth(date, month_to + 1)];
						}
					}}(tokens, at, is_range));

					at += is_range ? 3 : 1;
				} else {
					throw 'Unexpected token in month range: "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		function dateAtNextMonth(date, month) {
			return new Date(date.getFullYear(), month < date.getMonth() ? month + 12 : month);
		}

		//======================================================================
		// Month day range parser (Jan 26-31; Jan 26-Feb 26)
		//======================================================================
		function parseMonthdayRange(tokens, at) {
			for (; at < tokens.length; at++) {
				if (matchTokens(tokens, at, 'month', 'number', '-', 'month', 'number')
						|| matchTokens(tokens, at, 'year', 'month', 'number', '-', 'year', 'month', 'number')) {

					var has_year = matchTokens(tokens, at, 'year');

					selectors.monthday.push(function(tokens, at, has_year) { return function(date) {
						var start_of_next_year = new Date(date.getFullYear() + 1, 0, 1);

						var from_date = new Date((has_year ? tokens[at][0] : date.getFullYear()),
							tokens[at+has_year][0], tokens[at+1+has_year][0]);
						var to_date   = new Date((has_year ? tokens[at+4][0] : date.getFullYear()),
							tokens[at+3+(2*has_year)][0], tokens[at+4+(2*has_year)][0] + 1);

						var inside = true;

						if (to_date < from_date) {
							var tmp = to_date;
							to_date = from_date;
							from_date = tmp;
							inside = false;
						}

						if (date.getTime() < from_date.getTime()) {
							return [!inside, from_date];
						} else if (date.getTime() < to_date.getTime()) {
							return [inside, to_date];
						} else {
							if (has_year)
								return [!inside];
							else
								return [!inside, start_of_next_year];
						}
					}}(tokens, at, has_year));

					at += 5 + has_year * 2;
				} else if (matchTokens(tokens, at, 'month', 'number') || matchTokens(tokens, at, 'year', 'month', 'number')) {
					var has_year = matchTokens(tokens, at, 'year');
					var is_range = matchTokens(tokens, at+2+has_year, '-', 'number'), has_period = false;
					if (is_range)
						has_period = matchTokens(tokens, at+4+has_year, '/', 'number');

					var at_timesep_if_monthRange = at + has_year + 1 // at month number
						+ (is_range ? 2 : 0) + (has_period ? 2 : 0)
						+ !(is_range || has_period); // if not range nor has_period, add one
					if (matchTokens(tokens, at_timesep_if_monthRange, 'timesep'))
						return parseMonthRange(tokens, at);

					selectors.monthday.push(function(tokens, at, is_range, has_period) { return function(date) {
						var start_of_next_year = new Date(date.getFullYear() + 1, 0, 1);

						var from_date = new Date((has_year ? tokens[at][0] : date.getFullYear()),
							tokens[at+has_year][0], tokens[at+1 + has_year][0]);
						var to_date   = new Date(from_date.getFullYear(), from_date.getMonth(),
							tokens[at+(is_range ? 3 : 1)+has_year][0] + 1);

						if (date.getTime() < from_date.getTime())
							return [false, from_date];
						else if (date.getTime() >= to_date.getTime())
							return [false, start_of_next_year];
						else if (!has_period)
							return [true, to_date];

						var period = tokens[at+5][0];
						var nday = Math.floor((date.getTime() - from_date.getTime()) / msec_in_day);
						var in_period = nday % period;

						if (in_period == 0)
							return [true, new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)];
						else
							return [false, new Date(date.getFullYear(), date.getMonth(), date.getDate() + period - in_period)];
					}}(tokens, at, is_range, has_period));

					at += 2 + has_year + (is_range ? 2 : 0) + (has_period ? 2 : 0);
				} else {
					throw 'Unexpected token in monthday range: "' + tokens[at] + '"';
				}

				if (!matchTokens(tokens, at, ','))
					break;
			}

			return at;
		}

		//======================================================================
		// Main selector traversal function
		//======================================================================
		this.getStatePair = function(date) {
			var resultstate = false;
			var changedate;
			var unknown = false;
			var comment = '';

			var date_matching_blocks = [];

			for (var nblock = 0; nblock < blocks.length; nblock++) {
				var matching_date_block = true;

				// Try each date selector type
				for (var ndateselector = 0; ndateselector < blocks[nblock].date.length; ndateselector++) {
					var dateselectors = blocks[nblock].date[ndateselector];

					var has_matching_selector = false;
					for (var datesel = 0; datesel < dateselectors.length; datesel++) {
						var res = dateselectors[datesel](date);
						if (res[0])
							has_matching_selector = true;
						if (typeof changedate === 'undefined' || (typeof res[1] !== 'undefined' && res[1].getTime() < changedate.getTime()))
							changedate = res[1];
					}

					if (!has_matching_selector) {
						matching_date_block = false;
						// We can ignore other date selectors, as the state won't change
						// anyway until THIS selector matches (due to conjunction of date
						// selectors of different types).
						// This is also an optimization, if widest date selector types
						// are checked first.
						break;
					}
				}

				if (matching_date_block) {
					// The following lines implement date overwriting logic (e.g. for
					// "Mo-Fr 10:00-20:00; We 10:00-16:00", We rule overrides Mo-Fr rule.
					if (blocks[nblock].date.length > 0 && (blocks[nblock].meaning || blocks[nblock].unknown) && !blocks[nblock].wrapped)
						date_matching_blocks = [];
					date_matching_blocks.push(nblock);
				}
			}

			for (var nblock = 0; nblock < date_matching_blocks.length; nblock++) {
				var block = date_matching_blocks[nblock];

				// there is no time specified, state applies to the whole day
				if (blocks[block].time.length == 0) {
					resultstate = blocks[block].meaning;
					comment     = blocks[block].comment;
					unknown     = blocks[block].unknown;
				}

				for (var timesel = 0; timesel < blocks[block].time.length; timesel++) {
					var res = blocks[block].time[timesel](date);

					if (res[0]) {
						resultstate = blocks[block].meaning;
						comment     = blocks[block].comment;
						unknown     = blocks[block].unknown;
					}
					if (typeof changedate === 'undefined' || (typeof res[1] !== 'undefined' && res[1] < changedate))
						changedate = res[1];
				}
			}

			return [ resultstate, changedate, unknown, comment ];
		}

		//======================================================================
		// Public interface
		// All functions below are considered public.
		//======================================================================

		//======================================================================
		// Iterator interface
		//======================================================================
		this.getIterator = function(date) {
			return new function(oh) {
				if (typeof date === 'undefined')
					date = new Date();

				var prevstate = [ undefined, date, undefined, '' ];
				var state = oh.getStatePair(date);

				this.getState = function() {
					return state[0];
				}

				this.getUnknown = function() {
					return state[2];
				}

				this.getComment = function() {
					return state[3];
				}

				this.getDate = function() {
					return prevstate[1];
				}

				this.advance = function(datelimit) {
					if (typeof datelimit === 'undefined')
						datelimit = new Date(prevstate[1].getTime() + msec_in_day * 366 * 5);

					do {
						// open range, we won't be able to advance
						if (typeof state[1] === 'undefined')
							return false;

						// console.log('previours check time: ' + prevstate[1] + ', current check time: ' + state[1]);
						// we're going backwards or staying at place
						// this always indicates coding error in a selector code
						if (state[1].getTime() <= prevstate[1].getTime())
							throw 'Fatal: infinite loop in nextChange';

						// don't advance beyond limits (same as open range)
						if (state[1].getTime() >= datelimit.getTime())
							return false;

						// do advance
						prevstate = state;
						state = oh.getStatePair(prevstate[1]);
// console.log('  state continue (prev ' + prevstate[0] + ', curr ' + state[0] +' = '+ (state[0] === prevstate[0]) +'); unknown continue (prev ' + prevstate[2] + ', curr ' + state[2] +' = '+ (state[2] === prevstate[2]) +') at '+ state[1].toLocaleString() );
					} while (state[0] === prevstate[0] && state[2] === prevstate[2]);
					// Comment could also change …
					return true;
				}
			}(this);
		}

		// check whether facility is `open' on the given date (or now)
		this.getState = function(date) {
			var it = this.getIterator(date);
			return it.getState();
		}

		// If the state of a amenity is conditional. Conditions can be expressed in comments.
		// True will only be returned if the state is false as the getState only
		// returns true if the amenity is really open. So you may want to check
		// the resold of getUnknown if getState returned false.
		this.getUnknown = function(date) {
			var it = this.getIterator(date);
			return it.getUnknown();
		}

		// Returns the comment.
		// Most often this will be an empty string as comments are not used that
		// often in OSM yet.
		this.getComment = function(date) {
			var it = this.getIterator(date);
			return it.getComment();
		}

		// returns time of next status change
		this.getNextChange = function(date, maxdate) {
			var it = this.getIterator(date);
			if (!it.advance(maxdate))
				return undefined;
			return it.getDate();
		}

		// return array of open intervals between two dates
		this.getOpenIntervals = function(from, to) {
			var res = [];

			var it = this.getIterator(from);

			if (it.getState() || it.getUnknown())
				res.push([from, undefined, it.getUnknown(), it.getComment()]);

			while (it.advance(to)) {
				if (it.getState() || it.getUnknown())
					res.push([it.getDate(), undefined, it.getUnknown(), it.getComment()]);
				else
					res[res.length - 1][1] = it.getDate();
			}

			if (res.length > 0 && typeof res[res.length - 1][1] === 'undefined')
				res[res.length - 1][1] = to;

			return res;
		}

		// return total number of milliseconds a facility is open without a given date range
		this.getOpenDuration = function(from, to) {
			var open    = 0;
			var unknown = 0;

			var it = this.getIterator(from);
			var prevdate = (it.getState() || it.getUnknown()) ? from : undefined;
			var prevunknown = undefined;

			while (it.advance(to)) {
				if (it.getState() || it.getUnknown()) {
					prevdate    = it.getDate();
					prevunknown = it.getUnknown();
				} else {
					if (prevunknown)
						unknown += it.getDate().getTime() - prevdate.getTime();
					else
						open    += it.getDate().getTime() - prevdate.getTime();
					prevdate = undefined;
				}
			}

			if (typeof prevdate !== 'undefined') {
				if (prevunknown)
					unknown += to.getTime() - prevdate.getTime();
				else
					open    += to.getTime() - prevdate.getTime();
			}

			return [ open, unknown ];
		}

		this.isWeekStable = function() {
			return week_stable;
		}
	}
}));
