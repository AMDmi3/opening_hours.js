if (typeof variable !== 'undefined') {
    var i18n = require('i18next');
    var moment = require('moment');
}


// localization {{{
var opening_hours_resources = { // English is fallback language.
    // English (en) localization {{{
    en: {
        opening_hours: {
            // Dear Translator,
            // the original English texts are bundled with the lib, search for "var lang =" in opening_hours.js
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
                'default state': "This rule which changes the default state (which is closed) for all following rules is not the first rule."
                + " The rule will overwrite all previous rules."
                + " It can be legitimate to change the default state to open for example"
                + " and then only specify for which times the facility is closed.",
                'vague': "This rule is not very explicit because there is no time selector being used."
                + " Please add a time selector to this rule or use a comment to make it more explicit.",
                'empty comment': "You have used an empty comment."
                + " Please either write something in the comment or use the keyword unknown instead.",
                'separator_for_readability': "You have used the optional symbol <separator_for_readability> in the wrong place."
                + " Please check the syntax specification to see where it could be used or remove it.",
                'strange 24/7': 'You used 24/7 in a way that is probably not interpreted as "24 hours 7 days a week".'
                + ' For correctness you might want to use "open" or "closed"'
                + ' for this rule and then write your exceptions which should achieve the same goal and is more clear'
                + ' e.g. "open; Mo 12:00-14:00 off".',
                'public holiday': 'There was no PH (public holiday) specified. This is not very explicit.__part2__'
                + ' Please either append a "PH off" rule if the amenity is closed on all public holidays'
                + ' or use something like "Sa,Su,PH 12:00-16:00" to say that on Saturdays, Sundays and on public holidays the amenity is open 12:00-16:00.'
                + ' If you are not certain try to find it out. If you can’t then do not add PH to the value and ignore this warning.',
                'public holiday part2': ' Unfortunately the tag key (e.g. "opening_hours", or "lit") is unknown to opening_hours.js.'
                + 'This warning only applies to the key(s): __keys__.  If your value is for that key than read on. If not you can ignore the following.',
                'switched': 'The selector "__first__" was switched with'
                + ' the selector "__second__"'
                + ' for readablitity and compatibiltity reasons.',
                'no colon after': 'Please don’t use ":" after __token__.',
                'number -5 to 5': 'Number between -5 and 5 (except 0) expected',
                'one weekday constraint': 'You can not use more than one constrained weekday in a month range',
                'range contrainted weekdays': 'You can not use a range of constrained weekdays in a month range',
                'expected': '"__symbol__" expected.',
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
