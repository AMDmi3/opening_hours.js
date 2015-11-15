#!/usr/bin/env nodejs
/* Info, license and author {{{
 * @license AGPLv3 <https://www.gnu.org/licenses/agpl-3.0.html>
 * @author Copyright (C) 2015 Robin Schneider <ypid@riseup.net>
 *
 * Written for: https://github.com/anschuetz/linuxmuster/issues/1#issuecomment-110888829
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * }}} */

/* Required modules {{{ */
var opening_hours = require('./opening_hours.js');
var fs            = require('fs');
/* }}} */

/* Constants {{{ */
var nominatim_object = require('./js/nominatim_definitions.js').for_loc;
/* }}} */

/* Parameter handling {{{ */
var optimist = require('optimist')
    .usage('Usage: $0 export_list.conf')
    .describe('h', 'Display the usage')
    .describe('v', 'Verbose output')
    .describe('f', 'From year (including)')
    .demand('f')
    .describe('t', 'Until year (including)')
    .demand('t')
    .describe('p', 'Export public holidays. Can not be used togehter with --school-holidays.')
    // .default('p', true)
    .describe('s', 'Export school holidays. Can not be used together with --public-holidays.')
    .describe('c', 'Country (for which the holidays apply). Defaults to Germany.')
    .default('c', 'de')
    .describe('r', 'Region (for which the holidays apply). Defaults to Baden-Württemberg.')
    .default('r', 'bw')
    .boolean(['p', 's'])
    .alias('h', 'help')
    .alias('v', 'verbose')
    .alias('f', 'from')
    .alias('t', 'to')
    .alias('p', 'public-holidays')
    .alias('s', 'school-holidays')
    .alias('c', 'country')
    .alias('r', 'region');

var argv = optimist.argv;

if (argv.help || argv._.length === 0) {
    optimist.showHelp();
    process.exit(0);
}

/* Error handling {{{ */
if (argv['public-holidays'] && argv['school-holidays']) {
    console.error("--school-holidays and --public-holidays can not be used together.");
    process.exit(0);
}
if (typeof nominatim_object[argv.country] !== 'object' || typeof nominatim_object[argv.country][argv.region] !== 'object') {
    console.error(argv.country + ", " + argv.region + " is currently not supported.");
    process.exit(0);
}

/* }}} */
/* }}} */

var filepath = argv._[0];

var oh_value = argv['public-holidays'] ? 'PH' : 'SH';

write_config_file(filepath, oh_value, nominatim_object[argv.country][argv.region], new Date(argv.from, 0, 1), new Date(argv.to + 1, 0, 1));

function write_config_file(filepath, oh_value, nominatim_object, from_date, to_date) {
    try {
        oh = new opening_hours(oh_value, nominatim_object);
    } catch (err) {
        console.error('Something went wrong. Please file issue at https://github.com/ypid/opening_hours.js/issues');
        process.exit(0);
    }

    var intervals = oh.getOpenIntervals(from_date, to_date);

    var stream = fs.createWriteStream(filepath);

    stream.once('open', function(fd) {
        for (var i = 0; i < intervals.length; i++) {
            var holiday_entry = intervals[i];
            var output_line = [
                getISODate(holiday_entry[0]),
            ];
            if (oh_value === 'SH') { /* Add end date */
                output_line[0] += '-' + getISODate(holiday_entry[1], -1);
            }

            output_line.push(holiday_entry[3]);
            if (argv.verbose) {
                console.log(output_line.join(' '))
            }
            stream.write(output_line.join(' ') + "\n");
        }
        stream.end();
    });
}

/* Helper functions {{{ */
// https://stackoverflow.com/a/2998822
function pad(num, size) {
    var s = String(num);
    while (s.length < size) {
        s = "0" + s;
    }
    return s;
}

function getISODate(date, day_offset) { /* Is a valid ISO 8601 date, but not so nice. */
    /* Returns date as 20151231 */
    if (typeof day_offset !== 'number') {
        day_offset = 0;
    }

    date.setDate(date.getDate() + day_offset);
    // Could use strftime node module but then I would have to make an own repository for this script :)
    return String(date.getFullYear()) + pad(date.getMonth() + 1, 2) + pad(date.getDate(), 2);
}

/* }}} */
