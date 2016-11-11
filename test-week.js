#!/usr/bin/env nodejs

// preamble {{{

/* Parameter handling {{{ */
var optimist = require('optimist')
    .usage('Usage: $0 [optional parameters]')
    .describe('h', 'Display the usage')
    // .describe('v', 'Verbose output')
    .describe('f', 'File path to the opening_hours.js libary file to run the tests against.')
    .describe('l', 'Locale for error/warning messages and prettified values.')
    .alias('h', 'help')
    // .alias('v', 'verbose')
    .alias('f', 'library-file')
    .alias('l', 'locale')
    .default('f', './opening_hours.js')
    .default('l', 'en');

var argv = optimist.argv;

if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}
/* }}} */

/* Required modules {{{ */
var opening_hours = require('./' + argv['library-file']);
var colors = require('colors');
var sprintf = require('sprintf-js').sprintf;
var timekeeper = require('timekeeper');
var moment = require('moment');
/* }}} */

colors.setTheme({
    passed: ['green', 'bold'], // printed with console.log
    warn: ['blue', 'bold'], // printed with console.info
    failed: ['red', 'bold'], // printed with console.warn
    crashed: ['magenta', 'bold'], // printed with console.error
    ignored: ['yellow', 'bold'],
});

/* Fake time to make "The year is in the past." test deterministic. */
timekeeper.travel(new Date('Sat May 23 2015 23:23:23 GMT+0200 (CEST)')); // Travel to that date.

var test = new opening_hours_test();

// test.extensive_testing = true;
// FIXME: Do it.

// nominatimJSON {{{

var nominatim_for_loc = require('./js/nominatim_definitions.js').for_loc;

/* Used for sunrise, sunset … and PH,SH.
 * Do not define new nominatim responses below and instead define them in
 * ./js/nominatim_definitions.js
 */

/* Used in the README and other places.
 * Those values must be perfectly valid and not return any warnings,
 * regardless of the warnings_severity.
 */

/* Avoid the warning that no time selector was used in a rule. Use this if you
 * are checking for values which should return another warning.
 * warning.
 */

var toTime = moment(new Date()).add(1, 'day').hours(23).minutes(59).seconds(0).milliseconds(0);
var isOddWeekStart = (toTime % 2 === 0) ? '01' : '02';

test.addTest('Week range. Working with Objects not Strings. from = new Date(Date())', [
    'week ' + isOddWeekStart + '-53/2 Mo-Su 07:30-08:00',
], moment(new Date()), toTime.toDate(), [
    [toTime.hours(7).minutes(30).toDate(), toTime.hours(8).minutes(0).toDate()],
], 1800000, 0, false);

test.addTest('Week range. Working with Objects not Strings. from = new Date()', [
    'week ' + isOddWeekStart + '-53/2 Mo-Su 07:30-08:00',
], new Date(), toTime, [
    [toTime.hours(7).minutes(30).toDate(), toTime.hours(8).minutes(0).toDate()],
], 1800000, 0, false);

process.exit(test.run() ? 0 : 1);

