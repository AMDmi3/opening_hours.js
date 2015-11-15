if (typeof require === 'function' && module) {
    var i18n = require('i18next-client');
    module.exports = i18n;
}

var opening_hours_resources = { // English is fallback language.
    en: { /* {{{ */
        opening_hours: {
            // Dear Translator,
            // the original English texts are bundled with the lib, search for "var lang =" in opening_hours.js
            "pretty": {
                "off": "closed",
                "SH": "school holidays",
                "PH": 'public holidays',
            },
        },
    }, /* }}} */
    de: { /* {{{ */
        opening_hours: {
            "texts": {
                'unexpected token': 'Unerwartetes Zeichen: "__token__" Das bedeutet, dass die Syntax an dieser Stelle nicht erkannt werden konnte.',
                'no string': 'Der Wert (erster Parameter) ist kein String',
                'nothing': 'Der Wert enthält nichts, was ausgewertet werden könnte.',
                'nothing useful': 'Diese Regel enthält nichts nützliches. Bitte entferne diese leere Regel.',
                'programmers joke': 'Kann es sein, dass du ein Programmierer bist und das Hinzufügen eines Semikolons nach jedem Statement ist zwanghaft ;) ?'
                    + ' Es ist so, dass das Semikolon in der opening_hours Syntax als Trenner für Regeln definiert ist.'
                    + ' Bitte verzichte an dieser Stelle auf ein Semikolon.',
                'interpreted as year': 'Die Zahl __number__ wird als Jahr interpretiert.'
                    + ' Vermutlich ist das nicht beabsichtigt. Uhrzeiten werden als "12:00" angegeben.',
                'rule before fallback empty': 'Die Regel vor der Fallback-Regel enthält nichts nützliches',
                'hour min separator': 'Bitte benutze ":" als Stunden/Minuten Trenner',
                'warnings severity': 'Der Parameter optional_conf_parm["warnings_severity"] muss eine ganze Zahl zwischen (einschließlich) 0 und (einschließlich) 7 sein.'
                    + ' Gegeben: __severity__ '
                    + ', erwartet: Eine der Zahlen: __allowed__.',
                'optional conf parm type': 'Der optional_conf_parm Parameter hat einen unbekannten Typ.'
                    + ' Gegeben: __given__',
                'conf param tag key missing': 'Der optional_conf_parm["tag_key"] fehlt, ist aber notwendig wegen optional_conf_parm["map_value"].',
                'conf param mode invalid': 'Der optional_conf_parm["mode"] Parameter ist eine ungültige Zahl.'
                    + ' Gegeben: __given__'
                    + ', erwartet: Eine der Zahlen: __allowed__.',
                'conf param unkown type': 'Der optional_conf_parm["__key__"] Parameter hat einen unbekannten Typ.'
                    + ' Gegeben: __given__, erwartet: __expected__.',
                'library bug': 'Bei der Auswertung des Wertes "__value__" ist ein Fehler aufgetreten.'
                    + ' Bitte melde diesen Fehler oder korrigiere diesen mittels eines Pull Requests oder Patches: __url__.__message__',
                'library bug PR only': 'Bei der Auswertung des Wertes "__value__" ist ein Fehler aufgetreten.'
                    + ' Du kannst dies korrigieren, indem du das Problem löst und in Form eines Pull Requests oder Patches zum Projekt beiträgst: __url__.__message__',
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
                    + " Es kann legitim sein, den Standard Status z.B. auf geöffnet festzulegen"
                    + " und dann nur die Zeiten, zu denen geschlossen ist, anzugeben.",
                'vague': "Diese Regel ist nicht sehr aussagekräftig, da keine Zeit angegeben wurde."
                    + " Bitte füge eine Zeitangabe oder einen Kommentar hinzu, um dies zu verbessern.",
                'empty comment': "Du hast einen leeren Kommentar verwendet."
                    + '" Bitte schreibe entweder einen Kommentar-Text oder benutze stattdessen das Schlüsselwort "unknown".',
                'separator_for_readability': "Du hast das optionale Symbol <separator_for_readability> an der falschen Stelle benutzt."
                    + " Bitte lies die Syntax Spezifikation um zu sehen wo es verwendet werden kann oder entferne es.",
                'strange 24/7': 'Du hast 24/7 in einer Art verwendet, welche wahrscheinlich nicht als "24 Stunden, 7 Tage die Woche" interpretiert wird.'
                    + ' Der Richtigkeit halber solltest du "open" oder "closed"'
                    + ' für diese Regel verwenden und dann die Ausnahmen angeben um das selbe Ziel zu erreichen. So ist es klarer –'
                    + ' zum Beispiel "open; Mo 12:00-14:00 off".',
                'public holiday': 'Es wurde keine Regel für "PH" (feiertags) angegeben. Dies ist nicht sehr Aussagekräftig.__part2__'
                    + ' Bitte füge die Regel "PH off" an, wenn die Einrichtung an allen Feiertagen geschlossen ist'
                    + ' oder schreibe "Sa,Su,PH 12:00-16:00" um auszudrücken, dass Samstags, Sonntags und feiertags von 12:00-16:00 geöffnet ist.'
                    + ' Falls die Einrichtung täglich und an Feiertagen geöffnet ist, kann dies explizit mittels "Mo-Su,PH" ausgedrückt werden.'
                    + ' Wenn du dir im Unklaren bist, versuche die Öffnungszeit zu klären. Falls das nicht möglich ist, lass die Angabe weg und ignoriere diese Warnung.',
                'public holiday part2': ' Leider ist der "tag key" (beispielsweise "opening_hours", or "lit") in opening_hours.js nicht bekannt.'
                    + ' Diese Warnung betrifft nur die Keys: __keys__. Falls deine Angabe nicht für einen dieser ist, ignoriere bitte folgenden Hinweis:',
                'switched': 'Der Selektor "__first__" wurde für eine bessere Lesbarkeit und der Vollständigkeit halber mit '
                    + ' "__second__" getauscht.',
                'no colon after': 'Bitte Benutze kein ":" nach dem Token __token__.',
                'number -5 to 5': 'Zahl zwischen -5 und 5 (außer 0) erwartet.',
                'one weekday constraint': 'Du kannst höchstens einen beschränkten Wochentag in einer Monats-Spanne verwenden',
                'range constrained weekdays': 'Du kannst keine Wochentags-Spanne als Beschränkung in einer Monats-Spanne verwenden',
                'expected': '"__symbol__" erwartet.',
                'range zero': 'Du kannst keine __type__-Spanne mit Periode "0" verwenden.',
                'period one year+': 'Bitte verwende keine __type__-Spannen mit Periode "1".'
                    + ' Wenn du ausdrücken willst, das eine Einrichtung ab einem bestimmten Jahr immer offen ist, benutze bitte "<year>+".',
                'period one': 'Bitte verwende keine __type__-Spannen mit Periode "1".',
                'month 31': "Die Tagangabe für __month__ muss zwischen 1 und 31 liegen.",
                'month 30': "Der Monat __month__ hat keine 31 Tage. Der letzte Tag von __month__ ist Tag 30.",
                'month feb': '"Der Monat __month__ hat entweder 28 oder 29 Tage (Schaltjahre)."',
                'point in time': 'Erwarte Bindestrich (-) oder offenes Ende (+) in der Zeitspanne __calc__.'
                    + ' Um mit Zeitpunkten zu arbeiten, muss der Modus für  __libraryname__ umgestellt werden.'
                    + ' Vielleicht falscher OSM tag verwendet?',
                'calculation': 'Berechnung',
                'time range continue': 'Die Zeitspanne geht nicht wie erwartet weiter',
                'period continue': 'Die Zeitspannen-Periode geht nicht wie erwartet weiter. Beispiel "/01:30".',
                'time range mode': '__libraryname__ wurde im "Zeitspannen-Modus" aufgerufen. Zeitpunkt gefunden.',
                'point in time mode': '__libraryname__ wurde im "Zeitpunkt-Modus" aufgerufen. Zeitspanne gefunden.',
                'outside current day': 'Zeitspanne beginnt außerhalb des aktuellen Tages',
                'two midnights': 'Zeitspanne welche mehrmals Mitternacht beinhaltet wird nicht unterstützt',
                'without minutes': 'Zeitspanne ohne Minutenangabe angegeben. Das ist nicht sehr eindeutig!'
                    + ' Bitte verwende stattdessen folgende Syntax "__syntax__".',
                'outside day': 'Die Zeitspanne beginnt außerhalb des aktuellen Tages',
                'zero calculation': 'Das Hinzufügen von 0 in einer variablen Zeitberechnung ändert die variable Zeit nicht.'
                    + ' Bitte entferne die Zeitberechnung (Beispiel: "sunrise-(sunset-00:00)").',
                'calculation syntax': 'Berechnung mit variabler Zeit hat nicht die korrekte Syntax',
                'missing': 'Fehlendes "__symbol__"',
                '(time)': '(Zeit)',
                'bad range': 'Ungültige Zeitspanne: __from__-__to__',
                '] or more numbers': '"]" oder weitere Zahlen erwartet.',
                'additional rule no sense': 'Eine weitere Regel an dieser Stelle ergibt keinen Sinn. Benutze einfach ";" als Trenner für Regeln.'
                    + ' Siehe https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification#explain:additional_rule_separator',
                'unexpected token weekday range': 'Unerwartes Token in Tages-Spanne: __token__',
                'max differ': 'Es sollte keinen Grund geben, mehr als __maxdiffer__ Tage von einem __name__ abzuweichen. Wenn nötig, teile uns dies bitte mit …',
                'adding 0': 'Addition von 0 verändert das Datum nicht. Bitte weglassen.',
                'unexpected token holiday': 'Unerwartet Token (in Feiertags-Auswertung): __token__',
                'no holiday defintion': '__name__ ist für das Land __cc__ nicht definiert.',
                'no holiday defintion state': '__name__ ist für das Land __cc__ und Bundesland __state__ nicht definiert.',
                'no country code': 'Der Ländercode fehlt. Dieser wird benötigt um die korrekten Feiertage zu bestimmen (siehe in der README wie dieser anzugeben ist)',
                'movable no formular': 'Der bewegliche Feiertag __name__ kann nicht berechnet werden.'
                    + ' Bitte füge eine entsprechende Formel hinzu.',
                'movable not in year': 'Der bewegliche Feiertag __name__ plus __days__'
                    + ' Tage befindet sich nicht mehr im selben Jahr. Aktuell nicht unterstützt.',
                'year range one year': 'Eine Jahres-Spanne mit gleichem Jahr als Beginn und Ende ergibt keinen Sinn.'
                    + ' Bitte entferne das Ende-Jahr. zum Beispiel: "__year__ May 23"',
                'year range reverse': 'Eine Jahres-Spanne mit Beginn größer als Ende ergibt keinen Sinn.'
                    + ' Bitte umdrehen.',
                'year past': 'Das Jahr liegt in der Vergangenheit.',
                'unexpected token year range': 'Unerwartetes Token in der Jahres-Spanne: __token__',
                'week range reverse': 'Du hast eine Wochen-Spanne in umgekehrter Reihenfolge oder mehrere Jahr umfassende angegeben. Dies ist aktuell nicht unterstützt.',
                'week negative': 'Du hast eine Kalenderwoche kleiner 1 angegeben. Korrekte Angaben sind 1-53.',
                'week exceed': 'Du hast eine Kalenderwoche größer als 53 angegeben. Korrekte Angaben sind 1-53.',
                'week period less than 2': 'Du hast eine Wochenperiode kleiner 2 angegeben.'
                    + ' Wenn du die gesamte Spanne von __weekfrom__ bis __weekto__ angeben will, lasse "/__period__" einfach weg.',
                'week period greater than 26': 'Du hast eine Wochen-Periode größer als 26 angegeben.'
                    + ' 26.5 ist die Hälfte des Maximums von 53 Wochen pro Jahr. Damit würde eine Periode größer als 26 nur einmal pro Jahr auftreten.'
                + ' Bitte gibt den Wochen-Selektor als "week __weekfrom__" an, wenn es das ist, was du ausdrücken möchtest.',
                'unexpected token week range': 'Unerwartetes Token in Wochen-Spanne: __token__',
                'unexpected token month range': 'Unerwartetes Token in Monats-Spanne: __token__',
                'day range reverse': 'Zeitspanne in falscher Reihenfolge. Begin ist größer als Ende.',
                'open end': 'Angegeben als "open end". Schließzeit wurde geraten.',
                'date parameter needed': 'Datumsparameter nötig.',
            },
            "pretty": {
                "off": "geschlossen",
                "SH": "Schulferien",
                "PH": "Feiertags",
            },
        },
    }, /* }}} */
};

if (!i18n.isInitialized()) {
    i18n.init({
        fallbackLng: 'en',
        // lngWhitelist: ['en', 'de'],
        resStore: opening_hours_resources,
        getAsync: true,
        useCookie: true,
        // debug: true,
    });
} else {
    // compat with an app that already initializes i18n
    for (lang in opening_hours_resources) {
        i18n.addResourceBundle(lang, 'opening_hours', opening_hours_resources[lang]['opening_hours'], true);

    }
}
