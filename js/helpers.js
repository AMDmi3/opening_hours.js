/* Constants {{{ */
var nominatim_api_url = 'https://nominatim.openstreetmap.org/reverse';
// var nominatim_api_url = 'https://open.mapquestapi.com/nominatim/v1/reverse.php';

var evaluation_tool_colors = {
    'ok': '#ADFF2F',
    'warn': '#FFA500',
};
/* }}} */

// load nominatim_data in JOSM {{{
// Using a different way to load stuff in JOSM than https://github.com/rurseekatze/OpenLinkMap/blob/master/js/small.js
// prevent josm remote plugin of showing message
// FIXME: Warning in console. Encoding stuff.
function josm(url_param) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:8111/' + url_param, true);      // true makes this call asynchronous
    xhr.onreadystatechange = function () {    // need eventhandler since our call is async
        if ( xhr.status !== 200 ) {
            alert(i18n.t('texts.JOSM remote conn error'));
        }
    };
    xhr.send(null);
}
// }}}

// add calculation for calendar week to date {{{
function dateAtWeek(date, week) {
    var minutes_in_day = 60 * 24;
    var msec_in_day    = 1000 * 60 * minutes_in_day;
    var msec_in_week   = msec_in_day * 7;

    var tmpdate = new Date(date.getFullYear(), 0, 1);
    tmpdate.setDate(1 - (tmpdate.getDay() + 6) % 7 + week * 7); // start of week n where week starts on Monday
    return Math.floor((date - tmpdate) / msec_in_week);
}
// }}}

/*
 * The names of countries and states are localized in OSM and opening_hours.js (holidays) so we need to get the localized names from Nominatim as well.
 */
function reverseGeocodeLocation(query, guessed_language_for_location, callback) {
    var nominatim_api_url_template_query = nominatim_api_url
        + '?format=json'
        + query
        + '&zoom=5'
        + '&addressdetails=1'
        + '&email=ypid23@aol.de';

    var nominatim_api_url_query = nominatim_api_url_template_query;
    if (typeof accept_lanaguage === 'string') {
        nominatim_api_url_query += '&accept-language=' + guessed_language_for_location;
    }

    $.getJSON(nominatim_api_url_query, function(nominatim_data) {
        // console.log(JSON.stringify(nominatim_data, null, '\t'));
        if (nominatim_data.address.country_code === guessed_language_for_location) {
            callback(nominatim_data);
        } else {
            nominatim_api_url_query += '&accept-language=' + mapCountryToLanguage(nominatim_data.address.country_code);
            $.getJSON(nominatim_api_url_query, function(nominatim_data) {
                callback(nominatim_data);
            });
        }
    });
}

function submitenter(myfield,e) {
    Evaluate();
    // var keycode;
    // if (window.event) keycode = window.event.keyCode;
    // else if (e) keycode = e.which;
    // else return true;

    // if (keycode === 13) {
    //     Evaluate();
    //     return false;
    // } else
    //     return true;
}

/* JS for toggling examples on and off {{{ */
function toggle(control){
    var elem = document.getElementById(control);

    if (elem.style.display === "none") {
        elem.style.display = "block";
    } else {
        elem.style.display = "none";
    }
}
/* }}} */
