#!/usr/bin/env python
# encoding: utf-8
"""Search over OSM opening_hours like values and see if they can be parsed."""

# modules {{{
import sys
import json
import re
import codecs
from termcolor import colored
import signal
import subprocess
import urllib
import readline
sys.path.append('pyopening_hours/')
from osm_time.OpeningHours import OpeningHours, ParseException
# }}}

# interpreter input history and predefined regexs {{{
HISTFILE = '/tmp/opening_hours.regex.history'
try:
    readline.read_history_file(HISTFILE)
except IOError:
    pass
import atexit
atexit.register(readline.write_history_file, HISTFILE)

class Completer:
    """Completer for tab completion."""
    def __init__(self, words):
        self.words = words
        self.prefix = None
    def complete(self, prefix, index):
        if prefix != self.prefix:
            # we have a new prefix!
            # find all words that start with this prefix
            self.matching_words = [
                w for w in self.words if w.startswith(prefix)
                ]
            self.prefix = prefix
        try:
            return self.matching_words[index]
        except IndexError:
            return None

# a set of more or less interesting words
STD_REGEX = ('PH', 'SH', '.',
    r'\((?:dusk|sun|dawn)[^)]*(?:-|\+)[^)]*\)',
    r'(?:dusk|sun|dawn).*hours',
    r'(?:dusk|sun|dawn|\d{1,2}[.:]\d{2})\+',
    r'\d\s*-\s*(mo|tu|we|th|fr|sa|su)\\b',
    r'-\s*\d{1,2}[:.]\d{2}\s*?\+',
    r'[^0-9a-z ?.]\s*?-\s*?\d{1,2}:\d{2}\s*?[^+]',
    # Start time not specified (not in the syntax specification).
    # Opposite to open end.
    # http://wiki.openstreetmap.org/wiki/Proposed_features/opening_hours_open_until#Notes
    #
    r'\d{1,2}:\d{2}\s*?-\s*?\d{1,2}:\d{2}\s*?\+', # 12:00-14:00+
    # http://wiki.openstreetmap.org/wiki/Proposed_features/opening_hours_open_end_fixed_time_extension#Summary
    #
    r'^(?:(?:[0-1][0-9]|2[0-4])(?:[1-5][0-9]|0[0-9])\s*-?\s*){2}$', # match 1700-2300
    )

readline.parse_and_bind("tab: complete")
readline.set_completer(Completer(STD_REGEX).complete)
# }}}

# helper functions {{{
# signal handler {{{
def signal_handler(signal, frame):
    """Called on SIGINT to exit gracefully."""

    print '\nBye'
    sys.exit(0)
# }}}

# url encode {{{
def url_encode(url):
    return urllib.quote(url.encode('utf-8'), safe='~()*!.\'')
# }}}
# }}}

# load and decode JSON {{{
def load_json_file(json_file):
    """Load JSON file and return it as python dictionary."""

    try:
        json_data = codecs.open(json_file, 'r', 'utf-8')
    except IOError as detail:
        sys.stderr.write('File '+ json_file +' is not readable: '+ detail[1])
        sys.exit(1)

    decoded_json = json.load(json_data)
    json_data.close()
    return decoded_json
# }}}

