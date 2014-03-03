#!/usr/bin/env python
# encoding: utf-8
# Quick and dirty abstraction layer. May use PyV8 or zerorpc in the future.

import subprocess, json, sys
from StringIO import StringIO

class OpeningHours:
    def __init__(self):
        """Setup the connection to opening_hours.js"""

        subprocess_param = ['node', '/home/rsadmin/Projekte/src/osm/opening_hours.js/interactive_testing.js']
        try:
            self._oh_interpreter = subprocess.Popen(
                    subprocess_param,
                    stdout=subprocess.PIPE,
                    stdin=subprocess.PIPE
                )
        except OSError:
            subprocess_param[0] = 'nodejs'
            try:
                self._oh_interpreter = subprocess.Popen(
                        subprocess_param,
                        stdout=subprocess.PIPE,
                        stdin=subprocess.PIPE
                    )
            except OSError:
                sys.stderr.write('You need to install nodejs.')
                sys.exit(1)

        self._oh_interpreter.stdout.readline()
        # read description (meant for humans) from interactive_testing.js
    def eval(self, value, nominatiomJSON=None, mode=None):
        query = {'value': value}
        print query
        self._oh_interpreter.stdin.write(value.encode('utf-8') + '\n')
        result_json = StringIO()
        while True:
            line = self._oh_interpreter.stdout.readline().rstrip()
            if line is not '}':
                result_json.write(line + '\n')
            else:
                result_json.write('}')
                break
        result_object = json.loads(result_json.getvalue())
        return result_object
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
