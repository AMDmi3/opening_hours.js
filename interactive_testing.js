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
    var warnings = '';
    try {
        oh = new opening_hours(cmd);
        warnings = oh.getWarnings();
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

    if (crashed) {
        console.log('1 ' + crashed);
    } else {
        var comment = oh.getComment();
        if (typeof comment === 'undefined')
            comment = '>>no comment<<';

        var state = oh.getState() ? 'open   ' : (oh.getUnknown() ? 'unknown' : 'closed ');
        console.log('0 ' + (needed_nominatiom_json ? 1 : 0), (warnings != '' ? 1 : 0), state, '"' + comment + '"');
        if (args[0] != '--no-warnings' && warnings != '')
            console.log(warnings);
    }
}).on('close', function() {
    console.log('\nBye');
    process.exit(0);
});

console.log('You can enter your opening_hours like value and hit enter to evaluate. The first boolean returned is the exit code, the second is one if location information was needed.');
