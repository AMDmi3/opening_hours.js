#!/usr/bin/env python
# encoding: utf-8
# Quick and dirty abstraction layer for the JavaScript library opening_hours.js. May use PyV8 or zerorpc in the future.

from osm_time import ParseException

import subprocess, json, sys
import dateutil.parser
from StringIO import StringIO

class OpeningHours:

    __subprocess_param = ['node', '/home/rsadmin/Projekte/src/osm/opening_hours.js/interactive_testing.js']
    try:
        _oh_interpreter = subprocess.Popen(
                __subprocess_param,
                stdout=subprocess.PIPE,
                stdin=subprocess.PIPE
            )
    except OSError:
        subprocess_param[0] = 'nodejs'
        _oh_interpreter = subprocess.Popen(
                __subprocess_param,
                stdout=subprocess.PIPE,
                stdin=subprocess.PIPE
            )

    _oh_interpreter.stdout.readline()

    def __init__(self, value, nominatiomJSON=None, mode=None):
        """Constructs opening_hours object, given the opening_hours tag value."""
        # read description (meant for humans) from interactive_testing.js

        query = {'value': value}
        # print query
        self._oh_interpreter.stdin.write(value + '\n')
        result_json = StringIO()
        while True:
            line = self._oh_interpreter.stdout.readline().rstrip()
            if line is not '}':
                result_json.write(line + '\n')
            else:
                result_json.write('}')
                break
        self._result_object = json.loads(result_json.getvalue())

        if self._result_object['error']:
            raise ParseException(value, self._result_object['eval_notes'])

    def getWarnings(self, *args):
        """Get parse warnings as list. Each warning is one string item in the
        list. Returns an empty list if there are no warnings."""
        return self._result_object['eval_notes']

    def prettifyValue(self, *args):
        """Get a nicely formated value."""
        return self._result_object['prettified']

    def getState(self, *args):
        """Check whether facility is `open' on the given date (or now)."""
        return self._result_object['state']

    def getUnknown(self, *args):
        """If the state of a amenity is conditional. Conditions can be
        expressed in comments.  True will only be returned if the state is
        false as the getState only returns true if the amenity is really open.
        So you may want to check the result of getUnknown if getState returned
        false."""
        return self._result_object['unknown']

    def getStateString(self, *args):
        """Return state string. Either 'open', 'unknown' or 'closed'."""
        return self._result_object['state_string']

    def getComment(self, *args):
        """Returns the comment."""
        try:
            return self._result_object['comment']
        except KeyError:
            return None

    def getNextChange(self, *args):
        """returns time of next status change"""
        try:
            return dateutil.parser.parse(self._result_object['next_change'])
        except KeyError:
            return None

    def isWeekStable(self, *args):
        """Checks whether open intervals are same for every week."""
        return self._result_object['week_stable']

    def _neededNominatiomJson(self, *args):
        """Test if nominatiomJSON was *mandatory* to evaluate the value. For <variable_times> FIXME it is not mandatory."""
        return self._result_object['needed_nominatiom_json']

    def _getAll(self, *args):
        """Debugging: Get full result object as returned by interactive_testing.js"""
        return self._result_object

# }}}

# main {{{
def test():
    """Run tests."""

    oh_interpreter = OpeningHours()
    print oh_interpreter.eval('open')
    print 'test'
    print oh_interpreter.eval('closed')
    print oh_interpreter.eval('fail')


if __name__ == '__main__':
    test()
# }}}
