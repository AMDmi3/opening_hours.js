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
                'no string': 'Der Wert (erster Parameter) ist kein String',
                'nothing': 'Der Wert enthält nichts, was ausgewertet werden könnte.',
                'nothing useful': 'Diese Regel enthält nichts nützliches. Bitte entferne diese leere Regel.',
                'programmers joke': 'Kann es sein, dass du ein Programmier bist und das Hinzufügen eines Semikolons nach jedem Statement ist zwanghaft ;) ?'
                + ' Es ist so, dass das Semikolon in der opening_hours Syntax als Trenner für Regeln definiert ist.'
                + ' Du solltest bitte des abschließende Semikolon auslassen.',
                'interpreted as year': 'Die Zahl __number__ wird als Jahr interpretiert.'
                + ' Vermutlich ist das nicht beabsichtigt. Uhrzeiten werden als "12:00" angegeben.',
                'rule before fallback empty': 'Die Regel vor der Fallback-Regel enthält nichts nützliches',
                'hour min seperator': 'Bitte benutze ":" als Stunden/Minuten Trenner',
                'warnings severity': 'Der Parameter optional_conf_parm["warnings_severity"] muss eine ganze Zahl zwischen (einschließlich) 0 und (einschließlich) 7 sein.'
                + ' Gegeben: __severity__ '
                + ', erwartet: Eine der Zahlen: [ 0, 1, 2, 3, 4, 5, 6, 7 ].',
                'optional conf parm type': 'Der optional_conf_parm Parameter hat einen unbekannten Typ.'
                + ' Gegeben: _given_',
                'conf param tag key missing': 'Der optional_conf_parm["tag_key"] fehlt, ist aber notwendig wegen optional_conf_parm["map_value"].',
                'conf param mode invalid': 'Der optional_conf_parm["mode"] Parameter ist eine ungültige Zahl.'
                + ' Gegeben: __given__'
                + ', erwartet: Eine der Zahlen: [ 0, 1, 2 ].',
                'conf param unkown type': 'Der optional_conf_parm["__key__"] Parameter hat einen unbekannten Typ.'
                + ' Gegeben: __given__, erwartet: __expected__.',
                'library bug': 'Bei der Auswertung des Wertes "__value__" ist ein Fehler aufgetreten.'
                + ' Bitte melde diesen Bug hier: __url__. __message__',
                'use multi': 'Du hast __count__ __part2__ Einzelne Regeln können mit ";" getrennt werden.',
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
                'default state': "Diese Regel, welche den Standard Status (d.h. geschlossen) für alle folgenden Regeln ändert, ist nicht die erste Regel."
                + " Diese Regel überschreibt alle vorherigen Regeln."
                + " Es kann legtim sein, dden Standard Status z.B. auf geöffnet festzulegen"
                + " und dann nur die Zeiten zu denen geschlossen ist anzugeben.",
                'vague': "Diese Regel ist nicht sehr aussagekräftig, da keine Zeit angegeben wurde."
                + " Bitte füge eine Zeitangabe oder einen Kommentar hinzu um dies zu verbessern.",
                'empty comment': "Du hast einen leeren Kommentar verwendet."
                + '" Bitte schreib entweder einen Kommentar-Text oder benutze stattdessen das Schlüsselwort "unknown".',
                'separator_for_readability': "Du hast das optionale Symbol <separator_for_readability> an der falschen Stelle benutzt."
                + " Bitte lies die Syntax Spezifikation um zu sehen wo es verwendet werden kann oder entferne es.",
                'strange 24/7': 'Du hast 24/7 in einer Art verwendet, welches wahrscheinlich nicht als "24 Stunden, 7 Tage die Woche" interpretiert wird.'
                + ' Der Richtigkeit halber solltest du "open" oder "closed"'
                + ' für diese Regel verwenden und dann die Ausnahmen angeben um das selbe ziel zu erreichen. So ist es klarer -'
                + ' zum Beispiel "open; Mo 12:00-14:00 off".',
                'public holiday': 'Es wurde keine Regel für "PH" (feiertags) angegeben. Dies ist nicht sehr Aussagekräftig.__part2__'
                + ' Bitte füge die Regel "PH off" an, when die Einrichtung an allen Feiertagen geschlossen ist'
                + ' oder schreibe "Sa,Su,PH 12:00-16:00" um auszudrücken, dass Samstags, Sonntags und feiertags von 12:00-16:00 geöffnet ist.'
                + ' Wenn du dir im Unklaren bist, versuche die Öffnungszeit zu klären. Falls das nicht möglich ist, lass die Angabe weg und ignoriere diese Warnung.',
                'public holiday part2': ' Leider ist der "tag key" (beispielsweise "opening_hours", or "lit") in opening_hours.js nicht bekannt.'
                + 'Diese Warnung betrifft nur die Keys: __keys__.  Falls deine Angabe nicht für einen dieser ist, ignoriere bitte folgenden Hinweis:',
                'switched': 'Der Selektor "__first__" wurde für eine bessere Lesbarkeit und der Vollständigkeit halber mit '
                + ' "__second__" getauscht.',
                'no colon after': 'Bitte Benutze kein ":" nach dem Token __token__.',
                'number -5 to 5': 'Zahl zwischen -5 und 5 (außer 0) wartert',
                'one weekday constraint': 'You can not use more than one constrained weekday in a month range',
                'range contrainted weekdays': 'You can not use a range of constrained weekdays in a month range',
                'expected': '"__symbol__" expected.',
                'range zero': 'You can not use __type__ ranges with period equals zero.',
                'period one year+': 'Please don’t use __type__ ranges with period equals one.'
                + ' If you want to express that a facility is open starting from a year without limit use "<year>+".',
                'period one': 'Please don’t use __period_type__ ranges with period equals one.',
                'month 31': "The day for __month__ must be between 1 and 31.",
                'month 30': "Month __month__ doesn't have 31 days. The last day of __month__ is day 30.",
                'month feb': '"Month __month__ either has 28 or 29 days (leap years)."',
                'point in time': 'hyphen (-) or open end (+) in time range __calc__ expected.'
                + ' For working with points in time, the mode for __library_name__ has to be altered.'
                + ' Maybe wrong tag?',
                'calculation': 'calculation',
                'time range continue': 'Time range does not continue as expected',
                'period continue': 'Time period does not continue as expected. Example "/01:30".',
                'time range mode': '__library_name__ is running in "time range mode". Found point in time.',
                'point in time mode': '__library_name__ is running in "points in time mode". Found time range.',
                'outside current day': 'Time range starts outside of the current day',
                'two midnights': 'Time spanning more than two midnights not supported',
                'without minutes': 'Time range without minutes specified. Not very explicit!'
                + ' Please use this syntax instead "__syntax__".',
                'outside day': 'Time range starts outside of the current day',
                'zero calculation': 'Adding zero in a variable time calculation does not change the variable time.'
                + ' Please omit the calculation (example: "sunrise-(sunset-00:00)").',
                'calculation syntax': 'Calculation with variable time is not in the right syntax',
                'missing': 'Missing "__symbol__"',
                '(time)': '(time)',
                'bad range': 'Bad range: __from__-__to__',
                '] or more numbers': '"]" or more numbers expected.',
                'additional rule no sense': 'An additional rule does not make sense here. Just use a ";" as rule separator.'
                + ' See https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification#explain:additional_rule_separator',
                'unexpected token weekday range': 'Unexpected token in weekday range: __token__',
                'max differ': 'There should be no reason to differ more than __max_differ__ days from a __name__. If so tell us …',
                'adding 0': 'Adding 0 does not change the date. Please omit this.',
                'unexpected token holiday': 'Unexpected token (holiday parser): __token__',
                'no SH defintion': 'School holiday __name__ has no definition for the year __year__'
                + ' You can also add them: __repository_url__',
                'no PH definition': 'There are no holidays __name__ defined for country __cc__.'
                + ' You can also add them: __repository_url__',
                'no PH definition state': 'There are no holidays __name__ defined for country __cc__ and state __state__.'
                + ' You can also add them: __repository_url__',
                'no country code': 'Country code missing which is needed to select the correct holidays (see README how to provide it)',
                'movable no formular': 'Movable day __name__ can not not be calculated.'
                + ' Please add the formula how to calculate it.',
                'movable not in year': 'The movable day __name__ plus __days__'
                + ' days is not in the year of the movable day anymore. Currently not supported.',
                'year range one year': 'A year range in which the start year is equal to the end year does not make sense.'
                + ' Please remove the end year. E.g. "__year__ May 23"',
                'year range reverse': 'A year range in which the start year is greater than the end year does not make sense.'
                + ' Please turn it over.',
                'year past': 'The year is in the past.',
                'unexpected token year range': 'Unexpected token in year range: __token__',
                'week range reverse': 'You have specified a week range in reverse order or leaping over a year. This is (currently) not supported.',
                'week negative': 'You have specified a week date less then one. A valid week date range is 1-53.',
                'week exceed': 'You have specified a week date greater then 53. A valid week date range is 1-53.',
                'week period less than 2': 'You have specified a week period which is less than two.'
                + ' If you want to select the whole range from week __week_from__ to week __week_to__ then just omit the "/__period__".',
                'week period greater than 26': 'You have specified a week period which is greater than 26.'
                + ' 26.5 is the half of the maximum 53 week dates per year so a week date period greater than 26 would only apply once per year.'
                + ' Please specify the week selector as "week __week_from__" if that is what you want to express.',
                'unexpected token week range': 'Unexpected token in week range: __token__',
                'unexpected token month range': 'Unexpected token in month range: __token__',
                'day range reverse': 'Range in wrong order. From day is greater than to day.',
                'open end': 'Specified as open end. Closing time was guessed.',
                'date parameter needed': 'Date parameter needed.',
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
