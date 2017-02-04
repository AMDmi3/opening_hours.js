# holidays

## Deciding which holidays do apply

Because each country/culture has it‘s own important dates/events, holidays are defined on a country level. The country wide definition can be overwritten as needed by more specific definitions. Because this library works with the OSM ecosystem, those boundaries are based on OSM.

More specifically, the dataset on which a decision is made which holidays apply for a given location is based on the information returned from [Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim).

Consider this [Nominatim reverse geocoding][] query: https://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1&accept-language=de,en

which returned the following JSON object:

```JSON
{
  "place_id": "2614369044",
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
  "osm_type": "way",
  "osm_id": "416578669",
  "lat": "49.5438327",
  "lon": "9.8155867",
  "display_name": "K 2847, Lauda-Königshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-Württemberg, 97922, Deutschland",
  "address": {
    "road": "K 2847",
    "town": "Lauda-Königshofen",
    "county": "Main-Tauber-Kreis",
    "state_district": "Regierungsbezirk Stuttgart",
    "state": "Baden-Württemberg",
    "postcode": "97922",
    "country": "Deutschland",
    "country_code": "de"
  },
  "boundingbox": [
    "49.5401338",
    "49.5523393",
    "9.8003394",
    "9.8274515"
  ]
}
```

as of 2016-06-29.

For now it has been enough to make a decision based on the fields `address.country_code` and `address.state` and thus only those two levels are supported right now in the data format. But the other information is there when needed, just extend the data format and source code to make use of it.

