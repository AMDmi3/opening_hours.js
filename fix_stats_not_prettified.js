#!/usr/bin/env nodejs

var fs = require('fs');
var args = process.argv.splice(2);

for (var ind = 0; ind < args.length; ind++) {
    var csv_filename = args[ind];

    var lines = fs.readFileSync(csv_filename, 'utf8').split('\n');
    var max_lines = lines.length;

    for (var cur_line = 0; cur_line < max_lines; cur_line++) {
        data = lines[cur_line].split(',');

        if (!isNaN(parseInt(data[1]))) {
            var tmp = " " + (data[4] - data[7]);
            data[7] = " " + (data[3] - data[8]);
            data[8] = tmp;

            lines[cur_line] = data.join(',')

            // console.log(data);
        }
    }

    fs.writeFile(csv_filename + '.fix', lines.join('\n'), function(err) {
            if (err) {
                throw(err);
            }
        }
    );
}
