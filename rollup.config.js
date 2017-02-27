import {readFileSync} from 'fs';
import common from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import yaml from 'rollup-plugin-yaml';

var banner = readFileSync('./banner.js', 'utf-8');
var dependencies = process.env.DEPS === 'YES';

export default {
    banner: banner,
    entry: './index',
    format: 'umd',
    moduleName: 'opening_hours',
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
    dest: dependencies ? 'opening_hours+deps.js' : 'opening_hours.js'
};
