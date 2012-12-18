(function (root, factory) {
	if (typeof exports === 'object') {
		// For nodejs
		module.exports = factory();
	} else {
		// For browsers
		root.opening_hours = factory();
	}
}(this, function () {
	return function(value) {
		//======================================================================
		// Constants
		//======================================================================
		var months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
		var weekdays = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

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
		var blocks = value.split(/\s*;\s*/);

		for (var block = 0; block < blocks.length; block++) {
			var tokens = tokenize(blocks[block]);

			var selectors = {
				time: [],
				weekday: [],

				meaning: true,
			};

			parseGroup(tokens, 0, selectors);

			blocks[block] = selectors;
		}

		// Tokenization function: splits string into parts
		// output: array of pairs [content, type]
		function tokenize(value) {
			var tokens = new Array();

			while (value != '') {
				var tmp;
				if (tmp = value.match(/^(?:week|24\/7|off)/)) {
					// reserved word
					tokens.push([tmp[0], tmp[0]]);
					value = value.substr(tmp[0].length)
				} else if (tmp = value.match(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/)) {
					// month name
					tokens.push([months[tmp[0]], 'month']);
					value = value.substr(3);
				} else if (tmp = value.match(/^(?:Mo|Tu|We|Th|Fr|Sa|Su)/)) {
					// weekday name
					tokens.push([weekdays[tmp[0]], 'weekday']);
					value = value.substr(2);
				} else if (tmp = value.match(/^\d+/)) {
					// number
					tokens.push([tmp[0], 'number']);
					value = value.substr(tmp[0].length);
				} else if (value.match(/^\s/)) {
					// whitespace are fixed
					value = value.substr(1)
				} else {
					// other single-character tokens
					tokens.push([value[0], value[0]]);
					value = value.substr(1)
				}
			}

			return tokens;
		}

		// Function to check token array for specific pattern
		function matchTokens(tokens, at, match) {
			for (var i = 0; i < match.length; i++) {
				if (typeof tokens[at + i] === 'undefined')
					return false;
				if (tokens[at + i][1] !== match[i])
					return false;
			}

			return true;
		}

		//======================================================================
		// Top-level parser
		//======================================================================
		function parseGroup(tokens, at, selectors) {
			while (at < tokens.length) {
				if (tokens[at][1] == 'weekday') {
					at = parseWeekdayRange(tokens, at, selectors);
				} else if (tokens[at][1] == 'month' && tokens[at+1][1] == 'number') {
					at = parseMonthDayRange(tokens, at);
				} else if (tokens[at][1] == 'month') {
					at = parseMonthRange(tokens, at);
				} else if (tokens[at][0] == 'week') {
					at = parseWeekRange(tokens, at);
				} else if (tokens[at][1] == 'number') {
					at = parseTimeRange(tokens, at, selectors);
				} else if (tokens[at][0] == 'off') {
					selectors.meaning = false;
					at++;
				} else if (tokens[at][0] == '24/7') {
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
			while (at < tokens.length) {
				if (tokens[at][1] == 'number' && tokens[at+1][0] == ':' && tokens[at+2][1] == 'number' && tokens[at+3][0] == '-' && tokens[at+4][1] == 'number' && tokens[at+5][0] == ':' && tokens[at+6][1] == 'number') {
					// Time range
					selectors.time.push(function(tokens, at) { return function(date) {
						var ourminutes = date.getHours() * 60 + date.getMinutes();
						var minutes_from = tokens[at][0] * 60 + tokens[at+2][0] * 1;
						var minutes_to = tokens[at+4][0] * 60 + tokens[at+6][0] * 1;

						if (ourminutes < minutes_from) {
							var eventdate = new Date(date);
							eventdate.setHours(0, minutes_from, 0, 0);
							return [false, eventdate];
						} else if (ourminutes < minutes_to) {
							var eventdate = new Date(date);
							eventdate.setHours(0, minutes_to, 0, 0);
							return [true, eventdate];
						} else {
							var eventdate = new Date(date);
							eventdate.setHours(0, minutes_from, 0, 0);
							eventdate.setDate(eventdate.getDate()+1);
							return [false, eventdate];
						}
					}}(tokens, at));

					at += 7;
				} else {
					throw 'Unexpected token in time range: "' + tokens[at][0] + '"';
				}

				if (at >= tokens.length)
					break;

				if (tokens[at][0] == ',')
					at++;
				else
					break;

			}

			return at;
		}

		// for given date, returns date moved to the start of specified day minute
		function dateAtNextDayMinutes(date, minutes) {
			var tmpdate = new Date(date);
			tmpdate.setHours(0, minutes, 0, 0);
			return tmpdate;
		}

		//======================================================================
		// Weekday range parser (Mo,We-Fr,Sa[1-2,-1])
		//======================================================================
		function parseWeekdayRange(tokens, at, selectors) {
			while (at < tokens.length) {
				if (tokens[at][1] == 'weekday' && tokens[at+1][0] == '-' && tokens[at+2][1] == 'weekday') {
					// Weekday range (Mo-Fr)
					selectors.weekday.push(function(tokens, at) { return function(date) {
						var ourweekday = date.getDay();
						var weekday_from = tokens[at][0];
						var weekday_to = tokens[at+2][0];

						if (weekday_from <= weekday_to) {
							if (ourweekday < weekday_from || ourweekday > weekday_to) {
								return [false, dateAtNextWeekday(date, weekday_from)];
							} else {
								return [true, dateAtNextWeekday(date, weekday_to + 1)];
							}
						} else {
							if (ourweekday <= weekday_to || ourweekday >= weekday_from) {
								return [true, dateAtNextWeekday(date, weekday_to + 1)];
							} else {
								return [false, dateAtNextWeekday(date, weekday_from)];
							}
						}
					}}(tokens, at));

					at += 3;
				} else if (tokens[at][1] == 'weekday' && tokens[at+1][0] == '[') {
					// Conditional weekday (Mo[3])
					at = parseNumRange(tokens, at+2);
				} else if (tokens[at][1] == 'weekday') {
					// Single weekday (Mo)
					selectors.weekday.push(function(tokens, at) { return function(date) {
						var ourweekday = date.getDay();
						var weekday_at = tokens[at][0];

						if (ourweekday == weekday_at) {
							return [true, dateAtNextWeekday(date, weekday_at + 1)];
						} else {
							return [false, dateAtNextWeekday(date, weekday_at)];
						}
					}}(tokens, at));

					at++;
				} else {
					throw 'Unexpected token in weekday range: "' + tokens[at] + '"';
				}

				if (at >= tokens.length)
					break;

				if (tokens[at][0] == ',')
					at++;
				else
					break;
			}

			return at;
		}

		// Numeric list parser (1,2,3-4,-1), used in weekday parser above
		function parseNumRange(tokens, at) {
			while (at < tokens.length) {
				if (tokens[at][1] == 'number' && tokens[at+1][0] == '-' && tokens[at+2][1] == 'number') {
					// Number range
					at += 3;
				} else if (tokens[at][0] == '-' && tokens[at+1][1] == 'number') {
					// Negative number
					at += 2
				} else if (tokens[at][1] == 'number') {
					// Single number
					at++;
				} else {
					throw 'Unexpected token in number range: "' + tokens[at][0] + '"';
				}

				if (at >= tokens.length)
					break;

				if (tokens[at][0] == ',') {
					at++;
				} else if (tokens[at][0] == ']') {
					at++;
					break;
				}
			}

			return at;
		}

		// for given date, returns date moved to the specific day of week
		function dateAtNextWeekday(date, day) {
			var tmpdate = new Date(date);

			if (tmpdate.getDay() < day)
				tmpdate.setDate(tmpdate.getDate() + day - tmpdate.getDay());
			else if (tmpdate.getDay() > day)
				tmpdate.setDate(tmpdate.getDate() + 7 + day - tmpdate.getDay());

			tmpdate.setHours(0, 0, 0, 0);

			return tmpdate;
		}

		//======================================================================
		// Month range parser (Jan,Feb-Mar)
		//======================================================================
		function parseMonthDayRange(tokens, at) {
			return at + 1;
		}

		//======================================================================
		// Main selector traversing function
		//======================================================================
		function getState(date) {
			if (typeof date === 'undefined')
				date = new Date();

			var resultstate = false;
			var changedate;

			var dateseltypes = [ 'weekday' ];
			var date_matching_blocks = [];

			for (var block = 0; block < blocks.length; block++) {
				var has_date_selectors = false;
				var matching_date_block = true;

				// Try each date selector type
				for (var dateseltype = 0; dateseltype < dateseltypes.length; dateseltype++) {
					var dateselectors = blocks[block][dateseltypes[dateseltype]];
					if (dateselectors.length > 0)
						has_date_selectors = true;
					var has_matching_selector = false;
					for (var datesel = 0; datesel < dateselectors.length; datesel++) {
						var res = dateselectors[datesel](date);
						if (res[0])
							has_matching_selector = true;
						if (typeof changedate === 'undefined' || (typeof res[1] !== 'undefined' && res[1] < changedate))
							changedate = res[1];
					}

					if (has_date_selectors && !has_matching_selector) {
						matching_date_block = false;
						// XXX: do we need to break here, or we need to adjust time?
					}
				}

				if (matching_date_block) {
					if (has_date_selectors && blocks[block].meaning)
						date_matching_blocks = [];
					date_matching_blocks.push(block);
				}
			}

			for (var nblock = 0; nblock < date_matching_blocks.length; nblock++) {
				var block = date_matching_blocks[nblock];

				for (var timesel = 0; timesel < blocks[block].time.length; timesel++) {
					var res = blocks[block].time[timesel](date);
					if (res[0])
						resultstate = blocks[block].meaning;
					if (typeof changedate === 'undefined' || (typeof res[1] !== 'undefined' && res[1] < changedate))
						changedate = res[1];
				}
			}

			return [ resultstate, changedate ];
		}

		//======================================================================
		// Public interface
		//======================================================================

		// check whether facility is `open' on the given date (or now)
		this.isOpen = function(date) {
			return getState(date)[0];
		}

		// returns time of next status change
		this.nextChange = function(date) {
			var state = getState(date);
			var firststate = state;
			var prevstate;
			var maxdelta = 60*60*24*365*1000;
			do {
				prevstate = state;
				state = getState(prevstate[1]);

				// this indicates error in some selector generating code above
				if (state[1].getTime() <= prevstate[1].getTime())
					throw "Fatal: infinite loop in nextChange";

				// this may happen if the facility is always open/closed,
				// we may need a better way of checking for that
				if (state[1].getTime() - firststate[1].getTime() > maxdelta)
					return undefined;
			} while (state[0] === prevstate[0]);
			return prevstate[1];
		}
	}
}));