//======================================================================
// Test framework {{{
//======================================================================
function opening_hours_test() {
    this.show_passing_tests = true;
    // False: Can also be achieved by running make test 1>/dev/null which redirects stdout to /dev/null.
    // Note that these two variants are not quite the same.
    this.show_error_warnings = true; // Enable this if you want to see what errors and warnings the library reports.
    // By default enabled to see changes in the warning message. Now that the
    // log is version controlled it is easy to keep track of changes.
    this.tests = [];
    this.tests_should_fail = [];
    this.tests_should_warn = [];
    this.tests_comp_matching_rule = [];
    this.tests_prettify_value = [];
    this.tests_equal_to = [];

    this.extensive_testing = false;
    // If set to true, to run extensive tests.
    // This mainly finds bugs in selector code but is slow.

    this.last = false; // If set to true, no more tests are added to the testing queue.
    // This might be useful for testing to avoid to comment tests out and something like that …

    this.runSingleTestShouldFail = function (test_data_object) { /* {{{ */
        var name = test_data_object[0],
            value = test_data_object[1],
            nominatimJSON = test_data_object[2],
            oh_mode = test_data_object[3];
        try {
            // Since they should fail anyway we can give them the nominatimTestJSON.
            oh = new opening_hours(value, nominatimJSON, oh_mode);

            crashed = false;
        } catch (err) {
            crashed = err;
        }

        var passed = false;
        var str = '"' + name + '" for "'
            + (typeof value === 'string'
                    ? value.replace('\n', '*newline*')
                    : value
            )
            + '": ';
        if (crashed) {
            str += 'PASSED'.passed;
            passed = true;

            if (this.show_passing_tests) {
                console.log(str);
                if (this.show_error_warnings)
                    console.info(crashed + '\n');
            }
        } else {
            str += 'FAILED'.failed;
            console.warn(str);
        }

        return crashed;
    };
    /* }}} */

    this.runSingleTestShouldThrowWarning = function (test_data_object) { /* {{{ */
        var name = test_data_object[0],
            value = test_data_object[1],
            nominatimJSON = test_data_object[2],
            oh_mode = test_data_object[3];
        var ignored = typeof value !== 'string';
        if (ignored) {
            this.ignored.push(value);
            ignored = value[1];
            value = value[0];
        }

        var warnings, oh;
        try {
            oh = new opening_hours(value, nominatimJSON, oh_mode);

            warnings = oh.getWarnings();
            crashed = false;
        } catch (err) {
            crashed = err;
        }

        var passed = false;
        var str = '"' + name + '" for "'
            + (typeof value === 'string'
                    ? value.replace('\n', '*newline*')
                    : value
            )
            + '": ';
        if (!crashed && warnings.length > 0) {
            str += 'PASSED'.passed;
            passed = true;
            if (this.show_passing_tests) {
                console.log(str);
                this.print_warnings(warnings);
            }
            passed = true;
        } else if (ignored) {
            str += 'IGNORED'.ignored + ', reason: ' + ignored;
            passed = true;
            console.log(str);
            this.print_warnings(warnings);
        } else {
            str += 'FAILED'.failed;
            console.warn(str);
            this.print_warnings(warnings);
            if (this.show_error_warnings)
                console.error(crashed + '\n');
        }
        return passed;
    };
    /* }}} */

    this.runSingleTest = function (test_data_object) { /* {{{ */
        var name = test_data_object[0],
            value = test_data_object[1],
            first_value = test_data_object[2],
            from = test_data_object[3],
            to = test_data_object[4],
            expected_intervals = test_data_object[5],
            expected_durations = test_data_object[6],
            expected_weekstable = test_data_object[7],
            nominatimJSON = test_data_object[8],
            oh_mode = test_data_object[9];

        // fix from and to dates
        if (!(from instanceof Date)) {
            from = new Date(from);
        }
        if (!(to instanceof Date)) {
            to = new Date(to);
        }

        var ignored = typeof value !== 'string';
        if (ignored) {
            this.ignored.push(value);
            ignored = value[1];
            value = value[0];
        }

        var oh, intervals, durations, weekstable, prettified, intervals_ok, duration_ok, weekstable_ok, prettify_ok, crashed = true;

        var warnings;
        try {
            oh = new opening_hours(value, nominatimJSON, oh_mode);

            warnings = oh.getWarnings();

            intervals = oh.getOpenIntervals(from, to);
            durations = oh.getOpenDuration(from, to);
            weekstable = oh.isWeekStable();

            var prettifyValue_argument_hash = {};
            prettified = oh.prettifyValue(prettifyValue_argument_hash);

            intervals_ok = typeof expected_intervals === 'undefined' || intervals.length === expected_intervals.length;
            duration_ok = (typeof expected_durations[0] === 'undefined' || durations[0] === expected_durations[0])
                && (typeof expected_durations[1] === 'undefined' || durations[1] === expected_durations[1]);
            weekstable_ok = typeof expected_weekstable === 'undefined' || weekstable === expected_weekstable;
            prettify_ok = typeof prettified === 'undefined' || prettified === value || prettified === first_value;

            crashed = false;
        } catch (err) {
            crashed = err;
        }

        for (var interval = 0; interval < expected_intervals.length; interval++) {

            var expected_from = new Date(expected_intervals[interval][0]);
            var expected_to = new Date(expected_intervals[interval][1]);

            if (intervals_ok) {
                if (intervals[interval][0].getTime() !== expected_from.getTime()
                    || intervals[interval][1].getTime() !== expected_to.getTime()
                    || (typeof expected_intervals[interval][2] !== 'boolean' // unknown state boolean
                    && intervals[interval][2] !== expected_intervals[interval][2])
                    || (typeof intervals[interval][3] === 'string'
                    && intervals[interval][3] !== expected_intervals[interval][3])
                ) {

                    intervals_ok = false;
                }
            }

            if (this.extensive_testing && !crashed) {

                var oh = new opening_hours(value, nominatimJSON, oh_mode);

                for (var move_date = expected_from; move_date.getTime() < expected_to.getTime(); move_date.setHours(move_date.getHours() + 1)) {
                    var is_open = oh.getState(move_date);
                    var unknown = oh.getUnknown(move_date);

                    if (!is_open ||
                        (
                            typeof expected_intervals[interval][2] === 'boolean' // unknown state boolean
                            && unknown !== expected_intervals[interval][2]
                        )
                    ) {

                        console.error("Error for '" + value + "' at " + move_date + ".");

                    }
                }
            }

        }

        var passed = false;
        var str = '"' + name + '" for "' + value + '": ';
        var failed = false;
        if (intervals_ok
            && duration_ok
            && (prettify_ok || ignored === 'prettifyValue')
            && (weekstable_ok || ignored === 'check for week stable not implemented')) { // replace 'check for week stable not implemented'.
            str += 'PASSED'.passed;
            if (ignored) {
                if (ignored === 'check for week stable not implemented') {
                    str += ', ' + 'except'.ignored + ' weekstable which is ignored for now';
                } else if (ignored === 'prettifyValue') {
                    str += ', ' + 'except'.ignored + ' prettifyValue';
                    if (prettify_ok)
                        str += ' Ignored but passes!';
                } else {
                    str += ', ' + 'also ignored, please unignore since the test passes!'.ignored;
                    if (weekstable_ok)
                        str += ' Ignored but passes!';
                }
            }
            passed = true;
            // if (this.show_passing_tests) {
            console.log(str);
            // }
            this.print_warnings(warnings);
        } else if (ignored && (
                ignored !== 'prettifyValue'
                || ignored === 'check for week stable not implemented'
            )
        ) {

            str += 'IGNORED'.ignored + ', reason: ' + ignored;
            console.warn(str);
            passed = true;
        } else if (crashed) {
            str += 'CRASHED'.crashed + ', reason: ' + crashed;
            console.error(str);
        } else {
            str += 'FAILED'.failed;
            if (!duration_ok)
                str += ', bad duration(s): ' + durations + ', expected ' + expected_durations;
            if (!intervals_ok)
                str += ', bad intervals: \n' + intervalsToString(intervals) + '\nexpected:\n' + intervalsToString(expected_intervals);
            if (!weekstable_ok)
                str += ', bad weekstable flag: ' + weekstable + ', expected ' + expected_weekstable;
            if (!prettify_ok)
                str += ', bad prettified value: "' + prettified + '", expected either value or "' + first_value + '"';
            failed = true;

            console.warn(str);
            this.print_warnings(warnings);
        }

        return passed;
    };
    /* }}} */

    this.runSingleTestCompMatchingRule = function (test_data_object) { /* {{{ */
        var name = test_data_object[0],
            value = test_data_object[1],
            point_in_time = test_data_object[2],
            expected_matching_rule = test_data_object[3],
            nominatimJSON = test_data_object[4];
        var matching_rule, matching_rule_ok;
        try {
            // since they should fail anyway we can give them the nominatimTestJSON
            oh = new opening_hours(value, nominatimJSON);
            it = oh.getIterator(new Date(point_in_time));

            matching_rule = oh.prettifyValue({rule_index: it.getMatchingRule()});
            matching_rule_ok = matching_rule === expected_matching_rule;

            var passed = false;

            crashed = false;
        } catch (err) {
            crashed = err;
        }

        var str = '"' + name + '" for "' + value.replace('\n', '*newline*') + '": ';
        if (!crashed && matching_rule_ok) {
            str += 'PASSED'.passed;
            passed = true;

            if (this.show_passing_tests)
                console.log(str);
        } else if (crashed) {
            str += 'CRASHED'.crashed + ', reason: ' + crashed;
            console.error(str);
        } else {
            str += 'FAILED'.failed + ' for time ' + new Date(point_in_time);
            str += ', bad matching rule: "' + matching_rule + '", expected "' + expected_matching_rule + '"';
            console.warn(str);
        }

        return passed;
    };
    /* }}} */

    this.runSingleTestPrettifyValue = function (test_data_object) { /* {{{ */
        var name = test_data_object[0],
            value = test_data_object[1],
            prettify_locale = test_data_object[2],
            expected_prettified_value = test_data_object[3];
        var prettify_value_ok;
        try {
            oh = new opening_hours(value, nominatimTestJSON);

            prettified_value = oh.prettifyValue({'conf': {'locale': prettify_locale}});
            prettify_value_ok = prettified_value === expected_prettified_value;

            var passed = false;

            crashed = false;
        } catch (err) {
            crashed = err;
        }

        var str = '"' + name + '" for "' + value.replace('\n', '*newline*') + '": ';
        if (!crashed && prettify_value_ok) {
            str += 'PASSED'.passed;
            passed = true;

            if (this.show_passing_tests)
                console.log(str);
        } else if (crashed) {
            str += 'CRASHED'.crashed + ', reason: ' + crashed;
            console.error(str);
        } else {
            str += 'FAILED'.failed + ', prettify value: "' + prettified_value + '", expected "' + expected_prettified_value + '"';
            console.warn(str);
        }

        return passed;
    };
    /* }}} */

    this.runSingleTestEqualTo = function (test_data_object) { /* {{{ */
        var name = test_data_object[0],
            first_value = test_data_object[1],
            second_value = test_data_object[2],
            expected_result = test_data_object[3];

        var passed = false;
        var crashed = true;
        var actual_result;
        try {
            first_oh = new opening_hours(first_value, nominatimTestJSON);
            second_oh = new opening_hours(second_value, nominatimTestJSON);

            actual_result = first_oh.isEqualTo(second_oh, new Date('Sat Oct 17 2015 18:20:29 GMT+0200 (CEST)'));

            crashed = false;
        } catch (err) {
            crashed = err;
        }
        // console.log(JSON.stringify(actual_result, null, '    '));

        var str = '"' + name + '" for "' + first_value.replace('\n', '*newline*') + '": ';
        if (!crashed && JSON.stringify(expected_result) === JSON.stringify(actual_result)) {
            str += 'PASSED'.passed;
            passed = true;

            if (this.show_passing_tests)
                console.log(str);
        } else if (crashed) {
            str += 'CRASHED'.crashed + ', reason: ' + crashed;
            console.error(str);
        } else {
            str += 'FAILED'.failed + ', result: "' + JSON.stringify(actual_result, null, '    ') + '", expected "' + expected_result + '"';
            console.warn(str);
        }

        return passed;
    };
    /* }}} */

    // }}}

    // run all tests (public function) {{{
    this.run = function () {
        var tests_length = this.tests.length +
            this.tests_should_fail.length +
            this.tests_should_warn.length +
            this.tests_comp_matching_rule.length +
            this.tests_prettify_value.length +
            this.tests_equal_to.length;
        var success = 0;
        this.ignored = [];
        for (var test = 0; test < this.tests.length; test++) {
            if (this.runSingleTest(this.tests[test]))
                success++;
        }
        for (var test = 0; test < this.tests_should_warn.length; test++) {
            if (this.runSingleTestShouldThrowWarning(this.tests_should_warn[test]))
                success++;
        }
        for (var test = 0; test < this.tests_should_fail.length; test++) {
            if (this.runSingleTestShouldFail(this.tests_should_fail[test]))
                success++;
        }
        for (var test = 0; test < this.tests_comp_matching_rule.length; test++) {
            if (this.runSingleTestCompMatchingRule(this.tests_comp_matching_rule[test]))
                success++;
        }
        for (var test = 0; test < this.tests_prettify_value.length; test++) {
            if (this.runSingleTestPrettifyValue(this.tests_prettify_value[test]))
                success++;
        }
        for (var test = 0; test < this.tests_equal_to.length; test++) {
            if (this.runSingleTestEqualTo(this.tests_equal_to[test]))
                success++;
        }

        console.warn(success + '/' + tests_length + ' tests passed. ' + (tests_length - success) + " did not pass.");
        if (this.ignored.length) {
            console.warn(this.ignored.length + ' test' + (this.ignored.length === 1 ? ' was' : 's where') + ' (partly) ignored, sorted by commonness:');
            var ignored_categories = [];
            for (var i = 0; i < this.ignored.length; i++) {
                var value = this.ignored[i][0];
                var reason = this.ignored[i][1];
                if (typeof ignored_categories[reason] !== 'number') {
                    ignored_categories[reason] = 1;
                } else {
                    ignored_categories[reason]++;
                }
            }

            var sorted_ignores = [];
            for (var key in ignored_categories)
                sorted_ignores.push([key, ignored_categories[key]]);

            sorted_ignores.sort(function (a, b) {
                return a[1] > b[1] ? -1 : (a[1] < b[1] ? 1 : 0);
            });
            for (var i = 0; i < sorted_ignores.length; i++) {
                var reason = sorted_ignores[i][0];
                var count = sorted_ignores[i][1];
                switch (reason) {
                    case 'prettifyValue':
                        reason += " (most of the cases this is used to test if values with selectors in wrong order or wrong symbols (error tolerance) are evaluated correctly)";
                        break;
                }
                console.warn(sprintf('* %2s: %s', count, reason));
            }
        }

        return success === tests_length;
    };
    // }}}

    // add normal test queue {{{
    this.addTest = function (name, values, from, to, expected_intervals, expected_duration, expected_unknown_duration, expected_weekstable, nominatimJSON, last, oh_mode) {

        if (this.last === true) return;
        this.handle_only_test(last);

        oh_mode = get_oh_mode_parameter(oh_mode);

        for (var expected_interval = 0; expected_interval < expected_intervals.length; expected_interval++) {
            // Set default of unknown to false. If you expect something else you
            // will have to specify it.
            if (typeof expected_intervals[expected_interval][2] === 'undefined')
                expected_intervals[expected_interval][2] = false;
        }
        if (typeof values === 'string')
            tests.push([name, values, values, from, to, expected_intervals,
                [expected_duration, expected_unknown_duration], expected_weekstable, nominatimJSON, oh_mode]);
        else
            for (var value_ind = 0; value_ind < values.length; value_ind++)
                this.tests.push([name, values[value_ind], values[0], from, to, expected_intervals,
                    [expected_duration, expected_unknown_duration], expected_weekstable, nominatimJSON, oh_mode]);
    };
    // }}}

    // add test which should fail {{{
    this.addShouldFail = function (name, values, nominatimJSON, last, oh_mode) {
        if (this.last === true) {
            return;
        }
        this.handle_only_test(last);

        oh_mode = get_oh_mode_parameter(oh_mode);

        if (typeof values === 'string')
            this.tests_should_fail.push([name, values, nominatimJSON, oh_mode]);
        else
            for (var value_ind = 0; value_ind < values.length; value_ind++)
                this.tests_should_fail.push([name, values[value_ind], nominatimJSON, oh_mode]);
    };
    // }}}

    // add test which should give a warning {{{
    this.addShouldWarn = function (name, values, nominatimJSON, last, oh_mode) {
        if (this.last === true) {
            return;
        }
        this.handle_only_test(last);

        oh_mode = get_oh_mode_parameter(oh_mode);

        if (typeof values === 'string')
            this.tests_should_warn.push([name, values, nominatimJSON, oh_mode]);
        else
            for (var value_ind = 0; value_ind < values.length; value_ind++)
                this.tests_should_warn.push([name, values[value_ind], nominatimJSON, oh_mode]);
    };
    // }}}

    // add test to check if the matching rule is evaluated correctly {{{
    this.addCompMatchingRule = function (name, values, date, matching_rule, nominatimJSON, last) {
        if (this.last === true) {
            return;
        }
        this.handle_only_test(last);

        if (typeof values === 'string')
            this.tests_comp_matching_rule.push([name, values, date, matching_rule, nominatimJSON]);
        else
            for (var value_ind = 0; value_ind < values.length; value_ind++)
                this.tests_comp_matching_rule.push([name, values[value_ind], date, matching_rule, nominatimJSON]);
    };
    // }}}

    // add test to check if prettifyValue feature works {{{
    this.addPrettifyValue = function (name, values, only_test_for_locale, expected_prettified_value, last) {
        if (this.last === true) {
            return;
        }
        this.handle_only_test(last);

        if (
            typeof only_test_for_locale === 'string'
            && (argv.locale === only_test_for_locale || only_test_for_locale === 'all')
        ) {

            if (typeof values === 'string') {
                this.tests_prettify_value.push([name, values, only_test_for_locale, expected_prettified_value]);
            } else {
                for (var value_ind = 0; value_ind < values.length; value_ind++)
                    this.tests_prettify_value.push([name, values[value_ind], only_test_for_locale, expected_prettified_value]);
            }
        }
    };
    // }}}

    // add test to check if two oh values are equal {{{
    this.addEqualTo = function (name, first_values, second_value, expected_result, last) {
        if (this.last === true) {
            return;
        }
        this.handle_only_test(last);

        if (typeof first_values === 'string') {
            this.tests_equal_to.push([name, first_values, second_value, expected_result]);
        } else if (typeof first_values === 'object') {
            for (var value_ind = 0; value_ind < first_values.length; value_ind++)
                this.tests_equal_to.push([name, first_values[value_ind], second_value, expected_result]);
        } else {
            throw "first_values must be either a string or a object!";
        }
    };
    // }}}

    // helpers {{{
    function intervalsToString(intervals) { /* {{{ */
        var res = '';

        if (intervals.length === 0)
            return '(none)';

        for (var interval = 0; interval < intervals.length; interval++) {
            var item = intervals[interval];
            var from = formatDate(item[0]);
            var to = formatDate(item[1]);
            var comment = typeof item[3] !== 'undefined' ? '\'' + item[3] + '\'' : item[3];

            if (interval !== 0)
                res += '\n';

            res += '[ \'' + from + '\', \'' + to + '\', ' + item[2] + ', ' + comment + ' ],';
        }

        return res;
    }

    // }}}

    function get_oh_mode_parameter(oh_mode) {
        if (typeof oh_mode === 'number') {
            oh_mode = {
                'mode': oh_mode,
                'locale': argv.locale,
            };
        } else if (oh_mode === 'test for failure') {
            // Do nothing.
        } else if (typeof oh_mode !== 'object') {
            oh_mode = {
                'locale': argv.locale,
            };
        } else if (typeof oh_mode['locale'] !== 'string') {
            oh_mode['locale'] = argv.locale;
        }
        return oh_mode;
    }

    function formatDate(date) { /* {{{ */
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

    // }}}

    this.handle_only_test = function (last) { /* {{{ */
        if (last === 'only test') {
            this.tests = [];
            this.tests_should_fail = [];
            this.tests_should_warn = [];
            this.tests_comp_matching_rule = [];
            this.tests_prettify_value = [];
        }
        if (last === 'only test' || last === 'last test') this.last = true;
    };
    // }}}

    this.print_warnings = function (warnings) { /* {{{ */
        if (this.show_error_warnings && typeof warnings === 'object' && warnings.length > 0) {
            console.info('With ' + 'warnings'.warn + ':\n\t*' + warnings.join('\n\t*'));
        }
    };
    // }}}
    // }}}
}

// Public helper functions. {{{
function ignored(value, reason) {
    if (typeof reason === 'undefined')
        reason = 'not implemented yet';
    return [value, reason];
}
// }}}
// }}}
// vim: set ts=4 sw=4 tw=78 et :
