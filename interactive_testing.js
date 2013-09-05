var opening_hours = require('./opening_hours.js');
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', function (cmd) {
    var crashed = true;
    try {
        oh = new opening_hours(cmd);
        crashed = false;
    } catch (err) {
        crashed = err;
    }

    if (crashed) {
        console.log('1 ' + crashed);
    } else {
        console.log('0 ' + (oh.getState() ? 'open' : (oh.getUnknown() ? 'unknown' : 'closed')));
    }
}).on('close', function() {
    console.log('\nBye');
    process.exit(0);
});
