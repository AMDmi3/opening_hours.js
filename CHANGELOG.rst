Changelog
=========

All notable changes to opening_hours.js will be documented in this file.

This project adheres to `Semantic Versioning <http://semver.org/spec/v2.0.0.html>`__
and `human-readable changelog <http://keepachangelog.com/en/0.3.0/>`__.

Note that most of the v2.X.Z releases have not been added to the changelog yet.


master_ - unreleased
--------------------

.. _master: https://github.com/opening-hours/opening_hours.js/compare/v3.4.0...master

`v3.5.0 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.5.0+is%3Aclosed>`__

Added
~~~~~

* Public holiday definitions added: Brazil, Sweden, Poland, Czech, Hungary
* School holiday definitions added: Hungary
* Changelog file.
* Holidays definition documentation 2.1.0.
* AMD with RequireJS.

Changed
~~~~~~~

* Make the evaluation tool prettier.
* Use ``peerDependencies`` to allow dependency reuse by other npm packages.
* Use caret ranges for all npm dependencies.

Fixed
~~~~~

* Fix timezone problem in ``PH_SH_exporter.js`` (local time was interpreted as UTC).
* Fix handling of legacy 12-hour clock format. ``12:xxAM`` and ``12:xxPM`` was handled incorrectly!
* Fix the `getDateOfWeekdayInDateRange` helper function used to calculate PH of
  Sweden and Germany Saxony. PH definitions using this functions might have
  been wrong before.
* Add missing "Buß- und Bettag" to the public holiday definition of Saxony Germany.


v3.4.0_ - 2016-01-02
--------------------

.. _v3.4.0: https://github.com/opening-hours/opening_hours.js/compare/v3.3.0...v3.4.0

`v3.4.0 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.4.0+is%3Aclosed>`__

Added
~~~~~

* Public holiday definitions added: Danish, Belgium, Romania and Netherlands
* School holiday definitions added: Romania
* Localizations added: Dutch
* Added simple HTML usage example for using the library in a website.
* Browserified the library

Changed
~~~~~~~

* Changed license to LGPL-3.0
* No global locale change.
* ``oh.isEqualTo``: Implemented check if two oh objects have the same meaning (are equal).
* Refer to YoHours in the evaluation tool.
* Expose ``oh.isEqualTo`` in the evaluation tool.

* Use HTTPS everywhere (in the documentation and in code comments).

Fixed
~~~~~

* Lots of small bugs and typos fixes.


v3.3.0_ - 2015-08-02
--------------------

.. _v3.3.0: https://github.com/opening-hours/opening_hours.js/compare/v3.2.0...v3.3.0

`v3.3.0 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.3.0+is%3Aclosed>`_

Added
~~~~~

* Public holiday definitions added: Czech Republic
* Support for localized error and warning messages.
* Support to localize oh.prettifyValue opening_hours value.
* Wrote SH_batch_exporter.sh and added support to write (SH) definitions for all states in Germany.
* Added more tests to the test framework.

Changed
~~~~~~~

* Updated translation modules to latest versions.

Fixed
~~~~~

* Fixed false positive warning for missing PH for value 'PH'.
* Fixed evaluation of SH after year wrap (of by one).


v3.2.0_ - 2015-05-16
--------------------

.. _v3.2.0: https://github.com/opening-hours/opening_hours.js/compare/v3.1.1...v3.2

`v3.2.0 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.2+is%3Aclosed>`_

Added
~~~~~

* Show warning for missing PH. Required API extension (fully backwards compatible, upgrade recommended).
* Show warning for year in past, not year range.
* Added more error checking and tests for: Wrong constructor call, e.g bad parameters.
* Added more tests to the test framework.

Changed
~~~~~~~

* Improved input/error tolerance.
* Refactored source code.
* Updated examples in evaluation tool.

* Statistics: Optimized Overpass import.
* Statistics: Fixed wrong stats for 'not prettified'.
* Statistics: real_test.js: Implemented punchcard weekly report generation.
  See `blog post <https://www.openstreetmap.org/user/ypid/diary/34881>`_.
* Statistics: Wrote ``gen_weekly_task_report``.


v3.1.1_ - 2015-04-12
--------------------

