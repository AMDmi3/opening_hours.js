// load data in JOSM {{{
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

/* Constants {{{ */
var nominatim_api_url = 'https://nominatim.openstreetmap.org/reverse';
// var nominatim_api_url = 'https://open.mapquestapi.com/nominatim/v1/reverse.php';
/* }}} */
