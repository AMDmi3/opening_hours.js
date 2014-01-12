#!/usr/bin/env python
# encoding: utf-8
"""Search over OSM opening_hours like values and see if they can be parsed."""

import sys
import json
import re
import codecs
from termcolor import colored
import signal
import subprocess
import urllib
import readline

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
    r'[^0-9a-z .]\s*?-\s*?\d{1,2}:\d{2}\s*?[^-+]',
    # Start time not specified (not in the syntax specification).
    # Opposite to open end.
    r'\d{1,2}:\d{2}\s*?-\s*?\d{1,2}:\d{2}\s*?\+', # 12:00-14:00+
    )

readline.parse_and_bind("tab: complete")
readline.set_completer(Completer(STD_REGEX).complete)

def signal_handler(signal, frame):
    """Called on SIGINT to exit gracefully."""

    print('\nBye')
    sys.exit(0)

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

def setup_oh_interpreter():
    """Setup the connection to opening_hours.js"""

    subprocess_param = ['node', 'interactive_testing.js', '--no-warnings']
    try:
        oh_interpreter = subprocess.Popen(
                subprocess_param,
                stdout=subprocess.PIPE,
                stdin=subprocess.PIPE
                )
    except OSError:
        subprocess_param[0] = 'nodejs'
        try:
            oh_interpreter = subprocess.Popen(
                    subprocess_param,
                    stdout=subprocess.PIPE,
                    stdin=subprocess.PIPE
                    )
        except OSError:
            sys.stderr.write('You need to install nodejs.')
            sys.exit(1)

    oh_interpreter.stdout.readline()
    # read description (meant for humans) from interactive_testing.js

    return oh_interpreter

def run_interpeter(oh_interpreter, taginfo_tag_export, key):
    """Start the interactive shell for the user."""

    overpass_turbo_url = 'http://overpass-turbo.eu/ \
            ?template=key-value&key=%s&value=' % key
    taginfo_url        = 'http://taginfo.openstreetmap.org/tags/%s=' % key
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
                    oh_interpreter.stdin.write(taginfo_hash['value'].encode("utf-8") + '\n')
                    oh_res = oh_interpreter.stdout.readline().strip()
                    oh_ok  = 0 if int(oh_res[0]) else 1
                    passed_diff_values += oh_ok
                    total_passed += oh_ok * taginfo_hash['count']

            if do_parse_all_values_before:
                passed_diff_values = ' (%d passed)' % passed_diff_values
                total_passed       = ' (%d passed)' % total_passed
            print('Matched %d%s different values%s%s'
                    % (len(matched), passed_diff_values,
                        ('' if len(matched) == 1 else 's'),
                        (', total in use: %d%s' % (total_in_use, total_passed) if len(matched) != 1 else '')
                    )
                )
            print_values = 'y'
            # if len(matched) > page_width:
            ## you may want to use the "taginfo" flag
            print_values = raw_input('Print values'
                    ' (passable answers: "yes" for all values, "passed"'
                    ' or "failed", additionally "show", "taginfo", "err")? ')

            if re.match(r'^(y|p|f)', print_values, re.I):
                printed_values = 1
                print_all    = re.match(r'y', print_values, re.I)
                print_passed = re.match(r'p', print_values, re.I)
                show_error_m = re.search(r'err', print_values, re.I)
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
                    oh_interpreter.stdin.write(taginfo_hash['value'].encode("utf-8") + '\n')
                    oh_res = oh_interpreter.stdout.readline().strip()
                    oh_ok  = False if oh_res[0] == '1' else True
                    oh_loc_needed = ', loc needed' if oh_res[2] == '1' else ''
                    # location (provided by nominatiom JSON)
                    oh_warnings   = ', warnings'   if oh_res[4] == '1' else ''
                    if oh_ok:
                        passed_failed = {
                                'open   '    : colored('Passed', 'green'),
                                'unknown' : colored('Passed', 'magenta'),
                                'closed '  : colored('Passed', 'blue'),
                            }[oh_res[6:13]]
                    else:
                        passed_failed = colored('Failed', 'red')
                        oh_loc_needed = ''
                        oh_warnings   = ''
                    if (print_all or (print_passed != None) == oh_ok):
                        show_url = ''
                        tag_url  = ''
                        if (re.search(r'show', print_values, re.I)):
                            show_url = 'show: %s%s' % (
                                    overpass_turbo_url,
                                    urllib.quote(taginfo_hash['value'])
                                    )
                        if (re.search(r'tag', print_values, re.I)):
                            tag_url = 'taginfo: %s%s' % (
                                    taginfo_url,
                                    urllib.quote(taginfo_hash['value'])
                                    )
                        print 'Matched (count: %d, status: %s%s%s): %s%s%s' % (
                                taginfo_hash['count'],
                                passed_failed, oh_loc_needed, oh_warnings,
                                res.group('pre'),
                                colored(res.group('match'), 'blue'),
                                res.group('post'))
                        if show_error_m and not oh_ok:
                            print '%s\n' % oh_res[2:]
                        if (show_url and tag_url):
                            print ', '.join([show_url, tag_url])
                        elif show_url:
                            print show_url
                        elif tag_url:
                            print tag_url
                        printed_values += 1
            else:
                continue

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

    oh_interpreter = setup_oh_interpreter()

    run_interpeter(oh_interpreter, taginfo_tag_export, key)

if __name__ == '__main__':
    main()
