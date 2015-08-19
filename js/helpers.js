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

var nominatim_api_url = 'https://nominatim.openstreetmap.org/reverse';
// var nominatim_api_url = 'https://open.mapquestapi.com/nominatim/v1/reverse.php';
