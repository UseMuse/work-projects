'use strict';
(function (angular) {

    var Module = angular.module('datePicker', []);

    Module.constant('datePickerConfig', {
        template: 'templates/datepicker.html',
        view: 'month',
        views: ['year', 'month', 'date', 'hours', 'minutes'],
        step: 5
    });

    Module.filter('time', function () {
        function format(date) {
            return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
        }

        return function (date) {
            if (!(date instanceof Date)) {
                date = new Date(date);
                if (isNaN(date.getTime())) {
                    return undefined;
                }
            }
            return format(date);
        };
    });

    function getVisibleMinutes(date, step) {
        date = new Date(date || new Date());
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
        var minutes = [];
        var stop = date.getTime() + 60 * 60 * 1000;
        while (date.getTime() < stop) {
            minutes.push(date);
            date = new Date(date.getTime() + step * 60 * 1000);
        }
        return minutes;
    }

    function getVisibleWeeks(date) {
        date = new Date(date || new Date());
        var startMonth = date.getMonth(), startYear = date.getYear();
        date.setDate(1);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        if (date.getDay() === 0) {
            date.setDate(-5);
        } else {
            date.setDate(date.getDate() - (date.getDay() - 1));
        }
        if (date.getDate() === 1) {
            date.setDate(-6);
        }

        var weeks = [];
        while (weeks.length < 6) {
            /*jshint -W116 */
            if (date.getYear() === startYear && date.getMonth() > startMonth) break;
            var week = [];
            for (var i = 0; i < 7; i++) {
                week.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }
            weeks.push(week);
        }
        return weeks;
    }

    function getVisibleYears(date) {
        var years = [];
        date = new Date(date || new Date());
        date.setFullYear(date.getFullYear() - (date.getFullYear() % 10));
        for (var i = 0; i < 12; i++) {
            years.push(new Date(date.getFullYear() + (i - 1), 0, 1));
        }
        return years;
    }

    function getDaysOfWeek(date) {
        date = new Date(date || new Date());
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        date.setDate(date.getDate() - (date.getDay() - 1));
        var days = [];
        for (var i = 0; i < 7; i++) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }

    function getVisibleMonths(date) {
        date = new Date(date || new Date());
        var year = date.getFullYear();
        var months = [];
        for (var month = 0; month < 12; month++) {
            months.push(new Date(year, month, 1));
        }
        return months;
    }

    function getLocalMonths(isShort) {
        var months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

        if (!isShort)
            return months;

        var dates = getVisibleMonths();
        var i = -1;

        return months.map(function (month) {
            var month = month.length > 4 ? month.substring(0, 3) : month;
            i++;
            return { month: month, date: dates[i] };
        });
    }

    function getVisibleHours(date) {
        date = new Date(date || new Date());
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        var hours = [];
        for (var i = 0; i < 24; i++) {
            hours.push(date);
            date = new Date(date.getTime() + 60 * 60 * 1000);
        }
        return hours;
    }


    function isAfter(model, date) {
        return model && model.getTime() <= date.getTime();
    }

    function isBefore(model, date) {
        return model.getTime() >= date.getTime();
    }

    function isSameYear(model, date) {
        return model && model.getFullYear() === date.getFullYear();
    }

    function isSameMonth(model, date) {
        return isSameYear(model, date) && model.getMonth() === date.getMonth();
    }

    function isSameDay(model, date) {
        return isSameMonth(model, date) && model.getDate() === date.getDate();
    }

    function isSameHour(model, date) {
        return isSameDay(model, date) && model.getHours() === date.getHours();
    }

    function isSameMinutes(model, date) {
        return isSameHour(model, date) && model.getMinutes() === date.getMinutes();
    }



    Module.directive('datePicker', ['datePickerConfig', function datePickerDirective(datePickerConfig) {

        //noinspection JSUnusedLocalSymbols
        return {
            // this is a bug ?
            template: '<div ng-include="template"></div>',
            scope: {
                model: '=datePicker',
                after: '=?',
                before: '=?'
            },
            link: function (scope, element, attrs) {

                scope.date = new Date(scope.model || new Date());
                scope.views = datePickerConfig.views.concat();
                scope.view = attrs.view || datePickerConfig.view;
                scope.now = new Date();
                scope.template = attrs.template || datePickerConfig.template;

                var step = parseInt(attrs.step || datePickerConfig.step, 10);
                var partial = !!attrs.partial;

                /** @namespace attrs.minView, attrs.maxView */
                scope.views = scope.views.slice(
                  scope.views.indexOf(attrs.maxView || 'year'),
                  scope.views.indexOf(attrs.minView || 'minutes') + 1
                );

                if (scope.views.length === 1 || scope.views.indexOf(scope.view) === -1) {
                    scope.view = scope.views[0];
                }

                scope.setView = function (nextView) {
                    if (scope.views.indexOf(nextView) !== -1) {
                        scope.view = nextView;
                    }
                };

                scope.setDate = function (date) {
                    if (attrs.disabled) {
                        return;
                    }
                    scope.date = date;
                    // change next view
                    var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
                    if ((!nextView || partial) || scope.model) {

                        scope.model = new Date(scope.model || date);
                        var view = partial ? 'minutes' : scope.view;
                        //noinspection FallThroughInSwitchStatementJS
                        switch (view) {
                            case 'minutes':
                                scope.model.setMinutes(date.getMinutes());
                                /*falls through*/
                            case 'hours':
                                scope.model.setHours(date.getHours());
                                /*falls through*/
                            case 'date':
                                scope.model.setDate(date.getDate());
                                /*falls through*/
                            case 'month':
                                scope.model.setMonth(date.getMonth());
                                /*falls through*/
                            case 'year':
                                scope.model.setFullYear(date.getFullYear());
                        }
                        scope.$emit('setDate', scope.model, scope.view);
                    }

                    if (nextView) {
                        scope.setView(nextView);
                    }
                };

                function update() {
                    var view = scope.view;
                    var date = scope.date;
                    switch (view) {
                        case 'year':
                            scope.years = getVisibleYears(date);
                            break;
                        case 'month':
                            scope.months = getLocalMonths(true); // getVisibleMonths(date);
                            break;
                        case 'date':
                            scope.weekdays = scope.weekdays || ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]; // getDaysOfWeek();
                            scope.weeks = getVisibleWeeks(date);
                            break;
                        case 'hours':
                            scope.hours = getVisibleHours(date);
                            break;
                        case 'minutes':
                            scope.minutes = getVisibleMinutes(date, step);
                            break;
                    }
                }

                function watch() {
                    if (scope.view !== 'date') {
                        return scope.view;
                    }
                    return scope.model ? scope.model.getMonth() : null;
                }


                scope.$watch(watch, update);

                scope.next = function (delta) {
                    var date = scope.date;
                    delta = delta || 1;
                    switch (scope.view) {
                        case 'year':
                            /*falls through*/
                        case 'month':
                            date.setFullYear(date.getFullYear() + delta);
                            break;
                        case 'date':
                            date.setMonth(date.getMonth() + delta);
                            break;
                        case 'hours':
                            /*falls through*/
                        case 'minutes':
                            date.setHours(date.getHours() + delta);
                            break;
                    }
                    update();
                };

                scope.getLocalDate = function (date) {
                    var months = getLocalMonths();
                    var month = months[date.getMonth()];

                    return month + " " + date.getFullYear();
                }

                scope.prev = function (delta) {
                    return scope.next(-delta || -1);
                };

                scope.isAfter = function (date) {
                    return scope.after && isAfter(date, scope.after);
                };

                scope.isBefore = function (date) {
                    return scope.before && isBefore(date, scope.before);
                };

                scope.isSameMonth = function (date) {
                    return isSameMonth(scope.model, date);
                };

                scope.isSameYear = function (date) {
                    return isSameYear(scope.model, date);
                };

                scope.isSameDay = function (date) {
                    return isSameDay(scope.model, date);
                };

                scope.isSameHour = function (date) {
                    return isSameHour(scope.model, date);
                };

                scope.isSameMinutes = function (date) {
                    return isSameMinutes(scope.model, date);
                };

                scope.isNow = function (date) {
                    var is = true;
                    var now = scope.now;
                    //noinspection FallThroughInSwitchStatementJS
                    switch (scope.view) {
                        case 'minutes':
                            is &= ~~(date.getMinutes() / step) === ~~(now.getMinutes() / step);
                            /*falls through*/
                        case 'hours':
                            is &= date.getHours() === now.getHours();
                            /*falls through*/
                        case 'date':
                            is &= date.getDate() === now.getDate();
                            /*falls through*/
                        case 'month':
                            is &= date.getMonth() === now.getMonth();
                            /*falls through*/
                        case 'year':
                            is &= date.getFullYear() === now.getFullYear();
                    }
                    return is;
                };
            }
        };
    }]);

    //var Module = angular.module('datePicker');

    Module.directive('dateRange', function () {
        return {
            templateUrl: 'templates/daterange.html',
            scope: {
                start: '=',
                end: '='
            },
            link: function (scope, element, attrs) {
                attrs.$observe('disabled', function (isDisabled) {
                    scope.disableDatePickers = !!isDisabled;
                });
                scope.$watch('start.getTime()', function (value) {
                    if (value && scope.end && value > scope.end.getTime()) {
                        scope.end = new Date(value);
                    }
                });
                scope.$watch('end.getTime()', function (value) {
                    if (value && scope.start && value < scope.start.getTime()) {
                        scope.start = new Date(value);
                    }
                });
            }
        };
    });

    var PRISTINE_CLASS = 'ng-pristine',
        DIRTY_CLASS = 'ng-dirty';

    //var Module = angular.module('datePicker');

    Module.constant('dateTimeConfig', {
        template: function (attrs) {
            return '' +
                '<div ' +
                'date-picker="' + attrs.ngModel + '" ' +
                (attrs.view ? 'view="' + attrs.view + '" ' : '') +
                (attrs.maxView ? 'max-view="' + attrs.maxView + '" ' : '') +
                (attrs.template ? 'template="' + attrs.template + '" ' : '') +
                (attrs.minView ? 'min-view="' + attrs.minView + '" ' : '') +
                (attrs.partial ? 'partial="' + attrs.partial + '" ' : '') +
                'class="dropdown-menu"></div>';
        },
        format: 'yyyy-MM-dd HH:mm',
        views: ['date', 'year', 'month', 'hours', 'minutes'],
        dismiss: false,
        position: 'relative'
    });

    Module.directive('dateTimeAppend', function () {
        return {
            link: function (scope, element) {
                element.bind('click', function () {
                    element.find('input')[0].focus();
                });
            }
        };
    });

    Module.directive('dateTime', ['$compile', '$document', '$filter', 'dateTimeConfig', '$parse', function ($compile, $document, $filter, dateTimeConfig, $parse) {
        var body = $document.find('body');
        var dateFilter = $filter('date');

        return {
            require: 'ngModel',
            scope: true,
            link: function (scope, element, attrs, ngModel) {
                var format = attrs.format || dateTimeConfig.format;
                var parentForm = element.inheritedData('$formController');
                var views = $parse(attrs.views)(scope) || dateTimeConfig.views.concat();
                var view = attrs.view || views[0];
                var index = views.indexOf(view);
                var dismiss = attrs.dismiss ? $parse(attrs.dismiss)(scope) : dateTimeConfig.dismiss;
                var picker = null;
                var position = attrs.position || dateTimeConfig.position;
                var container = null;

                if (index === -1) {
                    views.splice(index, 1);
                }

                views.unshift(view);


                function formatter(value) {
                    return dateFilter(value, format);
                }

                function parser() {
                    return ngModel.$modelValue;
                }

                ngModel.$formatters.push(formatter);
                ngModel.$parsers.unshift(parser);


                var template = dateTimeConfig.template(attrs);

                function updateInput(event) {
                    event.stopPropagation();
                    if (ngModel.$pristine) {
                        ngModel.$dirty = true;
                        ngModel.$pristine = false;
                        element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
                        if (parentForm) {
                            parentForm.$setDirty();
                        }
                        ngModel.$render();
                    }
                }

                function clear() {
                    if (picker) {
                        picker.remove();
                        picker = null;
                    }
                    if (container) {
                        container.remove();
                        container = null;
                    }
                }

                function showPicker() {
                    if (picker) {
                        return;
                    }
                    // create picker element
                    picker = $compile(template)(scope);
                    scope.$digest();

                    scope.$on('setDate', function (event, date, view) {
                        updateInput(event);
                        if (dismiss && views[views.length - 1] === view) {
                            clear();
                        }
                    });

                    scope.$on('$destroy', clear);

                    // move picker below input element

                    if (position === 'absolute') {
                        var pos = angular.extend(element.offset(), { height: element[0].offsetHeight });
                        picker.css({ top: pos.top + pos.height, left: pos.left, display: 'block', position: position });
                        body.append(picker);
                    } else {
                        // relative
                        container = angular.element('<div date-picker-wrapper></div>');
                        element[0].parentElement.insertBefore(container[0], element[0]);
                        container.append(picker);
                        //          this approach doesn't work
                        //          element.before(picker);
                        picker.css({ top: element[0].offsetHeight + 'px', display: 'block' });
                    }

                    picker.bind('mousedown', function (evt) {
                        evt.preventDefault();
                    });
                }

                element.bind('focus', showPicker);
                element.bind('blur', clear);
            }
        };
    }]);

    angular.module("datePicker").run(["$templateCache", function ($templateCache) {

        $templateCache.put("templates/datepicker.html",
          "<div ng-switch=\"view\">\r" +
          "\n" +
          "  <div ng-switch-when=\"date\">\r" +
          "\n" +
          "    <table>\r" +
          "\n" +
          "      <thead>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <th ng-click=\"prev()\">‹</th>\r" +
          "\n" +
          "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('month')\">{{getLocalDate(date)}}</th>\r" +
          "\n" +
          "        <th ng-click=\"next()\">›</i></th>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <th ng-repeat=\"day in weekdays\" style=\"overflow: hidden\">{{ day|date:\"EEE\" }}</th>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </thead>\r" +
          "\n" +
          "      <tbody>\r" +
          "\n" +
          "      <tr ng-repeat=\"week in weeks\">\r" +
          "\n" +
          "        <td ng-repeat=\"day in week\">\r" +
          "\n" +
          "          <span\r" +
          "\n" +
          "            ng-class=\"{'now':isNow(day),'active':isSameDay(day),'disabled':(day.getMonth()!=date.getMonth()),'after':isAfter(day),'before':isBefore(day)}\"\r" +
          "\n" +
          "            ng-click=\"setDate(day)\" ng-bind=\"day.getDate()\"></span>\r" +
          "\n" +
          "        </td>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </tbody>\r" +
          "\n" +
          "    </table>\r" +
          "\n" +
          "  </div>\r" +
          "\n" +
          "  <div ng-switch-when=\"year\">\r" +
          "\n" +
          "    <table>\r" +
          "\n" +
          "      <thead>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <th ng-click=\"prev(10)\">‹</th>\r" +
          "\n" +
          "        <th colspan=\"5\" class=\"switch\">{{years[0].getFullYear()}}-{{years[years.length-1].getFullYear()}}</th>\r" +
          "\n" +
          "        <th ng-click=\"next(10)\">›</i></th>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </thead>\r" +
          "\n" +
          "      <tbody>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <td colspan=\"7\">\r" +
          "\n" +
          "          <span ng-class=\"{'active':isSameYear(year),'now':isNow(year)}\"\r" +
          "\n" +
          "                ng-repeat=\"year in years\"\r" +
          "\n" +
          "                ng-click=\"setDate(year)\" ng-bind=\"year.getFullYear()\"></span>\r" +
          "\n" +
          "        </td>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </tbody>\r" +
          "\n" +
          "    </table>\r" +
          "\n" +
          "  </div>\r" +
          "\n" +
          "  <div ng-switch-when=\"month\">\r" +
          "\n" +
          "    <table>\r" +
          "\n" +
          "      <thead>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <th ng-click=\"prev()\">‹</th>\r" +
          "\n" +
          "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('year')\">{{ date|date:\"yyyy\" }}</th>\r" +
          "\n" +
          "        <th ng-click=\"next()\">›</i></th>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </thead>\r" +
          "\n" +
          "      <tbody>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <td colspan=\"7\">\r" +
          "\n" +
          "          <span ng-repeat=\"month in months\"\r" +
          "\n" +
          "                ng-class=\"{'active':isSameMonth(month.date),'after':isAfter(month.date),'before':isBefore(month.date),'now':isNow(month.date)}\"\r" +
          "\n" +
          "                ng-click=\"setDate(month.date)\"\r" +
          "\n" +
          "                ng-bind=\"month.month\"></span>\r" +
          "\n" +
          "        </td>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </tbody>\r" +
          "\n" +
          "    </table>\r" +
          "\n" +
          "  </div>\r" +
          "\n" +
          "  <div ng-switch-when=\"hours\">\r" +
          "\n" +
          "    <table>\r" +
          "\n" +
          "      <thead>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <th ng-click=\"prev(24)\">‹</th>\r" +
          "\n" +
          "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('date')\">{{ date|date:\"dd MMMM yyyy\" }}</th>\r" +
          "\n" +
          "        <th ng-click=\"next(24)\">›</i></th>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </thead>\r" +
          "\n" +
          "      <tbody>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <td colspan=\"7\">\r" +
          "\n" +
          "          <span ng-repeat=\"hour in hours\"\r" +
          "\n" +
          "                ng-class=\"{'now':isNow(hour),'active':isSameHour(hour)}\"\r" +
          "\n" +
          "                ng-click=\"setDate(hour)\" ng-bind=\"hour|time\"></span>\r" +
          "\n" +
          "        </td>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </tbody>\r" +
          "\n" +
          "    </table>\r" +
          "\n" +
          "  </div>\r" +
          "\n" +
          "  <div ng-switch-when=\"minutes\">\r" +
          "\n" +
          "    <table>\r" +
          "\n" +
          "      <thead>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <th ng-click=\"prev()\">‹</th>\r" +
          "\n" +
          "        <th colspan=\"5\" class=\"switch\" ng-click=\"setView('hours')\">{{ date|date:\"dd MMMM yyyy\" }}\r" +
          "\n" +
          "        </th>\r" +
          "\n" +
          "        <th ng-click=\"next()\">›</i></th>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </thead>\r" +
          "\n" +
          "      <tbody>\r" +
          "\n" +
          "      <tr>\r" +
          "\n" +
          "        <td colspan=\"7\">\r" +
          "\n" +
          "          <span ng-repeat=\"minute in minutes\"\r" +
          "\n" +
          "                ng-class=\"{active:isSameMinutes(minute),'now':isNow(minute)}\"\r" +
          "\n" +
          "                ng-click=\"setDate(minute)\"\r" +
          "\n" +
          "                ng-bind=\"minute|time\"></span>\r" +
          "\n" +
          "        </td>\r" +
          "\n" +
          "      </tr>\r" +
          "\n" +
          "      </tbody>\r" +
          "\n" +
          "    </table>\r" +
          "\n" +
          "  </div>\r" +
          "\n" +
          "</div>\r" +
          "\n"
        );

        $templateCache.put("templates/daterange.html",
          "<div>\r" +
          "\n" +
          "    <table>\r" +
          "\n" +
          "        <tr>\r" +
          "\n" +
          "            <td valign=\"top\">\r" +
          "\n" +
          "                <div date-picker=\"start\" ng-disabled=\"disableDatePickers\"  class=\"date-picker\" date after=\"start\" before=\"end\" min-view=\"date\" max-view=\"date\"></div>\r" +
          "\n" +
          "            </td>\r" +
          "\n" +
          "            <td valign=\"top\">\r" +
          "\n" +
          "                <div date-picker=\"end\" ng-disabled=\"disableDatePickers\"  class=\"date-picker\" date after=\"start\" before=\"end\"  min-view=\"date\" max-view=\"date\"></div>\r" +
          "\n" +
          "            </td>\r" +
          "\n" +
          "        </tr>\r" +
          "\n" +
          "    </table>\r" +
          "\n" +
          "</div>\r" +
          "\n"
        );

    }]);
})(angular);