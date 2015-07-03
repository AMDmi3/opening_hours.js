if (typeof variable !== 'undefined') {
    var i18n = require('i18next');
    var moment = require('moment');
}


// localization {{{
var opening_hours_resources = { // English is fallback language.
    // English (en) localization {{{
    en: {
        opening_hours: {
            "texts": {
                'unexpected_token': 'Unexpected token: "__token__" This means that the syntax is not valid at that point or it is currently not supported.__warnings__',
                'no_string': 'The value (first parameter) is not a string.',
                'nothing': 'The value contains nothing meaningful which can be parsed.',
                'nothing_useful': 'This rule does not contain anything useful. Please remove this empty rule.',
                'programmers_joke': 'Might it be possible that you are a programmer and adding a semicolon after each statement is hardwired in your muscle memory ;) ?'
                + ' The thing is that the semicolon in the opening_hours syntax is defined as rule separator.'
                + ' So for compatibility reasons you should omit this last semicolon.',
                'interpreted_as_year': 'The number __number__ will be interpreted as year.'
                + ' This is probably not intended. Times can be specified as "12:00".',
                'rule_before_fallback_empty': 'Rule before fallback rule does not contain anything useful',
                'hour_min_seperator': 'Please use ":" as hour/minute-separator',
            },
            "pretty": {
                "off": "closed",
                "SH": "school holidays",
                "PH": 'public holidays',
            }
        }
    },
    de: {
        opening_hours: {
            "texts": {
                'unexpected_token': 'Unerwartetes Zeichen: "__token__" Das beudetet, dass die Syntax an dieser Stelle nicht erkannt werden konnte.__warnings__',
                'no_string': 'Der Wert (erster parameter) ist kein String',
                'nothing': 'Der Wert enthält nichts, was ausgewertet werden könnte.',
                'nothing_useful': 'Diese Regel enthält nichts nützliches. Bitte entferne diese leere Regel.',
                'programmers_joke': 'Kann es sein, dass du ein Programmier bist und das Hinzufügen eines Semikolons nach jedem Statement ist zwanghaft ;) ?'
                + ' Es ist so, dass das Semikolon in der opening_hours Syntax als Trenner für Regeln definiert ist.'
                + ' Du solltest bitte des abschließende Semikolon auslassen.',
                'interpreted_as_year': 'Die Zahl __number__ wird als Jahr interpretiert.'
                + ' Vermutlich ist das nicht beabsichtigt. Uhrzeiten werden als "12:00" angegeben.',
                'rule_before_fallback_empty': 'Die Regel vor der Fallback-Regel enthält nichts nützliches',
                'hour_min_seperator': 'Bitte benutze ":" als Stunden/Minuten Trenner',
            },
            "pretty": {
                "off": "geschlossen",
                "SH": "Schulferien",
                "PH": "feiertags",
            }
        }
    }
};

if (!i18n.isInitialized()) {
    i18n.init({
        fallbackLng: 'en',
        resStore: opening_hours_resources,
        getAsync: true,
        useCookie: true,
        debug: true
    });
    moment.locale(i18n.lng());
} else {
    // compat with an app that already initializes i18n
    for (lang in opening_hours_resources) {
        i18n.addResourceBundle(lang, 'opening_hours', opening_hours_resources[lang]['opening_hours'], true);

    }
}
// }}}
// }}}
