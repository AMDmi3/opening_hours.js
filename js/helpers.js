/* Constants {{{ */
var nominatim_api_url = 'https://nominatim.openstreetmap.org/reverse';
// var nominatim_api_url = 'https://open.mapquestapi.com/nominatim/v1/reverse.php';

var evaluation_tool_colors = {
    'ok': '#ADFF2F',
    'warn': '#FFA500',
    'error': '#DEB887',
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

/* JS for user testing stuff {{{ */
function copyToClipboard(text) {
    window.prompt('Copy to clipboard: Ctrl+C, Enter', text);
}

var lat, lon, string_lat, string_lon, nominatim;
var date;

function Evaluate (offset, reset) {
    if (typeof offset === 'undefined') {
        offset = 0;
    }

    if (document.forms.check.elements['lat'].value !== string_lat || document.forms.check.elements['lon'].value !== string_lon) {
        string_lat = document.forms.check.elements['lat'].value;
        string_lon = document.forms.check.elements['lon'].value;
        lat = parseFloat(string_lat);
        lon = parseFloat(string_lon);
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            if (typeof lat !== 'number') {
                document.forms.check.elements['lat'].value = default_lat;
            }
            if (typeof lon !== 'number') {
                document.forms.check.elements['lon'].value = default_lon;
            }
            console.log('Please enter numbers for latitude and longitude.');
            return;
        }
        reverseGeocodeLocation('&lat=' + lat + '&lon=' + lon, mapCountryToLanguage(i18n.lng()), function(nominatim_data) {
            document.forms.check.elements['cc'].value    = nominatim_data.address.country_code;
            document.forms.check.elements['state'].value = nominatim_data.address.state;
            nominatim = nominatim_data;
            Evaluate();
        });
    }

    date = reset
        ? new Date()
        : new Date(
            document.forms.check.elements['yyyy'].value,
            document.forms.check.elements['mm'].selectedIndex,
            document.forms.check.elements['dd'].value,
            document.forms.check.elements['HH'].value,
            parseInt(document.forms.check.elements['MM'].value),
            offset
        );

    function u2 (v) { return v>=0 && v<10 ? "0"+v : v; }

    document.forms.check.elements['yyyy'].value       = date.getFullYear();
    document.forms.check.elements['mm'].selectedIndex = date.getMonth();
    document.forms.check.elements['dd'].value         = u2(date.getDate());
    document.forms.check.elements['HH'].value         = u2(date.getHours());
    document.forms.check.elements['MM'].value         = u2(date.getMinutes());
    document.forms.check.elements['wday'].value       = moment.weekdays(date.getDay());
    document.forms.check.elements['week'].value       = 'W'+u2(dateAtWeek(date, 0) + 1);

    var show_time_table         = document.getElementById('show_time_table');
    var show_warnings_or_errors = document.getElementById('show_warnings_or_errors');
    var show_results            = document.getElementById('show_results');

    show_warnings_or_errors.innerHTML = '';

    var crashed = false;
    var value = document.forms.check.elements['expression'].value;
    var diff_value = document.forms.check.elements['diff_value'].value;
    var mode = parseInt(document.getElementById('mode').selectedIndex);
    try {
        var oh = new opening_hours(value, nominatim, {
            'mode': mode,
            'warnings_severity': 7,
            'locale': i18n.lng()
        });
        var it = oh.getIterator(date);
    } catch (err) {
        crashed = err;
        show_warnings_or_errors.innerHTML = '<p>' + i18n.t('texts.filter.error') + ':<br />'
            + '<textarea rows="' + crashed.split('\n').length + 1 + '" style="width: 100%" name="WarnErrors" readonly="readonly">' + crashed
            + '</textarea></p>';
        show_time_table.innerHTML = '';
        show_results.innerHTML    = '';
    }

    show_time_table.innerHTML = '<a href="javascript:josm(\'import?url=' + encodeURIComponent('https://overpass-api.de/api/xapi_meta?*[opening_hours='
        + document.forms.check.elements['expression'].value + ']') + '\')">' + i18n.t('texts.load all with JOSM') + '</a><br />';
    if (!crashed) {
        var prettified = oh.prettifyValue({});
        var prettified_value_array = oh.prettifyValue({
            // conf: { locale: i18n.lng() },
            get_internals: true,
        });
        // var prettified_newline_sep = oh.prettifyValue({ conf: { locale: i18n.lng(), rule_sep_string: '\n', print_semicolon: false } });
        show_results.innerHTML = '<p>' + i18n.t('words.status') + ':<br />'
            + '<input size="10" name="status" readonly="readonly" />'
            + '<input size="60" name="comment" readonly="readonly" />'
            + '</p>' + '<p>'
            + i18n.t('texts.MatchingRule') + ':<br />'
            + '<input style="width: 100%" name="MatchingRule" readonly="readonly" />'
            + '</p>';
        var used_selectors = { };
        var value_explanation =
            i18n.t('texts.prettified value for displaying') + ':<br />'
            + '<p class="value_explanation">';
        // console.log(JSON.stringify(prettified_value_array, null, '    '));
        // console.log(JSON.stringify(prettified_value_array, null, '    '));
        for (var nrule = 0; nrule < prettified_value_array[0].length; nrule++) {
            if (nrule !== 0) {
                var rule_separator = (
                    prettified_value_array[1][nrule][1]
                        ? ' ||'
                        : (
                            prettified_value_array[1][nrule][0][0][1] === 'rule separator'
                            ? ','
                            : ';'
                        )
                );
                value_explanation +=
                    '<span title="'
                    + i18n.t('texts.rule separator ' + rule_separator) + '"'
                    + ' class="rule_separator"><a target="_blank" class="specification" href="'
                    + specification_url + '#section:rule_separators'
                    + '">' + rule_separator + '</a></span><br>';
            }
            value_explanation += '<span class="one_rule">';
            for (var nselector = 0, sl = prettified_value_array[0][nrule].length; nselector < sl; nselector++) {
                var selector_type  = prettified_value_array[0][nrule][nselector][0][2];
                var selector_value = prettified_value_array[0][nrule][nselector][1];
                var fragment_identifier;
                switch(selector_type) {
                    case '24/7':
                        fragment_identifier = 'selector_sequence';
                        break;
                    case 'state':
                        fragment_identifier = 'section:rule_modifier';
                        break;
                    case 'comment':
                        fragment_identifier = 'comment';
                        break;
                    default:
                        fragment_identifier = 'selector:' + selector_type;
                }
                value_explanation += '<span title="'
                    + i18n.t('words.' + (selector_type.match(/(?:state|comment)/) ? 'modifier' : 'selector'), { name: selector_type }) + '"'
                    + ' class="' + selector_type + '"><a target="_blank" class="specification" href="'
                    + specification_url + '#' + fragment_identifier
                    + '">' + selector_value + '</a></span>';
                if (nselector + 1 < sl)
                    value_explanation += ' ';
                used_selectors[selector_type] = true;
            }
            // console.log(value_explanation);
            value_explanation += '</span>';
        }
        value_explanation += '</p></div>';
        if (YoHoursChecker.canRead(value)) {
            value_explanation = i18n.t('texts.refer to yohours', { href: 'http://github.pavie.info/yohours/?oh=' + value })
            + '<br>'
            + value_explanation;
        }

        if (diff_value.length > 0) {
          var is_equal_to;
          try {
              is_equal_to = oh.isEqualTo(new opening_hours(diff_value, nominatim, {
                  'mode': mode,
                  'warnings_severity': 7,
                  'locale': i18n.lng()
              }));
          } catch (err) {
              $('input#diff_value').css({'background-color' : evaluation_tool_colors.error})
          }
          if (typeof is_equal_to === 'object') {
            if (is_equal_to[0]) {
              $('input#diff_value').css({'background-color' : evaluation_tool_colors.ok})
            } else {
              $('input#diff_value').css({'background-color' : evaluation_tool_colors.warn})
              var human_readable_not_equal_output = jQuery.extend(true, {}, is_equal_to[1])
              if (typeof human_readable_not_equal_output.deviation_for_time === 'object') {
                human_readable_not_equal_output.deviation_for_time = {};
                for (var time_code in is_equal_to[1].deviation_for_time) {
                  console.log(time_code);
                  var time_string = new Date(parseInt(time_code)).toLocaleString();
                  human_readable_not_equal_output.deviation_for_time[time_string] =
                    is_equal_to[1].deviation_for_time[time_code];
                }
              }
              value_explanation = JSON.stringify(human_readable_not_equal_output, null, '    ')
                + '<br>'
                + value_explanation;
            }
          }
        }

        show_warnings_or_errors.innerHTML = value_explanation;

        // if (prettified_newline_sep.split('\n').length > 1)
            // show_results.innerHTML += '<p>' + i18n.t('texts.prettified value for displaying') + ':<br />'
                // + '<textarea rows="' + prettified_newline_sep.split('\n').length
                // + '" style="width: 100%" name="prettifiedValueNewlineSep" readonly="readonly">'
                // + prettified_newline_sep + '</textarea></p>';


        document.forms.check.elements['comment'].value = typeof it.getComment() !== 'undefined'
            ? it.getComment() : '>>' + i18n.t('words.no') + ' ' + i18n.t('words.comment') + '<<';
        document.forms.check.elements['status'].value = (it.getState() ? i18n.t('words.open')
            : (it.getUnknown() ? i18n.t('words.unknown') : i18n.t('words.closed')));
        var rule_index    = it.getMatchingRule();
        document.forms.check.elements['MatchingRule'].value = typeof rule_index === 'undefined'
            ? i18n.t('words.none') : oh.prettifyValue({ 'rule_index': rule_index });

        if (prettified !== value) {
            show_warnings_or_errors.innerHTML = '<p>' + i18n.t('texts.prettified value',
                { copyFunc: 'javascript:newValue(\'' + prettified.replace(/"/g, '&quot;') + '\')' }) + ':<br />'
                + '<input style="width: 100%" onclick="javascript:newValue(\'' + prettified.replace(/"/g, '&quot;') + '\')" id="prettifiedValue" name="prettifiedValue" value="' + prettified.replace(/"/g, '&quot;') + '" /></p>';
        }

        var warnings = oh.getWarnings();
        if (warnings.length > 0) {
            show_warnings_or_errors.innerHTML += '<p>' + i18n.t('texts.filter.error') + ':<br />'
                + '<textarea rows="' + (warnings.length + 1)
                + '" style="width: 100%" name="WarnErrors" readonly="readonly">' + warnings.join('\n')
                + '</textarea></p>';
        }

        if (prettified.length > 255) {
            show_warnings_or_errors.innerHTML += '<p>' + i18n.t('texts.value to long for osm',
                { pretLength: prettified.length, valLength: value.length, maxLength: 255 }) + '</p>';
        }

        show_time_table.innerHTML += OpeningHoursTable.drawTableAndComments(oh, it);
    }
}

function EX (element) {
    newValue(element.innerHTML);
    return false;
}

function newValue(value) {
    if (typeof document.forms.check.elements['prettifiedValue'] === 'object') {
        document.forms.check.elements['prettifiedValue'].focus();
        document.forms.check.elements['prettifiedValue'].focus();
    }
    document.forms.check.elements['expression'].value = value;
    Evaluate();
}

function permalink () {
    var exp = document.getElementById('expression').value;
    var lat = document.getElementById('lat').value;
    var lon = document.getElementById('lon').value;
    var mode = document.getElementById('mode').selectedIndex;

    var search='?EXP='+encodeURIComponent(exp)+'&DATE='+date.getTime() +'&lat='+lat+'&lon='+lon+'&mode='+mode;

    location = location.protocol+'//'+location.host+location.pathname+search;
}

function setCurrentPosition() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onPositionUpdate);
    }
}