Note that you will need to use exactly the same values that Nominatim returns in the holiday definition data format which is described next.
Also note that the data format is based on Nominatim results in local language so you will likely need to adjust the `accept-language` URL get parameter from the example.
Refer to [Nominatim/Country Codes](https://wiki.openstreetmap.org/wiki/Nominatim/Country_Codes) for the country codes to language code mapping used for this specification.

You can use http://www.openstreetmap.de/karte.html to get the coordinates for the regions you are defining holidays for. Just search the region and position the map view on that region. Then click on `Permalink` which will cause the URL in your address bar to include the latitude and longitude. Consider this example of a permalink:

http://www.openstreetmap.de/karte.html?zoom=14&lat=49.5487429714954&lon=9.81602098644987&layers=000BTF

You can now use the `&lat=49.5487429714954&lon=9.81602098644987` parameters and use them instead of the once in the example Nominatim query shown above. Note that you should include this Nominatim URL for each defined region using the `_nominatim_url` key (see below).
The `_nominatim_url` is indented to allow convenient testing of the holiday definitions.

You could also do a [Nominatim search][] directly using: https://nominatim.openstreetmap.org/search?format=json&country=Deutschland&state=Berlin&&zoom=18&addressdetails=1&limit=1&accept-language=de,en
and then do the [Nominatim reverse geocoding][] using the returned coordinates. But note that the `_nominatim_url` needs to be
a [Nominatim reverse geocoding][] query because of different attributes being returned.

## Holiday definition data format

Data format version `2.1.0`. The data format will probably need to be adopted to support more holiday definitions in the future.
The data format versioning complies with [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

Holidays for all countries are currently defined in the [opening_hours.js][ohlib.opening_hours.js] file in the variable `holiday_definitions`.

The `holiday_definitions` variable is a complex data structure. Lets take a look at an example:

```JavaScript
var holiday_definitions = {
    'pl': { /* {{{ */
        '_nominatim_url': 'https://nominatim.openstreetmap.org/reverse?format=json&lat=53.4825&lon=18.75823&zoom=18&addressdetails=1&accept-language=pl,en',
        // Somewhere in this country.
        'PH': {},
    }, /* }}} */
    'de': { /* {{{ */
        '_nominatim_url': 'https://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1&accept-language=de,en'
        // Somewhere in this country.
        'PH': {},
        'Baden-Württemberg': { // does only apply in Baden-Württemberg
            '_nominatim_url': 'https://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1&accept-language=de,en'
            // Somewhere in this state/region.

            // This more specific rule set overwrites the country wide one (they are just ignored).
            // You may use this instead of the country wide with some
            // additional holidays for some states, if one state
            // totally disagrees about how to do holidays …
            // 'PH': {
            //     '2. Weihnachtstag'          : [ 12, 26 ],
            // },

            // school holiday normally variate between states
            'SH': [],
        },
    }, /* }}} */
};
```

As you can see, our example contains `holiday_definitions` for the countries Poland and Germany. The dictionary keys of `holiday_definitions` correspond to the value of `address.country_code`. The dictionary of the country now either consists of `PH`, `SH` or the value of `address.state` (under the assumption that `address.state` will never be equal to `PH` or `SH`, probably a poor assumption, will need to be changed). When `PH` or `SH` is defined at this level it applies country wide. Those country wide definitions can be overwritten for a `address.state` by creating a additional dictionary with the name set to `address.state` and define `PH` or `SH` accordingly.

### Holiday definition data format: PH

Now lets look at the public holiday (`PH`) definition in more detail. Each `PH` definition consists of a dictionary with holiday name as key and date definition as values (specifying one day).
Holiday names should be in the local language. A date definition either consists of two integers representing month and day or the name of a movable event and the offset to that event. The movable events and the formulas for calculating them for a given year are defined in the `getMovableEventsForYear` function.

```JavaScript
{
    'pl': { /* {{{ */
        '_nominatim_url': 'https://nominatim.openstreetmap.org/reverse?format=json&lat=53.4825&lon=18.75823&zoom=18&addressdetails=1&accept-language=pl,en',
        'PH': { // https://pl.wikipedia.org/wiki/Dni_wolne_od_pracy_w_Polsce
            "Nowy Rok"                                      : [ 1, 1 ],
            "Święto Trzech Króli"                           : [ 1, 6 ],
            "Wielkanoc"                                     : [ 'easter', 0 ],
            "Lany Poniedziałek - drugi dzień Wielkiej Nocy" : [ 'easter', 1 ],
            "Pierwszy Maja"                                 : [ 5, 1 ],
            "Trzeci Maja"                                   : [ 5, 3 ],
            "Zielone Świątki"                               : [ 'easter', 49 ],
            "Boże Ciało"                                    : [ 'easter', 60 ],
            "Wniebowzięcie Najświętszej Maryi Panny"        : [ 8, 15 ],
            "Wszystkich Świętych"                           : [ 11, 1 ],
            "Święto Niepodległości"                         : [ 11, 11 ],
            "pierwszy dzień Bożego Narodzenia"              : [ 12, 25 ],
            "drugi dzień Bożego Narodzenia"                 : [ 12, 26 ],
        }
    }, /* }}} */
    'de': { /* {{{ */
        '_nominatim_url': 'https://nominatim.openstreetmap.org/reverse?format=json&lat=49.5487429714954&lon=9.81602098644987&zoom=18&addressdetails=1&accept-language=de,en',
        'PH': { // https://de.wikipedia.org/wiki/Feiertage_in_Deutschland
            'Neujahrstag'               : [  1,  1 ], // month 1, day 1, whole Germany
            'Heilige Drei Könige'       : [  1,  6, [ 'Baden-Württemberg', 'Bayern', 'Sachsen-Anhalt'] ], // only in the specified states
            'Tag der Arbeit'            : [  5,  1 ], // whole Germany
            'Karfreitag'                : [ 'easter', -2 ], // two days before easter
            'Ostersonntag'              : [ 'easter',  0, [ 'Brandenburg'] ],
            'Ostermontag'               : [ 'easter',  1 ],
            'Christi Himmelfahrt'       : [ 'easter', 39 ],
            'Pfingstsonntag'            : [ 'easter', 49, [ 'Brandenburg'] ],
            'Pfingstmontag'             : [ 'easter', 50 ],
            'Fronleichnam'              : [ 'easter', 60, [ 'Baden-Württemberg', 'Bayern', 'Hessen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland' ] ],
            'Mariä Himmelfahrt'         : [  8, 15, [ 'Saarland'] ],
            'Tag der Deutschen Einheit' : [ 10,  3 ],
            'Reformationstag'           : [ 10, 31, [ 'Brandenburg', 'Mecklenburg-Vorpommern', 'Sachsen', 'Sachsen-Anhalt', 'Thüringen'] ],
            'Allerheiligen'             : [ 11,  1, [ 'Baden-Württemberg', 'Bayern', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland' ] ],
            '1. Weihnachtstag'          : [ 12, 25 ],
            '2. Weihnachtstag'          : [ 12, 26 ],
            // 'Silvester'              : [ 12, 31 ], // for testing
        },
    }, /* }}} */
};
```

Note that the array of date definitions can hold an optional array of `address.state` strings. When this list is present, the holiday is only applied when `address.state` is contained in that array of strings.

### Holiday definition data format: SH

School holiday (`SH`) definitions look a little bit different. This is because school holidays usually spans multiple days and because `SH` are different for each year/can not be mathematically calculated (at least the countries that @ypid has seen so far).
This is not very nice, but as we are hackers, we can just grab this data and convert it into the data format documented here. This is what @ypid has been doing for all states in Germany using the [convert_ical_to_json][ohlib.convert-ical-to-json] script.

Now to the data format. It consists of an array of dictionaries. Each dictionary defines one school holiday. The `name` key defines the name of the school holiday, again preferably in local language. The integer keys define the year.
The time range definition is an array consisting of a multiple of 4 integers.

Meaning of the integers:

1 and 2: Month and day of the first day of the school holiday.

3 and 4: Month and day of the last day of the school holiday.

Multiple time ranges can be defined.

```JavaScript
{
    'SH': [ // generated by convert_ical_to_json
            // You may can adjust this script to use other resources (for other countries) too.
        {
            name: 'Osterferien',
            2015: [  3, 30, /* to */  4, 10 ],
            2016: [  3, 29, /* to */  4,  2 ],
            2017: [  4, 10, /* to */  4, 21 ],
        },
        {
            name: 'Pfingstferien',
            2015: [  5, 26, /* to */  6,  6 ],
            2016: [  5, 17, /* to */  5, 28 ],
            2017: [  6,  6, /* to */  6, 16 ],
        },
        {
            name: 'Sommerferien',
            2015: [  7, 30, /* to */  9, 12 ],
            2016: [  7, 28, /* to */  9, 10 ],
            2017: [  7, 27, /* to */  9,  9 ],
        },
        {
            name: 'Herbstferien',
            /* One SH can also span multiple separate ranges like in this case: */
            2011: [ 10, 31, /* to */ 10, 31,  11,  2, /* to */ 11,  4 ],
            2015: [ 11,  2, /* to */ 11,  6 ],
            2016: [ 11,  2, /* to */ 11,  4 ],
        },
        {
            name: 'Weihnachtsferien',
            2015: [ 12, 23, /* to */  1,  9 ],
            2016: [ 12, 23, /* to */  1,  7 ],
        },
    ],
}
```

### Hints

* Note that you should include the definitions in order (see [#126](https://github.com/opening-hours/opening_hours.js/issues/126#issuecomment-156853794) for details).
* Please also add the source for this information (in form of an URL) as comment. Like shown in the examples above. Usually Wikipedia in the local language is a great source.

[ohlib.opening_hours.js]: /opening_hours.js
[ohlib.convert-ical-to-json]: /convert_ical_to_json
[Nominatim search]: https://wiki.openstreetmap.org/wiki/Nominatim#Search
[Nominatim reverse geocoding]: https://wiki.openstreetmap.org/wiki/Nominatim#Reverse_Geocoding