# run interpreter {{{
def run_interpreter(taginfo_tag_export, key, do_not_load_values_again):
    """Start the interactive shell for the user."""

    overpass_turbo_url = 'http://overpass-turbo.eu/' \
            + '?template=key-value&key=%s&value=' % key
    taginfo_url = 'http://taginfo.openstreetmap.org/tags/%s=' % key
    josm_remote_url = 'http://localhost:8111/import?url=%s' % (
            url_encode(u'http://overpass-api.de/api/xapi_meta?*[opening_hours=')
        )
    page_width = 20
    while True:
        regex = raw_input('regex search> ')
        if re.match(r'\s*\Z', regex):
            print('Bye')
            break

        try:
            user_reg = re.compile('(?P<pre>.*?)(?P<match>'+regex+')(?P<post>.*)',
                    re.IGNORECASE)
        except re.error, err:
            print('Your regular expression did not compile: %s' % err)
            continue

        matched = []
        for taginfo_hash in taginfo_tag_export['data']:
            taginfo_hash['value'] = taginfo_hash['value'].replace('\n', '*newline*')
            # newline would destroy the order (communication with node process)

            res = user_reg.match(taginfo_hash['value'])
            if res:
                matched.append([taginfo_hash, res])

        if len(matched) == 0:
            print('Did not match any value with regular expression: %s' % regex)
        else:
            matched = sorted(matched, key=lambda k: k[0]['count'], reverse=True)
            do_parse_all_values_before = True
            if (len(matched) > 10000
                    and not re.match(r'^y', raw_input('Try to parse each value (probably takes a second)? '), re.I)):
                do_parse_all_values_before = False
            total_in_use = 0
            passed_diff_values = 0
            total_passed = 0
            for taginfo_hash, res in matched:
                total_in_use += taginfo_hash['count']
                if do_parse_all_values_before:
                    try:
                        oh_result = OpeningHours(taginfo_hash['value'].encode('utf-8'))
                    except ParseException as e:
                        continue
                    passed_diff_values += 1
                    total_passed += taginfo_hash['count']

            if do_parse_all_values_before:
                passed_diff_values = ' (%d passed)' % passed_diff_values
                total_passed       = ' (%d passed)' % total_passed
            print('Matched %d%s different values%s%s' % (
                        len(matched), passed_diff_values,
                        ('' if len(matched) == 1 else 's'),
                        (', total in use: %d%s' % (total_in_use, total_passed) if len(matched) != 1 else '')
                    )
                )
            print_values = 'y'
            # if len(matched) > page_width:
            ## you may want to use the "taginfo" flag
            print_values = raw_input('Print values'
                    ' (passable answers: "yes" for all values, "passed"'
                    ' or "failed", additionally "overpass", "taginfo", "err", "josm", "no_repeat")? ')

            if re.match(r'(y|p|f)', print_values, re.I):
                printed_values = 1
                print_all    = re.match(r'\s*y',      print_values, re.I)
                print_passed = re.match(r'\s*p',      print_values, re.I)
                show_error_m = re.search(r'\berr',    print_values, re.I)
                josm_load    = re.search(r'\bjosm\b', print_values, re.I)
                josm_load_not_repeat = re.search(r'\bno_repeat\b', print_values, re.I)
                if show_error_m:
                    page_width /= 2
                for taginfo_hash, res in matched:
                    if printed_values % page_width == 0:
                        printed_values += 1
                        # If nothing is printed in this iteration, the question
                        # would pop up again. printed_values does already not
                        # match the real printed lines so how cares …
                        if not re.match(r'^(y.*|)$', raw_input('Continue? '), re.I):
                            break
                    oh_ok = True
                    try:
                        oh_result = OpeningHours(taginfo_hash['value'].encode('utf-8'))
                    except ParseException as e:
                        oh_ok = False
                        continue
                    oh_loc_needed = ', loc needed' if oh_result._neededNominatiomJson() else ''
                    oh_warnings   = ', warnings'   if oh_result.getWarnings() else ''
                    if oh_ok:
                        passed_failed = {
                                'open'    : colored('Passed', 'green'),
                                'unknown' : colored('Passed', 'magenta'),
                                'close'  : colored('Passed', 'blue'),
                            }[oh_result.getStateString()]
                    else                  :
                        passed_failed = colored('Failed', 'red')
                        oh_loc_needed = ''
                        oh_warnings   = ''
                    if print_all or (print_passed != None) == oh_ok:
                        overpass_url = ''
                        tag_url  = ''
                        if re.search(r'\bover(pass)?\b', print_values, re.I):
                            overpass_url = 'overpass: %s%s' % (
                                    overpass_turbo_url,
                                    url_encode(taginfo_hash['value'])
                                )
                        if re.search(r'tag', print_values, re.I):
                            tag_url = 'taginfo: %s%s' % (
                                    taginfo_url,
                                    url_encode(taginfo_hash['value'])
                                )
                        print 'Matched (count: %d, status: %s%s%s): %s%s%s' % (
                                taginfo_hash['count'],
                                passed_failed, oh_loc_needed, oh_warnings,
                                res.group('pre'),
                                colored(res.group('match'), 'blue'),
                                res.group('post')
                            )
                        if show_error_m and not oh_ok:
                            print '%s\n' % oh_res[2:]
                        if overpass_url and tag_url:
                            print ', '.join([overpass_url, tag_url])
                        elif overpass_url:
                            print overpass_url
                        elif tag_url:
                            print tag_url
                        if josm_load:
                            # if taginfo_hash['value'] not in do_not_load_values_again:
                            if (josm_load_not_repeat and taginfo_hash['value'] not in do_not_load_values_again) or josm_load_not_repeat != True:
                                if josm_load_not_repeat:
                                    do_not_load_values_again.append(taginfo_hash['value'])
                                josm_remote_url_for_value = '%s%s' % (josm_remote_url, url_encode('%s%s' % (taginfo_hash['value'], u']')))
                                try:
                                    josm_return = urllib.urlopen(josm_remote_url_for_value)
                                    if josm_return.getcode() != 200:
                                        sys.stderr.write('JOSM Remote HTTP request resulted in status code %d' % josm_return.getcode())
                                except:
                                    sys.stderr.write('Connection to JOSM could not be established.'
                                            + ' Please start JOSM and enable remote control.\n')
                                # print do_not_load_values_again
                        printed_values += 1
            else:
                continue
# }}}

# main {{{
def main():
    """Run as command line program."""

    signal.signal(signal.SIGINT, signal_handler)

    json_file = 'export.opening_hours.json'
    if len(sys.argv) > 1:
        json_file = sys.argv[1]

    key = ''
    try:
        key  = re.match(r'\Aexport\.(.*)\.json', json_file).group(1)
    except:
        sys.stderr.write('Did not match the key, URL will not work')

    taginfo_tag_export = load_json_file(json_file)
    print 'Loaded %s.' % json_file

    with open('testing', 'r') as f:
        do_not_load_values_again = [line.rstrip('\n').decode('utf-8') for line in f]

    run_interpreter(taginfo_tag_export, key, do_not_load_values_again)

    with open('testing', 'w') as f:
        for s in do_not_load_values_again:
            f.write(s.decode('utf-8') + '\n')

if __name__ == '__main__':
    main()
# }}}
