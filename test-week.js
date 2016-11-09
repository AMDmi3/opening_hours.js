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
var colors        = require('colors');
var sprintf       = require('sprintf-js').sprintf;
var timekeeper    = require('timekeeper');
/* }}} */

colors.setTheme({
    passed:  [ 'green'  , 'bold' ] , // printed with console.log
    warn:    [ 'blue'   , 'bold' ] , // printed with console.info
    failed:  [ 'red'    , 'bold' ] , // printed with console.warn
    crashed: [ 'magenta', 'bold' ] , // printed with console.error
    ignored: [ 'yellow' , 'bold' ] ,
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

/* Defaults {{{ */
// https://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1
var nominatimTestJSON = {"place_id":"44651229","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36248375","lat":"49.5400039","lon":"9.7937133","display_name":"K 2847, Lauda-K\u00f6nigshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-W\u00fcrttemberg, Germany, European Union","address":{"road":"K 2847","city":"Lauda-K\u00f6nigshofen","county":"Main-Tauber-Kreis","state_district":"Regierungsbezirk Stuttgart","state":"Baden-W\u00fcrttemberg","country":"Germany","country_code":"de","continent":"European Union"}};

// https://nominatim.openstreetmap.org/reverse?format=json&lat=60.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1
var nominatimTestJSON_sunrise_below_default = {"place_id":"71977948","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"118145917","lat":"60.5467949","lon":"9.8269589","display_name":"243, Ringerike, Buskerud, Norway","address":{"road":"243","county":"Ringerike","state":"Buskerud","country":"Norway","country_code":"no"}};

// https://nominatim.openstreetmap.org/reverse?format=json&lat=27.567&lon=-71.093&zoom=18&addressdetails=1
// Actual response: {"error":"Unable to geocode"}
var nominatim_no_valid_address = {
    "place_id": "-966",
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
    "osm_type": "way",
    "osm_id": "-42",
    "lat": "27.567",
    "lon": "-71.093",
    "display_name": "-23, None, None, None",
    "address": {
        "road": "-23",
        "county": "None",
        "state": "None",
        "country": "None",
        "country_code": "none"
    }
};
/* }}} */

/* Russia {{{ */
// https://nominatim.openstreetmap.org/reverse?format=json&lat=59.9179&lon=30.3058&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_sanktpeterburg = {
    "address": {
        "city": "Saint Petersburg",
        "country": "Russian Federation",
        "country_code": "ru",
        "house_number": "126",
        "postcode": "190000",
        "road": "Fontanka River Embankment",
        "state": "Saint Petersburg",
        "state_district": "\u0410\u0434\u043c\u0438\u0440\u0430\u043b\u0442\u0435\u0439\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d",
        "suburb": "Kolomna"
    },
    "display_name": "126, Fontanka River Embankment, Kolomna, Saint Petersburg, \u0410\u0434\u043c\u0438\u0440\u0430\u043b\u0442\u0435\u0439\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Saint Petersburg, Northwestern Federal District, 190000, Russian Federation",
    "lat": "59.9180615",
    "licence": "Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
    "lon": "30.3059528150966",
    "osm_id": "1122295",
    "osm_type": "relation",
    "place_id": "158850652"
};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=55.7780&lon=49.1303&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_tatarstan = {"place_id":"33377476","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"2783648099","lat":"55.7779748","lon":"49.1296892","display_name":"Cinema Cafe, 6, Spartakovskaya Street, \u041a\u0430\u043b\u0443\u0433\u0430, \u0412\u0430\u0445\u0438\u0442\u043e\u0432\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, \u041a\u0430\u0437\u0430\u043d\u044c, \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u041a\u0430\u0437\u0430\u043d\u044c, Tatarstan, Volga Federal District, 420106, Russian Federation","address":{"cafe":"Cinema Cafe","house_number":"6","road":"Spartakovskaya Street","suburb":"\u041a\u0430\u043b\u0443\u0433\u0430","city_district":"\u0412\u0430\u0445\u0438\u0442\u043e\u0432\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","city":"\u041a\u0430\u0437\u0430\u043d\u044c","county":"\u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u041a\u0430\u0437\u0430\u043d\u044c","state":"Tatarstan","postcode":"420106","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=54.1264&lon=56.5797&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_bashkortostan = {"place_id":"4367634","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"489344251","lat":"54.190107","lon":"56.5377028","display_name":"\u041d\u043e\u0432\u043e\u0437\u0438\u0440\u0438\u043a\u043e\u0432\u043e, \u0413\u0430\u0444\u0443\u0440\u0438\u0439\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Bashkortostan, Volga Federal District, Russian Federation","address":{"hamlet":"\u041d\u043e\u0432\u043e\u0437\u0438\u0440\u0438\u043a\u043e\u0432\u043e","county":"\u0413\u0430\u0444\u0443\u0440\u0438\u0439\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Bashkortostan","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=55.4871&lon=47.1659&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_chuvash = {"place_id":"92041184","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"115006808","lat":"55.5013946","lon":"47.165831","display_name":"97\u041a-021, \u0410\u0447\u0430\u043a\u0430\u0441\u044b, \u041a\u0430\u043d\u0430\u0448\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Chuvashia, Volga Federal District, Russian Federation","address":{"road":"97\u041a-021","village":"\u0410\u0447\u0430\u043a\u0430\u0441\u044b","county":"\u041a\u0430\u043d\u0430\u0448\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Chuvashia","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=62.1010&lon=129.7176&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_sakha = {"place_id":"157409650","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"297831427","lat":"62.10115345","lon":"129.71764735","display_name":"17, \u0426\u0435\u043d\u0442\u0440\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u0435\u0440\u0435\u0443\u043b\u043e\u043a, \u0440\u0430\u0439\u043e\u043d \u041f\u043b\u0435\u043c\u043e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u0435, Yakutsk, \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u042f\u043a\u0443\u0442\u0441\u043a, Sakha Republic, Far Eastern Federal District, 677901, Russian Federation","address":{"house_number":"17","road":"\u0426\u0435\u043d\u0442\u0440\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u0435\u0440\u0435\u0443\u043b\u043e\u043a","suburb":"\u0440\u0430\u0439\u043e\u043d \u041f\u043b\u0435\u043c\u043e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u0435","city":"Yakutsk","county":"\u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u042f\u043a\u0443\u0442\u0441\u043a","state":"Sakha Republic","postcode":"677901","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=46.524&lon=44.731&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_kalmykia = {"place_id":"155691118","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"292575902","lat":"46.58413215","lon":"44.778536225","display_name":"\u041c\u0430\u0439\u0441\u043a\u0438\u0439, \u0426\u0435\u043b\u0438\u043d\u043d\u044b\u0439 \u0440\u0430\u0439\u043e\u043d, Republic of Kalmykia, South federal district, Russian Federation","address":{"hamlet":"\u041c\u0430\u0439\u0441\u043a\u0438\u0439","county":"\u0426\u0435\u043b\u0438\u043d\u043d\u044b\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Republic of Kalmykia","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=52.014&lon=109.366&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_buryatia = {"place_id":"158771291","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"195223","lat":"52.4290635","lon":"109.517969733203","display_name":"Khorinsky Rayon, Buryatia, Siberian Federal District, Russian Federation","address":{"county":"Khorinsky Rayon","state":"Buryatia","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=63.832&lon=33.626&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_karelia = {"place_id":"158846852","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"1020571","lat":"63.94629385","lon":"33.5193580207717","display_name":"\u0427\u0435\u0440\u043d\u043e\u043f\u043e\u0440\u043e\u0436\u0441\u043a\u043e\u0435 \u0441\u0435\u043b\u044c\u0441\u043a\u043e\u0435 \u043f\u043e\u0441\u0435\u043b\u0435\u043d\u0438\u0435, \u0421\u0435\u0433\u0435\u0436\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Republic of Karelia, Northwestern Federal District, Russian Federation","address":{"city":"\u0427\u0435\u0440\u043d\u043e\u043f\u043e\u0440\u043e\u0436\u0441\u043a\u043e\u0435 \u0441\u0435\u043b\u044c\u0441\u043a\u043e\u0435 \u043f\u043e\u0441\u0435\u043b\u0435\u043d\u0438\u0435","county":"\u0421\u0435\u0433\u0435\u0436\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Republic of Karelia","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=56.8642&lon=53.2054&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_udmurtia = {"place_id":"74363539","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"59171598","lat":"56.86426315","lon":"53.2058149501383","display_name":"390, \u0443\u043b\u0438\u0446\u0430 \u041a\u0430\u0440\u043b\u0430 \u041c\u0430\u0440\u043a\u0441\u0430, \u041e\u043a\u0442\u044f\u0431\u0440\u044c\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Izhevsk, \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u0418\u0436\u0435\u0432\u0441\u043a, \u0423\u0434\u043c\u0443\u0440\u0442\u0441\u043a\u0430\u044f \u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430, Volga Federal District, 426008, Russian Federation","address":{"house_number":"390","road":"\u0443\u043b\u0438\u0446\u0430 \u041a\u0430\u0440\u043b\u0430 \u041c\u0430\u0440\u043a\u0441\u0430","city_district":"\u041e\u043a\u0442\u044f\u0431\u0440\u044c\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","city":"Izhevsk","county":"\u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u0418\u0436\u0435\u0432\u0441\u043a","state":"\u0423\u0434\u043c\u0443\u0440\u0442\u0441\u043a\u0430\u044f \u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430","postcode":"426008","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=44.60627&lon=40.10432&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_adygea = {"place_id":"117083297","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"178119466","lat":"44.60635535","lon":"40.103552511385","display_name":"\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0433.\u041c\u0430\u0439\u043a\u043e\u043f\u0430, 21, \u041a\u0440\u0430\u0441\u043d\u043e\u043e\u043a\u0442\u044f\u0431\u0440\u044c\u0441\u043a\u0430\u044f \u0443\u043b\u0438\u0446\u0430, Maykop, \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u041c\u0430\u0439\u043a\u043e\u043f, Adygea, South federal district, 385006, Russian Federation","address":{"townhall":"\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0433.\u041c\u0430\u0439\u043a\u043e\u043f\u0430","house_number":"21","road":"\u041a\u0440\u0430\u0441\u043d\u043e\u043e\u043a\u0442\u044f\u0431\u0440\u044c\u0441\u043a\u0430\u044f \u0443\u043b\u0438\u0446\u0430","city":"Maykop","county":"\u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u041c\u0430\u0439\u043a\u043e\u043f","state":"Adygea","postcode":"385006","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.118&lon=46.959&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_dagestan = {"place_id":"8585510","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"915341178","lat":"43.1134014","lon":"47.0808948","display_name":"\u0423\u0447\u043a\u0435\u043d\u0442, \u041a\u0443\u043c\u0442\u043e\u0440\u043a\u0430\u043b\u0438\u043d\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Republic of Dagestan, North Caucasus federal district, Russian Federation","address":{"village":"\u0423\u0447\u043a\u0435\u043d\u0442","county":"\u041a\u0443\u043c\u0442\u043e\u0440\u043a\u0430\u043b\u0438\u043d\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Republic of Dagestan","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.1171&lon=44.8626&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_ingushetia = {"place_id":"156030007","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"293569945","lat":"43.1456795","lon":"44.8365875","display_name":"P 721, \u0441\u0435\u043b\u044c\u0441\u043a\u043e\u0435 \u043f\u043e\u0441\u0435\u043b\u0435\u043d\u0438\u0435 \u0410\u043b\u0438-\u042e\u0440\u0442, \u041d\u0430\u0437\u0440\u0430\u043d\u043e\u0432\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Ingushetia, North Caucasus federal district, 386125, Russian Federation","address":{"road":"P 721","city":"\u0441\u0435\u043b\u044c\u0441\u043a\u043e\u0435 \u043f\u043e\u0441\u0435\u043b\u0435\u043d\u0438\u0435 \u0410\u043b\u0438-\u042e\u0440\u0442","county":"\u041d\u0430\u0437\u0440\u0430\u043d\u043e\u0432\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Ingushetia","postcode":"386125","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.7916&lon=41.7268&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_karachayCherkess = {"place_id":"82077979","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"85989954","lat":"43.8052673","lon":"41.7291051","display_name":"\u041a\u0440\u0430\u0441\u043d\u044b\u0439 \u041e\u043a\u0442\u044f\u0431\u0440\u044c-\u0425\u0430\u0441\u0430\u0443\u0442 \u0413\u0440\u0435\u0447\u0435\u0441\u043a\u043e\u0435, \u0417\u0435\u043b\u0435\u043d\u0447\u0443\u043a\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, \u041a\u0430\u0440\u0430\u0447\u0430\u0435\u0432\u043e-\u0427\u0435\u0440\u043a\u0435\u0441\u0441\u043a\u0430\u044f \u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430, North Caucasus federal district, Russian Federation","address":{"road":"\u041a\u0440\u0430\u0441\u043d\u044b\u0439 \u041e\u043a\u0442\u044f\u0431\u0440\u044c-\u0425\u0430\u0441\u0430\u0443\u0442 \u0413\u0440\u0435\u0447\u0435\u0441\u043a\u043e\u0435","county":"\u0417\u0435\u043b\u0435\u043d\u0447\u0443\u043a\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"\u041a\u0430\u0440\u0430\u0447\u0430\u0435\u0432\u043e-\u0427\u0435\u0440\u043a\u0435\u0441\u0441\u043a\u0430\u044f \u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.451&lon=45.700&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_chechnya = {"place_id":"159190811","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"3888369","lat":"43.35498065","lon":"45.7216713693354","display_name":"\u041b\u0435\u043d\u0438\u043d\u0441\u043a\u0438\u0439, Grozny, \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u0413\u0440\u043e\u0437\u043d\u044b\u0439, Chechen Republic, North Caucasus federal district, Russian Federation","address":{"city_district":"\u041b\u0435\u043d\u0438\u043d\u0441\u043a\u0438\u0439","city":"Grozny","county":"\u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043e\u043a\u0440\u0443\u0433 \u0413\u0440\u043e\u0437\u043d\u044b\u0439","state":"Chechen Republic","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.497&lon=43.423&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_kabardinoBalkaria = {"place_id":"12000590","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"1176698285","lat":"43.5613295","lon":"43.4302516","display_name":"\u041b\u0435\u0447\u0438\u043d\u043a\u0430\u0439, \u0427\u0435\u0433\u0435\u043c\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, \u041a\u0430\u0431\u0430\u0440\u0434\u0438\u043d\u043e-\u0411\u0430\u043b\u043a\u0430\u0440\u0441\u043a\u0430\u044f \u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430, North Caucasus federal district, Russian Federation","address":{"village":"\u041b\u0435\u0447\u0438\u043d\u043a\u0430\u0439","county":"\u0427\u0435\u0433\u0435\u043c\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"\u041a\u0430\u0431\u0430\u0440\u0434\u0438\u043d\u043e-\u0411\u0430\u043b\u043a\u0430\u0440\u0441\u043a\u0430\u044f \u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=50.900&lon=86.899&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_altai = {"place_id":"158766852","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"192546","lat":"50.74112365","lon":"86.3687137822935","display_name":"Ongudaysky Rayon, Altai Republic, Siberian Federal District, Russian Federation","address":{"county":"Ongudaysky Rayon","state":"Altai Republic","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=51.781&lon=94.033&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_tyva = {"place_id":"158765550","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"190766","lat":"52.31183635","lon":"94.1400217560473","display_name":"Piy-Khemsky Kozhuun, Tuva, Siberian Federal District, Russian Federation","address":{"county":"Piy-Khemsky Kozhuun","state":"Tuva","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=51.335&lon=46.668&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_saratov = {"place_id":"63722839","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"31715230","lat":"51.2934885","lon":"46.6636942","display_name":"E 38, \u0421\u043e\u0432\u0435\u0442\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Saratov Oblast, Volga Federal District, Russian Federation","address":{"road":"E 38","county":"\u0421\u043e\u0432\u0435\u0442\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Saratov Oblast","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=52.952&lon=33.283&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_bryansk = {"place_id":"121844937","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"190394567","lat":"52.9876239","lon":"33.2285656","display_name":"\u00ab\u0411\u0440\u044f\u043d\u0441\u043a \u2014 \u041d\u043e\u0432\u043e\u0437\u044b\u0431\u043a\u043e\u0432\u00bb \u2014 \u041c\u0433\u043b\u0438\u043d, \u0411\u0435\u0440\u0451\u0437\u043e\u0432\u043a\u0430, \u041f\u043e\u0447\u0435\u043f\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d, Bryansk Oblast, Central Federal District, Russian Federation","address":{"road":"\u00ab\u0411\u0440\u044f\u043d\u0441\u043a \u2014 \u041d\u043e\u0432\u043e\u0437\u044b\u0431\u043a\u043e\u0432\u00bb \u2014 \u041c\u0433\u043b\u0438\u043d","hamlet":"\u0411\u0435\u0440\u0451\u0437\u043e\u0432\u043a\u0430","county":"\u041f\u043e\u0447\u0435\u043f\u0441\u043a\u0438\u0439 \u0440\u0430\u0439\u043e\u043d","state":"Bryansk Oblast","country":"Russian Federation","country_code":"ru"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=64.191&lon=55.826&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_russia_komi = {"place_id":"158847082","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"1082933","lat":"65.0204625","lon":"57.3740830196108","display_name":"\u0440\u0430\u0439\u043e\u043d \u041f\u0435\u0447\u043e\u0440\u0430, Komi Republic, Northwestern Federal District, Russian Federation","address":{"county":"\u0440\u0430\u0439\u043e\u043d \u041f\u0435\u0447\u043e\u0440\u0430","state":"Komi Republic","country":"Russian Federation","country_code":"ru"}};
/* }}} */

/* USA {{{ */
var nominatimTestJSON_usa_state_unknown = {
    "address": {
        "country": "United States of America",
        "country_code": "us",
        // "city": "Washington",
        // "county": "District of Columbia",
        // "information": "White House Visitor Center",
        // "neighbourhood": "Franklin McPherson Square",
        "postcode": "20500",
        // "road": "Ellipse Road Northwest",
        // "suburb": "Southwest Waterfront"
    },
    // "display_name": "White House Visitor Center, Ellipse Road Northwest, Franklin McPherson Square, Southwest Waterfront, Washington, District of Columbia, 20500, United States of America",
    "lat": "38.895048",
    "licence": "Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
    "lon": "-77.035046",
    "osm_id": "2525694724",
    "osm_type": "node",
    "place_id": "25998054"
};
/* Washington DC {{{ */
// https://nominatim.openstreetmap.org/reverse?format=json&lat=38.8953&lon=-77.0356&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_washingtondc = {
    "address": {
        // "city": "Washington",
        "country": "United States of America",
        "country_code": "us",
        "county": "District of Columbia",
        "information": "White House Visitor Center",
        "neighbourhood": "Franklin McPherson Square",
        "postcode": "20500",
        "road": "Ellipse Road Northwest",
        "suburb": "Southwest Waterfront"
    },
    "display_name": "White House Visitor Center, Ellipse Road Northwest, Franklin McPherson Square, Southwest Waterfront, Washington, District of Columbia, 20500, United States of America",
    "lat": "38.895048",
    "licence": "Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
    "lon": "-77.035046",
    "osm_id": "2525694724",
    "osm_type": "node",
    "place_id": "25998054"
};
/* }}} */
/* Alabama {{{ */
// https://nominatim.openstreetmap.org/reverse?format=json&lat=32.3673&lon=-86.2983&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_alabama = {
    "address": {
        "city": "Montgomery",
        "country": "United States of America",
        "country_code": "us",
        "county": "Montgomery County",
        "postcode": "36104",
        "road": "Genetta Court",
        "state": "Alabama"
    },
    "display_name": "Genetta Court, Montgomery, Montgomery County, Alabama, 36104, United States of America",
    "lat": "32.366649",
    "licence": "Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
    "lon": "-86.2990459",
    "osm_id": "7928836",
    "osm_type": "way",
    "place_id": "49048248"
};
/* }}} */
// https://nominatim.openstreetmap.org/reverse?format=json&lat=64.5082&lon=-165.4066&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_alaska={"place_id":"49689315","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"8984498","lat":"64.5093904","lon":"-165.4064219","display_name":"North Star Assoc Access Road, Nome, Alaska, 99762, United States of America","address":{"road":"North Star Assoc Access Road","city":"Nome","county":"Nome","state":"Alaska","postcode":"99762","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=34.9378&lon=-109.7565&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_arizona={"place_id":"119968886","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"284558228","lat":"34.9381065","lon":"-109.7597016","display_name":"Blue Mesa Trail, Apache County, Arizona, United States of America","address":{"footway":"Blue Mesa Trail","county":"Apache County","state":"Arizona","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=34.74610&lon=-92.29054&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_arkansas={"place_id":"52473261","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"12933666","lat":"34.746454","lon":"-92.2903549","display_name":"Capitol Mall, Little Rock, Pulaski County, Arkansas, 72201, United States of America","address":{"road":"Capitol Mall","city":"Little Rock","county":"Pulaski County","state":"Arkansas","postcode":"72201","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=40.8001&lon=-124.1698&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_california={"place_id":"15825908","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"1491131029","lat":"40.7997997","lon":"-124.1704456","display_name":"Sole Savers Used Cars, 7th Street, Eureka, Humboldt County, California, 95501, United States of America","address":{"car":"Sole Savers Used Cars","road":"7th Street","city":"Eureka","county":"Humboldt County","state":"California","postcode":"95501","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=39.1804&lon=-106.8218&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_colorado={"place_id":"121524489","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"292950875","lat":"39.179721","lon":"-106.8236546","display_name":"West Side, Aspen, Pitkin County, Colorado, 81611, United States of America","address":{"path":"West Side","city":"Aspen","county":"Pitkin County","state":"Colorado","postcode":"81611","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=41.9111&lon=-72.16014&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_connecticut={"place_id":"21360915","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"2164630561","lat":"41.9112481","lon":"-72.1601503","display_name":"Pixi Falls, Nipmuck Trail, Westford, Windham County, Connecticut, 06278, United States of America","address":{"viewpoint":"Pixi Falls","footway":"Nipmuck Trail","hamlet":"Westford","county":"Windham County","state":"Connecticut","postcode":"06278","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=38.7113&lon=-75.0978&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_delaware={"place_id":"66739225","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"47999971","lat":"38.710581","lon":"-75.0967069","display_name":"Road 273C, Phil Mar Estates, Sussex County, Delaware, 19971, United States of America","address":{"road":"Road 273C","hamlet":"Phil Mar Estates","county":"Sussex County","state":"Delaware","postcode":"19971","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=25.7720&lon=-80.1324&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_florida={"place_id":"116692522","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"266382359","lat":"25.7718665","lon":"-80.1312973","display_name":"South of Fifth Sandwalk, Miami Beach, Miami-Dade County, Florida, 33109, United States of America","address":{"path":"South of Fifth Sandwalk","city":"Miami Beach","county":"Miami-Dade County","state":"Florida","postcode":"33109","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=31.0823&lon=-81.4192&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_georgia={"place_id":"49510144","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"9260878","lat":"31.083523","lon":"-81.4209829","display_name":"Jennings Road, Glynn County, Georgia, 31527, United States of America","address":{"road":"Jennings Road","county":"Glynn County","state":"Georgia","postcode":"31527","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=13.4311&lon=144.6549&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_guam={"place_id":"64236526","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36979005","lat":"13.4188011","lon":"144.6577079","display_name":"Marine Corps Drive, Apra Harbor, Guam County, Guam, United States of America","address":{"road":"Marine Corps Drive","locality":"Apra Harbor","county":"Guam County","state":"Guam","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=19.6423&lon=-155.4837&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_hawaii={"place_id":"66164927","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"45698610","lat":"19.62918","lon":"-155.5398599","display_name":"Hilo Kona Road, Kailua-Kona, Hawai\u02bbi County, Hawaii, United States of America","address":{"road":"Hilo Kona Road","city":"Kailua-Kona","county":"Hawai\u02bbi County","state":"Hawaii","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=47.6710&lon=-116.7671&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_idaho={"place_id":"53105523","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"13846067","lat":"47.670042","lon":"-116.7670899","display_name":"South Dollar Street, Coeur d'Alene, Kootenai County, Idaho, 83814, United States of America","address":{"road":"South Dollar Street","city":"Coeur d'Alene","county":"Kootenai County","state":"Idaho","postcode":"83814","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=42.05202&lon=-87.67594&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_illinois={"place_id":"63158773","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"33908928","lat":"42.05189995","lon":"-87.6759578506092","display_name":"University Hall, 1897, Sheridan Road, Downtown, Evanston, Cook County, Illinois, 60208, United States of America","address":{"building":"University Hall","house_number":"1897","road":"Sheridan Road","neighbourhood":"Downtown","city":"Evanston","county":"Cook County","state":"Illinois","postcode":"60208","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=40.4179&lon=-86.8969&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_indiana={"place_id":"71946986","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"74495138","lat":"40.4182607","lon":"-86.8976521","display_name":"Columbia Street, Happy Hollow Heights, Tippecanoe County, Indiana, 47901, United States of America","address":{"road":"Columbia Street","hamlet":"Happy Hollow Heights","county":"Tippecanoe County","state":"Indiana","postcode":"47901","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=41.9747&lon=-91.6760&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_iowa={"place_id":"98812115","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"185310640","lat":"41.9750617","lon":"-91.6757381247816","display_name":"Linn County Sheriffs Department, I 380;IA 27, Cedar Rapids, Linn County, Iowa, 52401, United States of America","address":{"police":"Linn County Sheriffs Department","road":"I 380;IA 27","city":"Cedar Rapids","county":"Linn County","state":"Iowa","postcode":"52401","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=37.6888&lon=-97.3271&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_kansas={"place_id":"92181389","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"161510053","lat":"37.6887661","lon":"-97.3278952567447","display_name":"Old Town Parking Garage, North Rock Island, Wichita, Sedgwick County, Kansas, 67202, United States of America","address":{"parking":"Old Town Parking Garage","road":"North Rock Island","city":"Wichita","county":"Sedgwick County","state":"Kansas","postcode":"67202","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=36.8446&lon=-83.3196&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_kentucky={"place_id":"54458735","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"16198892","lat":"36.844965","lon":"-83.3193679","display_name":"KY 38, Harlan, Harlan County, Kentucky, 40831, United States of America","address":{"road":"KY 38","city":"Harlan","county":"Harlan County","state":"Kentucky","postcode":"40831","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=30.1800&lon=-90.1787&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_louisiana={"place_id":"127893731","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"1836431","lat":"30.421468","lon":"-89.9617631947467","display_name":"St. Tammany Parish, Louisiana, United States of America","address":{"county":"St. Tammany Parish","state":"Louisiana","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=44.7903&lon=-68.7829&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_maine={"place_id":"66188993","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"43376862","lat":"44.7904848","lon":"-68.7829047111113","display_name":"Bangor Raceway\/OTB, Bangor, Penobscot County, Maine, 04412, United States of America","address":{"raceway":"Bangor Raceway\/OTB","city":"Bangor","county":"Penobscot County","state":"Maine","postcode":"04412","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=38.3206&lon=-75.6213&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_maryland={"place_id":"66529051","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"47701025","lat":"38.3152772","lon":"-75.6248896","display_name":"South Fruitland Boulevard, Fruitland, Wicomico County, Maryland, 21826, United States of America","address":{"road":"South Fruitland Boulevard","city":"Fruitland","county":"Wicomico County","state":"Maryland","postcode":"21826","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=42.3550&lon=-71.0645&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_massachusetts={"place_id":"59715429","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"24677646","lat":"42.35546545","lon":"-71.0638843757496","display_name":"Visitor Information Center at Boston Common, 148, Tremont Street, Chinatown, Beacon Hill, Boston, Suffolk County, Massachusetts, 02111, United States of America","address":{"information":"Visitor Information Center at Boston Common","house_number":"148","road":"Tremont Street","neighbourhood":"Chinatown","suburb":"Beacon Hill","city":"Boston","county":"Suffolk County","state":"Massachusetts","postcode":"02111","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=42.7153&lon=-84.4995&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_michigan={"place_id":"117203493","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"264540336","lat":"42.71532985","lon":"-84.4995249806439","display_name":"Building 1572, 30, Middlevale Road, Spartan Village, East Lansing, Ingham County, Michigan, 48823, United States of America","address":{"building":"Building 1572","house_number":"30","road":"Middlevale Road","residential":"Spartan Village","city":"East Lansing","county":"Ingham County","state":"Michigan","postcode":"48823","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=47.8278&lon=-90.0484&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_minnesota={"place_id":"69420336","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"56684658","lat":"47.8397542","lon":"-90.0551622","display_name":"Superior Hiking Trail, Cook County, Minnesota, United States of America","address":{"footway":"Superior Hiking Trail","county":"Cook County","state":"Minnesota","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=30.3986&lon=-88.8820&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_mississippi={"place_id":"93852729","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"165919984","lat":"30.3984797","lon":"-88.8818930732571","display_name":"189, Bellman Street, Biloxi, Harrison County, Mississippi, 39501, United States of America","address":{"house_number":"189","road":"Bellman Street","city":"Biloxi","county":"Harrison County","state":"Mississippi","postcode":"39501","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=37.0799&lon=-94.5060&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_missouri={"place_id":"56101640","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"18514619","lat":"37.08136","lon":"-94.5070289","display_name":"Iowa Avenue, Joplin, Jasper County, Missouri, 64801, United States of America","address":{"road":"Iowa Avenue","city":"Joplin","county":"Jasper County","state":"Missouri","postcode":"64801","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=48.3866&lon=-115.5498&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_montana={"place_id":"68329859","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"51770096","lat":"48.386884","lon":"-115.5513568","display_name":"East 9th Street, Libby, Lincoln County, Montana, 59923, United States of America","address":{"road":"East 9th Street","city":"Libby","county":"Lincoln County","state":"Montana","postcode":"59923","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=41.2587&lon=-95.9374&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_nebraska={"place_id":"114746992","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"256624885","lat":"41.25918915","lon":"-95.9378725469971","display_name":"First National Bank Tower, 1601, Dodge Street, Omaha, Douglas County, Nebraska, 68102, United States of America","address":{"building":"First National Bank Tower","house_number":"1601","road":"Dodge Street","city":"Omaha","county":"Douglas County","state":"Nebraska","postcode":"68102","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=36.1215&lon=-115.1704&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_nevada={"place_id":"63631543","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"33996606","lat":"36.1217339","lon":"-115.1705755","display_name":"Rialto bridge, Hughes Center, Paradise, Clark County, Nevada, 89109, United States of America","address":{"footway":"Rialto bridge","suburb":"Hughes Center","town":"Paradise","county":"Clark County","state":"Nevada","postcode":"89109","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.5628&lon=-71.9447&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_newhampshire={"place_id":"56068503","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"18851394","lat":"43.560882","lon":"-71.9468629","display_name":"Library Road, Grafton, Grafton County, New Hampshire, 03240, United States of America","address":{"road":"Library Road","town":"Grafton","county":"Grafton County","state":"New Hampshire","postcode":"03240","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=39.9475&lon=-75.1066&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_newjersey={"place_id":"51221798","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"11599189","lat":"39.949244","lon":"-75.1070549","display_name":"Centennial Drive, Camden, Camden County, New Jersey, 08105, United States of America","address":{"road":"Centennial Drive","city":"Camden","county":"Camden County","state":"New Jersey","postcode":"08105","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=34.0790&lon=-107.6179&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_newmexico={"place_id":"77778505","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"104970602","lat":"34.0684393","lon":"-107.6114804","display_name":"Old Highway 60, Socorro County, New Mexico, United States of America","address":{"road":"Old Highway 60","county":"Socorro County","state":"New Mexico","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=42.8126&lon=-73.9379&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_newyork={"place_id":"84525817","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"126855890","lat":"42.81240725","lon":"-73.9381957169258","display_name":"Franklin Plaza, Lafayette Street, City of Schenectady, Schenectady County, New York, 12305, United States of America","address":{"building":"Franklin Plaza","road":"Lafayette Street","city":"City of Schenectady","county":"Schenectady County","state":"New York","postcode":"12305","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=35.7802&lon=-78.6394&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_northcarolina={"place_id":"99468133","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"189846068","lat":"35.7804055","lon":"-78.639099844006","display_name":"Union Square, East Edenton Street, Warehouse District, Raleigh, Wake County, North Carolina, 27601, United States of America","address":{"park":"Union Square","road":"East Edenton Street","suburb":"Warehouse District","city":"Raleigh","county":"Wake County","state":"North Carolina","postcode":"27601","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=48.1459&lon=-103.6232&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_northdakota={"place_id":"49344497","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"9835550","lat":"48.148945","lon":"-103.6237439","display_name":"1st Avenue West, Williston, Williams County, North Dakota, 58801, United States of America","address":{"road":"1st Avenue West","city":"Williston","county":"Williams County","state":"North Dakota","postcode":"58801","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=41.4846&lon=-82.6852&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_ohio={"place_id":"56170259","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"19039813","lat":"41.4843124","lon":"-82.6844091","display_name":"Perimeter Road, Sandusky, Erie County, Ohio, United States of America","address":{"road":"Perimeter Road","city":"Sandusky","county":"Erie County","state":"Ohio","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=36.0514&lon=-95.7892&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_oklahoma={"place_id":"53556138","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"15043426","lat":"36.051459","lon":"-95.7877959","display_name":"East Commercial Street, Broken Arrow, Tulsa County, Oklahoma, 74012, United States of America","address":{"road":"East Commercial Street","city":"Broken Arrow","county":"Tulsa County","state":"Oklahoma","postcode":"74012","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=45.3732&lon=-121.6959&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_oregon={"place_id":"88189444","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"146985872","lat":"45.3834699","lon":"-121.6675317","display_name":"Cooper Spur #600B, Hood River County, Oregon, United States of America","address":{"footway":"Cooper Spur #600B","county":"Hood River County","state":"Oregon","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=40.3340&lon=-75.9300&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_pennsylvania={"place_id":"116304319","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"260794611","lat":"40.3340718","lon":"-75.9294293956808","display_name":"Parking Garage, Cherry Street, Reading, Berks County, Pennsylvania, 19602, United States of America","address":{"parking":"Parking Garage","road":"Cherry Street","city":"Reading","county":"Berks County","state":"Pennsylvania","postcode":"19602","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=18.4364&lon=-66.1188&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_puertorico={"place_id":"57584232","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"22162032","lat":"18.435917","lon":"-66.1189319","display_name":"Calle Antonio R Barcel\u00f3, Pueblo Viejo, Guaynabo, Puerto Rico, 00965, United States of America","address":{"road":"Calle Antonio R Barcel\u00f3","city":"Pueblo Viejo","county":"Guaynabo","state":"Puerto Rico","postcode":"00965","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=41.8251&lon=-71.4194&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_rhodeisland={"place_id":"83352312","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"123069111","lat":"41.82518","lon":"-71.4193269","display_name":"I 95, Providence, Providence County, Rhode Island, 02903, United States of America","address":{"road":"I 95","city":"Providence","county":"Providence County","state":"Rhode Island","postcode":"02903","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=32.7878&lon=-79.9392&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_southcarolina={"place_id":"111459509","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"241968972","lat":"32.7876248","lon":"-79.9386555934906","display_name":"Dream Factory, Warren Street, Charleston, Charleston County, South Carolina, 29424, United States of America","address":{"building":"Dream Factory","road":"Warren Street","city":"Charleston","county":"Charleston County","state":"South Carolina","postcode":"29424","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=43.7148&lon=-98.0249&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_southdakota={"place_id":"71642010","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"73851137","lat":"43.71474935","lon":"-98.0248767861259","display_name":"Mitchell Corn Palace, East 6th Avenue, Mitchell, Davison County, South Dakota, 57301, United States of America","address":{"attraction":"Mitchell Corn Palace","road":"East 6th Avenue","city":"Mitchell","county":"Davison County","state":"South Dakota","postcode":"57301","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=35.1438&lon=-90.0231&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_tennessee={"place_id":"83552895","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"124068656","lat":"35.1386836","lon":"-90.0240493","display_name":"I 240, Memphis, Shelby County, Tennessee, 38104, United States of America","address":{"road":"I 240","city":"Memphis","county":"Shelby County","state":"Tennessee","postcode":"38104","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=30.2655&lon=-97.7559&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_texas={"place_id":"111446948","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"238575801","lat":"30.2657266","lon":"-97.7556813","display_name":"Pfluger Pedestrian Bridge, Austin, Travis County, Texas, 78746, United States of America","address":{"footway":"Pfluger Pedestrian Bridge","city":"Austin","county":"Travis County","state":"Texas","postcode":"78746","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=18.3433&lon=-64.9347&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_virginislands={"place_id":"2526584","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"356559537","lat":"18.3430118","lon":"-64.9354233","display_name":"Christ Church Methodist Church, Rosen Gade, Charlotte Amalie, St. Thomas Island, United States Virgin Islands, 00803, United States of America","address":{"place_of_worship":"Christ Church Methodist Church","road":"Rosen Gade","town":"Charlotte Amalie","county":"St. Thomas Island","state":"United States Virgin Islands","postcode":"00803","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=40.5888&lon=-111.6378&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_utah={"place_id":"115632992","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"257809595","lat":"40.5886217","lon":"-111.6378685","display_name":"Alta Lodge Tow, East Perruvian Acre Road, Alta, Salt Lake County, Utah, United States of America","address":{"address29":"Alta Lodge Tow","road":"East Perruvian Acre Road","town":"Alta","county":"Salt Lake County","state":"Utah","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=44.2597&lon=-72.5800&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_vermont={"place_id":"112934331","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"244468089","lat":"44.25920675","lon":"-72.5796506738965","display_name":"53, Memorial Drive, Montpelier, Washington County, Vermont, 05602, United States of America","address":{"house_number":"53","road":"Memorial Drive","city":"Montpelier","county":"Washington County","state":"Vermont","postcode":"05602","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=36.9454&lon=-76.2888&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_virginia={"place_id":"67801749","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"48865930","lat":"36.944601","lon":"-76.2960629","display_name":"Bellinger Blvd, Glenwood Park, Norfolk, Virginia, 23511, United States of America","address":{"road":"Bellinger Blvd","hamlet":"Glenwood Park","city":"Norfolk","state":"Virginia","postcode":"23511","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=46.8598&lon=-121.7256&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_washington={"place_id":"110787862","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"235233247","lat":"46.8223122","lon":"-121.7272168","display_name":"Camp Muir Route, Paradise, Pierce County, Washington, United States of America","address":{"footway":"Camp Muir Route","hamlet":"Paradise","county":"Pierce County","state":"Washington","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=38.3686&lon=-81.6070&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_westvirginia={"place_id":"53946928","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"15572790","lat":"38.368065","lon":"-81.6063089","display_name":"Barlow Drive, Twomile, Kanawha County, West Virginia, 25311, United States of America","address":{"road":"Barlow Drive","hamlet":"Twomile","county":"Kanawha County","state":"West Virginia","postcode":"25311","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=45.8719&lon=-89.6930&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_wisconsin={"place_id":"58231065","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"21562994","lat":"45.8707426","lon":"-89.6984064","display_name":"Cedar Street, Minocqua, Oneida County, Wisconsin, United States of America","address":{"road":"Cedar Street","village":"Minocqua","county":"Oneida County","state":"Wisconsin","country":"United States of America","country_code":"us"}};
// https://nominatim.openstreetmap.org/reverse?format=json&lat=42.8590&lon=-106.3126&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_usa_wyoming={"place_id":"54223976","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"15763013","lat":"42.8591296","lon":"-106.317155","display_name":"East H Street, Casper, Natrona County, Wyoming, 82601, United States of America","address":{"road":"East H Street","city":"Casper","county":"Natrona County","state":"Wyoming","postcode":"82601","country":"United States of America","country_code":"us"}};
/* }}} */

/* Italy {{{ */
var nominatimTestJSON_italy = {
    "place_id"     :  "127565598",
    "licence"      :  "Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
    "osm_type"     :  "relation",
    "osm_id"       :  "40784",
    "lat"          :  "41.9808038",
    "lon"          :  "12.7662312",
    "display_name" :  "Lazio, Italy",
    "address": {
        "state"        :  "Lazio",
        "country"      :  "Italy",
        "country_code" :  "it",
    },
}
/* }}} */

/* Czech Republic {{{ */
// https://nominatim.openstreetmap.org/reverse?format=json&lat=50.0874401&lon=14.4212556&zoom=18&addressdetails=1&accept-language=en
var nominatimTestJSON_czechRepublic = {
    "place_id":"2582799432",
    "licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright",
    "osm_type":"way",
    "osm_id":"340086966",
    "lat":"50.08748275",
    "lon":"14.4213733265222",
    //"display_name":"Pražský poledník, Staroměstské náměstí, Old Town, Prague, okres Hlavní město Praha, Hlavní město Praha, Praha, 11000, Czech Republic",
    "address": {
        //"memorial":"Pražský poledník",
        //"pedestrian":"Staroměstské náměstí",
        //"suburb":"Old Town",
        //"city":"Prague",
        //"county":"okres Hlavní město Praha",
        //"state":"Praha",
        "postcode":"11000",
        "country":"Czech Republic",
        "country_code":"cz"
    }
}
/* }}} */

/* }}} */
/* }}} */

var sane_value_suffix = '; 00:23-00:42 closed "warning at correct position?"';
// Suffix to add to values to make the value more complex and to spot problems
// easier without changing there meaning (in most cases).
var value_suffix = '; 00:23-00:42 unknown "warning at correct position?"';
// This suffix value is there to test if the warning marks the correct position of the problem.
var value_suffix_to_disable_time_not_used = ' 12:00-15:00';
var value_perfectly_valid = [
    'Mo-Fr 12:00-18:00; We off; Sa,PH 12:00-17:00; Th[3],Th[-1] off',
    'open; Tu-Su 08:30-09:00 off; Tu-Su,PH 14:00-14:30 off; Mo 08:00-13:00 off',
    /* Don‘t use 24/7 instead of "open". PH usage does not make much sense … */
];
/* Used in the README and other places.
 * Those values must be perfectly valid and not return any warnings,
 * regardless of the warnings_severity.
 */

/* Avoid the warning that no time selector was used in a rule. Use this if you
 * are checking for values which should return another warning.
 * warning.
 */

test.addTest('Week range spawn week', [
    'week 01-53/2 Tu 07:30-08:00',
    'week 1-53/2 Tu 07:30-08:00',
], '2016.11.07 16:59', '2016.11.08 16:59', [
    [ '2016.11.08 07:30', '2016.11.08 08:00' ],
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

    this.runSingleTestShouldFail = function(test_data_object) { /* {{{ */
        var name           = test_data_object[0],
            value          = test_data_object[1],
            nominatimJSON = test_data_object[2],
            oh_mode        = test_data_object[3];
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
    }; /* }}} */

    this.runSingleTestShouldThrowWarning = function(test_data_object) { /* {{{ */
        var name           = test_data_object[0],
            value          = test_data_object[1],
            nominatimJSON = test_data_object[2],
            oh_mode        = test_data_object[3];
        var ignored = typeof value !== 'string';
        if (ignored) {
            this.ignored.push(value);
            ignored = value[1];
            value   = value[0];
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
    }; /* }}} */

    this.runSingleTest = function(test_data_object) { /* {{{ */
        var name                = test_data_object[0],
            value               = test_data_object[1],
            first_value         = test_data_object[2],
            from                = test_data_object[3],
            to                  = test_data_object[4],
            expected_intervals  = test_data_object[5],
            expected_durations  = test_data_object[6],
            expected_weekstable = test_data_object[7],
            nominatimJSON      = test_data_object[8],
            oh_mode             = test_data_object[9];
        var ignored = typeof value !== 'string';
        if (ignored) {
            this.ignored.push(value);
            ignored = value[1];
            value   = value[0];
        }

        var oh, intervals, durations, weekstable, prettified, intervals_ok, duration_ok, weekstable_ok, prettify_ok, crashed = true;

        var warnings;
        try {
            oh = new opening_hours(value, nominatimJSON, oh_mode);

            warnings = oh.getWarnings();

            intervals  = oh.getOpenIntervals(new Date(from), new Date(to));
            durations  = oh.getOpenDuration(new Date(from), new Date(to));
            weekstable = oh.isWeekStable();

            var prettifyValue_argument_hash = {};
            prettified = oh.prettifyValue(prettifyValue_argument_hash);

            intervals_ok  = typeof expected_intervals  === 'undefined' || intervals.length === expected_intervals.length;
            duration_ok   = (typeof expected_durations[0] === 'undefined' || durations[0] === expected_durations[0])
                && (typeof expected_durations[1] === 'undefined' || durations[1] === expected_durations[1]);
            weekstable_ok = typeof expected_weekstable === 'undefined' || weekstable === expected_weekstable;
            prettify_ok   = typeof prettified === 'undefined' || prettified === value || prettified === first_value;

            crashed = false;
        } catch (err) {
            crashed = err;
        }

        for (var interval = 0; interval < expected_intervals.length; interval++) {

            var expected_from = new Date(expected_intervals[interval][0]);
            var expected_to   = new Date(expected_intervals[interval][1]);

            if (intervals_ok) {
                if (   intervals[interval][0].getTime() !== expected_from.getTime()
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
                && (prettify_ok   || ignored === 'prettifyValue')
                && (weekstable_ok || ignored === 'check for week stable not implemented')) { // replace 'check for week stable not implemented'.
            str += 'PASSED'.passed;
            if (ignored) {
                if (ignored === 'check for week stable not implemented') {
                    str += ', ' + 'except'.ignored + ' weekstable which is ignored for now';
                } else if (ignored === 'prettifyValue'){
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
                ||  ignored === 'check for week stable not implemented'
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
    }; /* }}} */

    this.runSingleTestCompMatchingRule = function(test_data_object) { /* {{{ */
        var name           = test_data_object[0],
            value          = test_data_object[1],
            point_in_time  = test_data_object[2],
            expected_matching_rule  = test_data_object[3],
            nominatimJSON = test_data_object[4];
        var matching_rule, matching_rule_ok;
        try {
            // since they should fail anyway we can give them the nominatimTestJSON
            oh = new opening_hours(value, nominatimJSON);
            it = oh.getIterator(new Date(point_in_time));

            matching_rule = oh.prettifyValue({ rule_index: it.getMatchingRule() });
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
    }; /* }}} */

    this.runSingleTestPrettifyValue = function(test_data_object) { /* {{{ */
        var name = test_data_object[0],
            value = test_data_object[1],
            prettify_locale = test_data_object[2],
            expected_prettified_value = test_data_object[3];
        var prettify_value_ok;
        try {
            oh = new opening_hours(value, nominatimTestJSON);

            prettified_value = oh.prettifyValue({ 'conf': { 'locale': prettify_locale } });
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
    }; /* }}} */

    this.runSingleTestEqualTo = function(test_data_object) { /* {{{ */
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
    }; /* }}} */

    // }}}

    // run all tests (public function) {{{
    this.run = function() {
        var tests_length = this.tests.length +
            this.tests_should_fail.length +
            this.tests_should_warn.length +
            this.tests_comp_matching_rule.length +
            this.tests_prettify_value.length +
            this.tests_equal_to.length;
        var success   = 0;
        this.ignored  = [];
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
                var value   = this.ignored[i][0];
                var reason  = this.ignored[i][1];
                if (typeof ignored_categories[reason] !== 'number') {
                    ignored_categories[reason] = 1;
                } else {
                    ignored_categories[reason]++;
                }
            }

            var sorted_ignores = [];
            for (var key in ignored_categories)
                sorted_ignores.push([key, ignored_categories[key]]);

            sorted_ignores.sort(function(a, b) {
                return a[1] > b[1] ? -1 : (a[1] < b[1] ? 1 : 0);
            });
            for (var i = 0; i < sorted_ignores.length; i++) {
                var reason = sorted_ignores[i][0];
                var count  = sorted_ignores[i][1];
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
    this.addTest = function(name, values, from, to, expected_intervals, expected_duration, expected_unknown_duration, expected_weekstable, nominatimJSON, last, oh_mode) {

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
                [ expected_duration, expected_unknown_duration ], expected_weekstable, nominatimJSON, oh_mode]);
        else
            for (var value_ind = 0; value_ind < values.length; value_ind++)
                this.tests.push([name, values[value_ind], values[0], from, to, expected_intervals,
                    [ expected_duration, expected_unknown_duration ], expected_weekstable, nominatimJSON, oh_mode]);
    };
    // }}}

    // add test which should fail {{{
    this.addShouldFail = function(name, values, nominatimJSON, last, oh_mode) {
        if (this.last === true)  {
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
    this.addShouldWarn = function(name, values, nominatimJSON, last, oh_mode) {
        if (this.last === true)  {
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
    this.addCompMatchingRule = function(name, values, date, matching_rule, nominatimJSON, last) {
        if (this.last === true)  {
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
    this.addPrettifyValue = function(name, values, only_test_for_locale, expected_prettified_value, last) {
        if (this.last === true)  {
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
    this.addEqualTo = function(name, first_values, second_value, expected_result, last) {
        if (this.last === true)  {
            return;
        }
        this.handle_only_test(last);

        if (typeof first_values === 'string') {
            this.tests_equal_to.push([name, first_values, second_value, expected_result]);
        } else if (typeof first_values === 'object'){
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
            var to   = formatDate(item[1]);
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
        } else if (typeof oh_mode['locale'] !== 'string'){
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

    this.handle_only_test = function(last) { /* {{{ */
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

    this.print_warnings = function(warnings) { /* {{{ */
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
    return [ value, reason ];
}
// }}}
// }}}
// vim: set ts=4 sw=4 tw=78 et :
