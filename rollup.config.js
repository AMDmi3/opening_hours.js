import {readFileSync} from 'fs';
import common from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import yaml from 'rollup-plugin-yaml';

var banner = readFileSync('./banner.js', 'utf-8');
var dependencies = process.env.DEPS === 'YES';

export default {
    banner: banner,
    input: './index',
    name: 'opening_hours',
    plugins: dependencies ? [
        nodeResolve(),
        common(),
        yaml(),
    ] : [
        yaml(),
    ],
    external: dependencies ? [] : [
        'i18next-client',
        'moment',
        'suncalc'
    ],
    globals: dependencies ? {} : {
        'i18next-client': 'i18n',
        'moment': 'moment',
        'suncalc': 'SunCalc'
    },
    output: {
        format: 'umd',
        file: dependencies ? 'opening_hours+deps.js' : 'opening_hours.js'
    }
};
