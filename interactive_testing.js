var opening_hours = require('./opening_hours.js');
var readline = require('readline');

// used for sunrise, sunset ¿ and PH,SH
// http://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1
var nominatiomTestJSON = {"place_id":"44651229","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36248375","lat":"49.5400039","lon":"9.7937133","display_name":"K 2847, Lauda-K\u00f6nigshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-W\u00fcrttemberg, Germany, European Union","address":{"road":"K 2847","city":"Lauda-K\u00f6nigshofen","county":"Main-Tauber-Kreis","state_district":"Regierungsbezirk Stuttgart","state":"Baden-W\u00fcrttemberg","country":"Germany","country_code":"de","continent":"European Union"}};

var args = process.argv.splice(2);

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', function (cmd) {
    var crashed = true;
    var needed_nominatiom_json = false;
    var warnings = [];
    try {
        oh = new opening_hours(cmd);
        warnings = oh.getWarnings();
        if (typeof warnings != 'object')
            console.error(warnings);
        // prettified = oh.prettifyValue();
        crashed = false;
    } catch (err) {
        try {
            oh = new opening_hours(cmd, nominatiomTestJSON);
            crashed = false;
            needed_nominatiom_json = true;
        } catch (err) {
            crashed = err;
        }
    }

    var result = { 'needed_nominatiom_json': needed_nominatiom_json };
    if (crashed) {
        result.error = true;
        result.eval_notes = crashed;
        console.log('1 ' + crashed);
    } else {
        result.error         = false;
        result.eval_notes    = warnings;
        result.comment       = oh.getComment();
        result.state         = oh.getState();
        result.unknown       = oh.getUnknown();
        result.state_string  = oh.getStateString();
        result.next_change   = oh.getNextChange();
        result.matching_rule = oh.getMatchingRule();
        result.matching_rule = oh.getMatchingRule();
        result.prettified    = oh.prettifyValue();
    }
    console.log(JSON.stringify(result, null, '\t') + '\n');

}).on('close', function() {
    console.log('\nBye');
    process.exit(0);
});

console.info('You can enter your opening_hours like value and hit enter to evaluate. The result will be returned is represented as JSON.');