.. _v3.1.1: https://github.com/opening-hours/opening_hours.js/compare/v3.1.0...v3.1.1

`v3.1.1 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.1.1+is%3Aclosed>`_

Added
~~~~~

* Public holiday definitions added: Italian
* Added support to use data from the Overpass API to generate statistics.

Changed
~~~~~~~

* Give better error message for wrong usage of ``<additional_rule_separator>``.
* Always use strict ``===`` comparison in JavaScript.


v3.1.0_ - 2015-02-15
--------------------

.. _v3.1.0: https://github.com/opening-hours/opening_hours.js/compare/v3.0.2...v3.1.0

`v3.1.0 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.1.0+is%3Aclosed>`_

Added
~~~~~

* Public holiday definitions added: USA

Fixed
~~~~~

* Public holiday definitions fixed: France


v3.0.2_ - 2015-01-24
--------------------

.. _v3.0.2: https://github.com/opening-hours/opening_hours.js/compare/v3.0.1...v3.0.2

Added
~~~~~

* Added ``make release`` target.

Changed
~~~~~~~

* package.json: Narrowed down version of dependencies.
* Enhanced Makefile.
* Updated README.md


v3.0.1_ - 2015-01-24
--------------------

.. _v3.0.1: https://github.com/opening-hours/opening_hours.js/compare/v3.0.0...v3.0.1

`v3.0.1 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.0.1+is%3Aclosed>`_

Added
~~~~~

* Public holiday definitions added: Russian
* Improved error tolerance for values ``bis open end`` and ``Sonn- und Feiertags``.
* real_test.js: Added the following OSM tags to the evaluation:

  * Key:happy_hours
  * Key:delivery_hours
  * Key:opening_hours:delivery

* Evaluation tool: Added ``noscript`` tag to give a hint to the user to enable JavaScript.

Fixed
~~~~~

* Fixed up README.md.
* Fixed error when parsing input value ``SH off; Mo-Sa 18:00+``.
* Require 2.7.x of the moment library because of API change in recent versions.


v3.0.0_ - 2014-09-08
--------------------

.. _v3.0.0: https://github.com/opening-hours/opening_hours.js/compare/v2.1.9...v3.0.0

`v3.0.0 milestone <https://github.com/opening-hours/opening_hours.js/issues?q=milestone%3Av3.0.0+is%3Aclosed>`_

Added
~~~~~

* Release notes.
* ``oh.prettifyValue``: Implemented selector reordering.
* ``oh.prettifyValue``: Changed API for optional parameters. API is backwards compatible in case you are not using any of the optional parameters.
* Evaluation tool: Highlight selectors and other tokens and give more information.
* real_test.js: Write verbose log file for all values and states.
* real_test.js: Added tag filter command line parameter and csv stats output.
* Created favicon.
* Bundle (and test) minified version as ``opening_hours.min.js``.
* More unit tests:

  * Rule has no time selector.
  * Changed default state not first rule like ``Mo 12:00-14:00; closed``.
  * Valid use of ``<separator_for_readability>``.
  * And more.

Changed
~~~~~~~

* ``oh.getMatchingRule``: Changed API. Not backwards compatible.
* Week selector rework. Using ISO 8601 week dates.
* Made second rule of '07:00+,12:00-16:00; 16:00-24:00 closed "needed because of open end"' obsolete.
* Improved error tolerance.
* real_test.js: Enhanced implementation.

Fixed
~~~~~

* Fixed evaluation for some (not to often used) values.
* Optimized source code with JSHint. Some internal variables where defined in global scope.
* Removed duplicate warnings for ``test.addShouldWarn`` in test framework.


v2.1.9_ - 2014-08-17
--------------------

.. _v2.1.9: https://github.com/opening-hours/opening_hours.js/compare/v2.1.8...v2.1.9

Added
~~~~~

* Many more unit tests.
* Internal tokens array documentation.
* Using moment.js for date localization.

Changed
~~~~~~~

* Many improve error tolerance: comments, am/pm time format, …
* Updated examples in the evaluation tool.
* Internal refactoring and enhancements.

Fixed
~~~~~

* Fixed problems reported by ``real_test``
* Fixed bug in test framework.


v1.0.0 - 2013-01-12
-------------------

* Initial coding and design.
