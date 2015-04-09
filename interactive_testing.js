#!/usr/bin/env nodejs

var opening_hours = require('./opening_hours.js');
var readline      = require('readline');
var net           = require('net');

// used for sunrise, sunset and PH,SH
// http://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1
var nominatiomTestJSON = {"place_id":"44651229","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36248375","lat":"49.5400039","lon":"9.7937133","display_name":"K 2847, Lauda-K\u00f6nigshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-W\u00fcrttemberg, Germany, European Union","address":{"road":"K 2847","city":"Lauda-K\u00f6nigshofen","county":"Main-Tauber-Kreis","state_district":"Regierungsbezirk Stuttgart","state":"Baden-W\u00fcrttemberg","country":"Germany","country_code":"de","continent":"European Union"}};

function opening_hours_object(value) {
    var oh;
    var crashed = true;
    var needed_nominatiom_json = false;
    var warnings = [];
    try {
        oh = new opening_hours(value);
        warnings = oh.getWarnings();
        if (typeof warnings !== 'object')
            console.error(warnings);
        // prettified = oh.prettifyValue();
        crashed = false;
    } catch (err) {
        try {
            oh = new opening_hours(value, nominatiomTestJSON);
            crashed = false;
            needed_nominatiom_json = true;
        } catch (err) {
            crashed = err;
        }
    }

    var result = { 'needed_nominatiom_json': needed_nominatiom_json };
    if (crashed) {
        result.error      = true;
        result.eval_notes = crashed;
    } else {
        result.error         = false;
        result.eval_notes    = warnings;
        result.comment       = oh.getComment();
        result.state         = oh.getState();
        result.unknown       = oh.getUnknown();
        result.state_string  = oh.getStateString();
        try {
            result.next_change   = oh.getNextChange();
        } catch (err) {
            // This might throw an exception if there is no change.
        }
        result.rule_index    = oh.getMatchingRule();
        result.matching_rule = typeof result.rule_index === 'undefined'
            ? undefined
            : oh.prettifyValue({ 'rule_index': result.rule_index });
        result.prettified    = oh.prettifyValue();
        result.week_stable   = oh.isWeekStable();
    }
    return result;
}

var servers = [];
var args = process.argv.splice(2);
for (var i = 0; i < args.length; i++) {
    console.log('Starting to listen on "%s"', args[i]);
    servers[i] = net.createServer(function(socket) {
        console.log("connected");

        socket.on('data', function (data) {
            value = data.toString();
            console.log(value);
            result = opening_hours_object(value);
            socket.write(JSON.stringify(result, null, '\t'));
        });
    }).listen(args[i]);
}

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', function (value) {
    result = opening_hours_object(value);
    console.log(JSON.stringify(result, null, '\t') + '\n');

}).on('close', function() {
    for (var i = 0; i < servers.length; i++) {
        servers[i].close();
    }
    console.log('\nBye');
    process.exit(0);
});

console.info('You can enter your opening_hours like value and hit enter to evaluate. The result handed to you is represented in the JSON.');
console.info('If you want to create a binding for another programing language you should use the unix socket interface which gives you full access to the API.');
// Also the stdin method breaks for certain values (e.g. newlines in values).
