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
                'unexpected token': 'Unexpected token: "__token__" This means that the syntax is not valid at that point or it is currently not supported.__warnings__',
                'no string': 'The value (first parameter) is not a string.',
                'nothing': 'The value contains nothing meaningful which can be parsed.',
                'nothing useful': 'This rule does not contain anything useful. Please remove this empty rule.',
                'programmers joke': 'Might it be possible that you are a programmer and adding a semicolon after each statement is hardwired in your muscle memory ;) ?'
                + ' The thing is that the semicolon in the opening_hours syntax is defined as rule separator.'
                + ' So for compatibility reasons you should omit this last semicolon.',
                'interpreted as year': 'The number __number__ will be interpreted as year.'
                + ' This is probably not intended. Times can be specified as "12:00".',
                'rule before fallback empty': 'Rule before fallback rule does not contain anything useful',
                'hour min seperator': 'Please use ":" as hour/minute-separator',
                'warnings severity': 'The parameter optional_conf_parm["warnings_severity"] must be an integer number between 0 and 7 (inclusive).'
                + ' Given __severity__ '
                + ', expected one of the following numbers: [ 0, 1, 2, 3, 4, 5, 6, 7 ].',
                'optional conf parm type': 'The optional_conf_parm parameter is of unknown type.'
                + ' Given _given_',
                'conf param tag key missing': 'The optional_conf_parm["tag_key"] is missing, required by optional_conf_parm["map_value"].',
                'conf param mode invalid': 'The optional_conf_parm["mode"] parameter is a invalid number.'
                + ' Gave __given__'
                + ', expected one of the following numbers: [ 0, 1, 2 ].',
                'conf param unkown type': 'The optional_conf_parm["__key__"] parameter is of unknown type.'
                + ' Given __given__' + +', expected __expected__.',
                'library bug': 'An error occurred during evaluation of the value "__value__".'
                + ' Please file a bug report here: __url__. __message__',
                'use multi': 'You have used __count__ __part2__ Rules can be separated by ";".',
                'selector multi 2a': '__what__ in one rule. You may only use one in one rule.',
                'selector multi 2b': 'not connected __what__ in one rule. This is probably an error.'
                + ' Equal selector types can (and should) always be written in conjunction separated by comma.'
                + ' Example for time ranges "12:00-13:00,15:00-18:00".'
                + ' Example for weekdays "Mo-We,Fr".',
                'selector state': 'state keywords',
                'comments': 'comments',
                'months': 'months',
                'weekdays': 'weekdays',
                'ranges': 'ranges',
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
                'unexpected token': 'Unerwartetes Zeichen: "__token__" Das beudetet, dass die Syntax an dieser Stelle nicht erkannt werden konnte.__warnings__',
                'no string': 'Der Wert (erster parameter) ist kein String',
                'nothing': 'Der Wert enthält nichts, was ausgewertet werden könnte.',
                'nothing useful': 'Diese Regel enthält nichts nützliches. Bitte entferne diese leere Regel.',
                'programmers joke': 'Kann es sein, dass du ein Programmier bist und das Hinzufügen eines Semikolons nach jedem Statement ist zwanghaft ;) ?'
                + ' Es ist so, dass das Semikolon in der opening_hours Syntax als Trenner für Regeln definiert ist.'
                + ' Du solltest bitte des abschließende Semikolon auslassen.',
                'interpreted as year': 'Die Zahl __number__ wird als Jahr interpretiert.'
                + ' Vermutlich ist das nicht beabsichtigt. Uhrzeiten werden als "12:00" angegeben.',
                'rule before fallback empty': 'Die Regel vor der Fallback-Regel enthält nichts nützliches',
                'hour min seperator': 'Bitte benutze ":" als Stunden/Minuten Trenner',
                'warnings severity': 'The parameter optional_conf_parm["warnings_severity"] must be an integer number between 0 and 7 (inclusive).'
                + ' Given __severity__ '
                + ', expected one of the following numbers: [ 0, 1, 2, 3, 4, 5, 6, 7 ].',
                'optional conf parm type': 'The optional_conf_parm parameter is of unknown type.'
                + ' Given _given_',
                'conf param tag key missing': 'The optional_conf_parm["tag_key"] is missing, required by optional_conf_parm["map_value"].',
                'conf param mode invalid': 'The optional_conf_parm["mode"] parameter is a invalid number.'
                + ' Gave __given__'
                + ', expected one of the following numbers: [ 0, 1, 2 ].',
                'conf param unkown type': 'The optional_conf_parm["__key__"] parameter is of unknown type.'
                + ' Given __given__' + +', expected __expected__.',
                'library bug': 'An error occurred during evaluation of the value "__value__".'
                + ' Please file a bug report here: __url__. __message__',
                'use multi': 'Du hast __count__ __part2__ Rules can be separated by ";".',
                'selector multi 2a': '__what__ in einer Regel benutzt. Du kannst nur einen davon je Regel verwenden',
                'selector multi 2b': 'nicht verbundene __what__ in einer Regel benutzt. Das ist vermutlich ein Fehler.'
                + ' Gleiche Selektoren können (und sollten) immer zusammen und durch Kommas getrennt geschrieben werden.'
                + ' Beispiel für Zeitspannen "12:00-13:00,15:00-18:00".'
                + ' Beispiel für Wochentage "Mo-We,Fr".',
                'selector state': 'Status-Schlüsselwörter (offen, geschlossen)',
                'comments': 'Kommentare',
                'months': 'Monate',
                'weekdays': 'Wochentage',
                'ranges': 'Zeitspannen',
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