function onPositionUpdate(position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lng;
    Evaluate();
    console.log("Current position: " + lat + " " + lng);
}
window.onload = function () {
    var prmarr = window.location.search.replace( "?", "" ).split("&");
    var params = {};
    var customCoords = false;

    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    if (typeof params['EXP'] !== 'undefined') {
        document.forms.check.elements['expression'].value = decodeURIComponent(params['EXP']);
    }
    if (typeof params['lat'] !== 'undefined') {
        document.forms.check.elements['lat'].value = decodeURIComponent(params['lat']);
        customCoords = true;
    }
    if (typeof params['lon'] !== 'undefined') {
        document.forms.check.elements['lon'].value = decodeURIComponent(params['lon']);
        customCoords = true;
    }
    if (typeof params['mode'] !== 'undefined') {
        document.forms.check.elements['mode'].value = decodeURIComponent(params['mode']);
    }
    if (typeof params['DATE'] !== 'undefined') {
        var crashed = true;
        try {
            date = new Date(parseInt(params['DATE']));
            crashed = false;
        } catch (err) {
            console.error(err);
        }
        if (!crashed) {
            document.forms.check.elements['yyyy'].value       = date.getFullYear();
            document.forms.check.elements['mm'].selectedIndex = date.getMonth();
            document.forms.check.elements['dd'].value         = date.getDate();
            document.forms.check.elements['HH'].value         = date.getHours();
            document.forms.check.elements['MM'].value         = date.getMinutes();
        }
        Evaluate(0, false);
    } else {
        Evaluate(0, true);
    }
    if (navigator.geolocation && !customCoords) {
        navigator.geolocation.getCurrentPosition(onPositionUpdate);
    };
};
/* }}} */
