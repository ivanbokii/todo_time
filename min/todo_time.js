(function () {
/**
 * almond 0.1.2 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice,
        main, req;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {},
            nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part;

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            return true;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, ret, map, i;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond.js", function(){});

// Generated by CoffeeScript 1.3.3
(function() {

  define('parser',[], function() {
    var Parser;
    return Parser = (function() {

      function Parser(scanner) {
        this.scanner = scanner;
      }

      Parser.prototype.parse = function() {
        var token, tokens;
        tokens = [];
        while ((token = this.scanner.nextToken()).token !== 'end') {
          tokens.push(token);
        }
        return tokens;
      };

      return Parser;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('char_checker',[], function() {
    var CharChecker;
    return CharChecker = (function() {

      function CharChecker() {}

      CharChecker.numberReg = /^[0-9]$/;

      CharChecker.alphaReg = /^[A-Za-z]$/;

      CharChecker.isNumber = function(char) {
        return this.numberReg.test(char);
      };

      CharChecker.isAlpha = function(char) {
        return this.alphaReg.test(char);
      };

      CharChecker.isColon = function(char) {
        return char === ':';
      };

      return CharChecker;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('input_reader',[], function() {
    var InputReader;
    return InputReader = (function() {

      function InputReader(input) {
        this.input = input;
        this.position = 0;
      }

      InputReader.prototype.nextChar = function() {
        return this.input[this.position++];
      };

      InputReader.prototype.currentChar = function() {
        return this.input[this.position];
      };

      return InputReader;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('token',['input_reader', 'char_checker'], function(InputReader, CharChecker) {
    var Token;
    return Token = (function() {

      Token.prototype.raw = '';

      Token.prototype.token = null;

      Token.prototype.value = null;

      function Token(inputReader, token, checker) {
        this.inputReader = inputReader;
        this.token = token;
        this.checker = checker;
        this._readTokenFrom(inputReader);
      }

      Token.prototype._readTokenFrom = function(inputReader) {
        var char;
        if (this.token === 'undef' || this.token === 'colon') {
          this.raw = inputReader.currentChar();
          this.value = this.raw;
          inputReader.nextChar();
          return;
        }
        if (this.token === 'end') {
          return;
        }
        while (this.checker.call(CharChecker, (char = inputReader.currentChar()))) {
          this.raw += char;
          inputReader.nextChar();
        }
        return this.value = this.raw;
      };

      return Token;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('scanner',['char_checker', 'token'], function(CharChecker, Token) {
    var Scanner;
    return Scanner = (function() {

      function Scanner(inputReader, scannerWordsAnalyser) {
        this.inputReader = inputReader;
        this.scannerWordsAnalyser = scannerWordsAnalyser;
        this.currentToken = null;
      }

      Scanner.prototype.currentToken = function() {
        return this.currentToken;
      };

      Scanner.prototype.nextToken = function() {
        this.currentToken = this._extractToken();
        return this.currentToken;
      };

      Scanner.prototype._extractToken = function() {
        var currentChar, token;
        this._skipWhitespaces();
        currentChar = this.inputReader.currentChar();
        token = null;
        if (CharChecker.isNumber(currentChar)) {
          token = new Token(this.inputReader, 'number', CharChecker.isNumber);
          token.value = parseInt(token.value);
        } else if (CharChecker.isAlpha(currentChar)) {
          token = new Token(this.inputReader, 'word', CharChecker.isAlpha);
          this.scannerWordsAnalyser.timeModifierCheck(token);
          this.scannerWordsAnalyser.wordNumberCheck(token);
          this.scannerWordsAnalyser.timeUnitCheck(token);
        } else if (CharChecker.isColon(currentChar)) {
          token = new Token(this.inputReader, 'colon');
        } else if (currentChar === void 0) {
          token = new Token(this.inputReader, 'end');
        } else {
          token = new Token(this.inputReader, 'undef');
        }
        return token;
      };

      Scanner.prototype._skipWhitespaces = function() {
        var _results;
        _results = [];
        while (this.inputReader.currentChar() === ' ') {
          _results.push(this.inputReader.nextChar());
        }
        return _results;
      };

      return Scanner;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('scanner_words_analyser',[], function() {
    var ScannerWordsAnalyser;
    return ScannerWordsAnalyser = (function() {

      function ScannerWordsAnalyser() {}

      ScannerWordsAnalyser.prototype.wordsNumbers = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eigth: 8,
        nine: 9,
        ten: 10,
        eleven: 11,
        twelve: 12
      };

      ScannerWordsAnalyser.prototype.time_units = {
        m: ['m', 'min', 'minute', 'minutes'],
        h: ['h', 'hr', 'hour', 'hours']
      };

      ScannerWordsAnalyser.prototype.timeModifierCheck = function(token) {
        if (token.raw === 'am' || token.raw === 'pm') {
          return token.token = 'time_modifier';
        }
      };

      ScannerWordsAnalyser.prototype.wordNumberCheck = function(token) {
        var number, word, wordsNumbers, _results;
        wordsNumbers = this.wordsNumbers;
        _results = [];
        for (word in wordsNumbers) {
          number = wordsNumbers[word];
          if (word === token.raw) {
            token.token = 'number';
            _results.push(token.value = number);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      ScannerWordsAnalyser.prototype.timeUnitCheck = function(token) {
        if (_.any(this.time_units.m, function(m) {
          return token.raw === m;
        })) {
          token.token = 'time_unit';
          return token.value = 'm';
        } else if (_.any(this.time_units.h, function(h) {
          return token.raw === h;
        })) {
          token.token = 'time_unit';
          return token.value = 'h';
        }
      };

      return ScannerWordsAnalyser;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('time_patterns/simple',[], function() {
    var SimplePattern;
    return SimplePattern = (function() {

      function SimplePattern() {}

      SimplePattern.prototype.sequence = 'number colon number';

      SimplePattern.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      SimplePattern.prototype.validate = function(tokens) {
        var hoursValid, minutesValid, _ref, _ref1;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        minutesValid = (0 <= (_ref1 = tokens[2].value) && _ref1 <= 59);
        return hoursValid && minutesValid;
      };

      SimplePattern.prototype.transform = function(tokens) {
        var hoursValue, minutesValue;
        hoursValue = tokens[0].value;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = tokens[2].value;
        minutesValue = minutesValue < 10 ? '0' + minutesValue : minutesValue;
        return "" + hoursValue + ":" + minutesValue;
      };

      return SimplePattern;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('time_patterns/simple_modifier',[], function() {
    var SimpleModifier;
    return SimpleModifier = (function() {

      function SimpleModifier() {}

      SimpleModifier.prototype.sequence = 'number colon number time_modifier';

      SimpleModifier.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      SimpleModifier.prototype.validate = function(tokens) {
        var hoursValid, minutesValid, _ref, _ref1;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        minutesValid = (0 <= (_ref1 = tokens[2].value) && _ref1 <= 59);
        return hoursValid && minutesValid;
      };

      SimpleModifier.prototype.transform = function(tokens) {
        var hours, hoursValue, minutesValue;
        hours = tokens[0].value;
        if (tokens[3].value === 'pm') {
          hours = tokens[0].value + 12;
        }
        hoursValue = hours;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = tokens[2].value;
        minutesValue = minutesValue < 10 ? '0' + minutesValue : minutesValue;
        return "" + hoursValue + ":" + minutesValue;
      };

      return SimpleModifier;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('time_patterns/number',[], function() {
    var NumberTime;
    return NumberTime = (function() {

      function NumberTime() {}

      NumberTime.prototype.sequence = 'number';

      NumberTime.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      NumberTime.prototype.validate = function(tokens) {
        var hoursValid, _ref;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        return hoursValid;
      };

      NumberTime.prototype.transform = function(tokens) {
        var hoursValue, minutesValue;
        hoursValue = tokens[0].value;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = '00';
        return "" + hoursValue + ":" + minutesValue;
      };

      return NumberTime;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('time_patterns/number_modifier',[], function() {
    var NumberModifierTime;
    return NumberModifierTime = (function() {

      function NumberModifierTime() {}

      NumberModifierTime.prototype.sequence = 'number time_modifier';

      NumberModifierTime.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      NumberModifierTime.prototype.validate = function(tokens) {
        var hoursValid, _ref;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        return hoursValid;
      };

      NumberModifierTime.prototype.transform = function(tokens) {
        var hours, hoursValue, minutesValue;
        hours = tokens[0].value;
        if (tokens[1].value === 'pm') {
          hours = tokens[0].value + 12;
        }
        hoursValue = hours;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = '00';
        return "" + hoursValue + ":" + minutesValue;
      };

      return NumberModifierTime;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('time_patterns_analyser',['time_patterns/simple', 'time_patterns/simple_modifier', 'time_patterns/number', 'time_patterns/number_modifier'], function(Simple, SimpleModifier, NumberTime, NumberModifierTime) {
    var TimePatternsAnalyser;
    return TimePatternsAnalyser = (function() {

      function TimePatternsAnalyser() {}

      TimePatternsAnalyser.prototype.patterns = [new SimpleModifier(), new Simple(), new NumberModifierTime(), new NumberTime()];

      TimePatternsAnalyser.prototype.analyse = function(tokens) {
        var pattern, result, series, _i, _len, _ref;
        series = _.pluck(tokens, 'token').join(' ');
        result = null;
        _ref = this.patterns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pattern = _ref[_i];
          if (pattern.check(series) && pattern.validate(tokens)) {
            result = pattern.transform(tokens);
            break;
          }
        }
        return result;
      };

      return TimePatternsAnalyser;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('duration_patterns/simple',[], function() {
    var SimplePattern;
    return SimplePattern = (function() {

      function SimplePattern() {}

      SimplePattern.prototype.sequence = 'number';

      SimplePattern.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      SimplePattern.prototype.validate = function(tokens) {
        return true;
      };

      SimplePattern.prototype.transform = function(tokens) {
        return tokens[0].value;
      };

      return SimplePattern;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('duration_patterns/simple_unit',[], function() {
    var SimpleUnitPattern;
    return SimpleUnitPattern = (function() {

      function SimpleUnitPattern() {}

      SimpleUnitPattern.prototype.sequence = 'number time_unit';

      SimpleUnitPattern.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      SimpleUnitPattern.prototype.validate = function(tokens) {
        return true;
      };

      SimpleUnitPattern.prototype.transform = function(tokens) {
        var result, time, unit;
        time = tokens[0];
        unit = tokens[1].value;
        result = time.value;
        if (unit === 'h') {
          result *= 60;
        }
        return result;
      };

      return SimpleUnitPattern;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('duration_patterns/complex_unit',[], function() {
    var ComplexUnitPattern;
    return ComplexUnitPattern = (function() {

      function ComplexUnitPattern() {}

      ComplexUnitPattern.prototype.sequence = 'number time_unit number time_unit';

      ComplexUnitPattern.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      ComplexUnitPattern.prototype.validate = function(tokens) {
        return true;
      };

      ComplexUnitPattern.prototype.transform = function(tokens) {
        var first, second;
        first = this._calculate(tokens[0].value, tokens[1].value);
        second = this._calculate(tokens[2].value, tokens[3].value);
        return first + second;
      };

      ComplexUnitPattern.prototype._calculate = function(value, unit) {
        var result;
        result = value;
        if (unit === 'h') {
          result *= 60;
        }
        return result;
      };

      return ComplexUnitPattern;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('duration_patterns_analyser',['duration_patterns/simple', 'duration_patterns/simple_unit', 'duration_patterns/complex_unit'], function(Simple, SimpleUnit, ComplexUnit) {
    var DurationPatternsAnalyser;
    return DurationPatternsAnalyser = (function() {

      function DurationPatternsAnalyser() {}

      DurationPatternsAnalyser.prototype.patterns = [new ComplexUnit(), new SimpleUnit(), new Simple()];

      DurationPatternsAnalyser.prototype.analyse = function(tokens) {
        var pattern, result, series, _i, _len, _ref;
        series = _.pluck(tokens, 'token').join(' ');
        result = null;
        _ref = this.patterns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pattern = _ref[_i];
          if (pattern.check(series) && pattern.validate(tokens)) {
            result = pattern.transform(tokens);
            break;
          }
        }
        return result;
      };

      return DurationPatternsAnalyser;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('fuzzy_patterns/simple_time',[], function() {
    var SimpleTime;
    return SimpleTime = (function() {

      function SimpleTime() {}

      SimpleTime.prototype.sequence = 'number colon number';

      SimpleTime.prototype.length = 3;

      SimpleTime.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      SimpleTime.prototype.validate = function(tokens) {
        var hoursValid, minutesValid, _ref, _ref1;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        minutesValid = (0 <= (_ref1 = tokens[2].value) && _ref1 <= 59);
        return hoursValid && minutesValid;
      };

      SimpleTime.prototype.transform = function(tokens) {
        var hoursValue, minutesValue;
        hoursValue = tokens[0].value;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = tokens[2].value;
        minutesValue = minutesValue < 10 ? '0' + minutesValue : minutesValue;
        return "" + hoursValue + ":" + minutesValue;
      };

      return SimpleTime;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('fuzzy_patterns/simple_time_modifier',[], function() {
    var SimpleTimeModifier;
    return SimpleTimeModifier = (function() {

      function SimpleTimeModifier() {}

      SimpleTimeModifier.prototype.sequence = 'number colon number time_modifier';

      SimpleTimeModifier.prototype.length = 4;

      SimpleTimeModifier.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      SimpleTimeModifier.prototype.validate = function(tokens) {
        var hoursValid, minutesValid, _ref, _ref1;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        minutesValid = (0 <= (_ref1 = tokens[2].value) && _ref1 <= 59);
        return hoursValid && minutesValid;
      };

      SimpleTimeModifier.prototype.transform = function(tokens) {
        var hours, hoursValue, minutesValue;
        hours = tokens[0].value;
        if (tokens[3].value === 'pm') {
          hours = tokens[0].value + 12;
        }
        hoursValue = hours;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = tokens[2].value;
        minutesValue = minutesValue < 10 ? '0' + minutesValue : minutesValue;
        return "" + hoursValue + ":" + minutesValue;
      };

      return SimpleTimeModifier;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('fuzzy_patterns/number_time_modifier',[], function() {
    var NumberTimeModifier;
    return NumberTimeModifier = (function() {

      function NumberTimeModifier() {}

      NumberTimeModifier.prototype.sequence = 'number time_modifier';

      NumberTimeModifier.prototype.length = 2;

      NumberTimeModifier.prototype.check = function(sequence) {
        return sequence === this.sequence;
      };

      NumberTimeModifier.prototype.validate = function(tokens) {
        var hoursValid, _ref;
        hoursValid = (0 <= (_ref = tokens[0].value) && _ref <= 23);
        return hoursValid;
      };

      NumberTimeModifier.prototype.transform = function(tokens) {
        var hours, hoursValue, minutesValue;
        hours = tokens[0].value;
        if (tokens[1].value === 'pm') {
          hours = tokens[0].value + 12;
        }
        hoursValue = hours;
        hoursValue = hoursValue < 10 ? '0' + hoursValue : hoursValue;
        minutesValue = '00';
        return "" + hoursValue + ":" + minutesValue;
      };

      return NumberTimeModifier;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  define('fuzzy_patterns_analyser',['fuzzy_patterns/simple_time', 'fuzzy_patterns/simple_time_modifier', 'fuzzy_patterns/number_time_modifier'], function(SimpleTime, SimpleTimeModifier, NumberTimeModifier) {
    var FuzzyPatternsAnalyser;
    return FuzzyPatternsAnalyser = (function() {

      function FuzzyPatternsAnalyser() {}

      FuzzyPatternsAnalyser.prototype.timePatterns = [new SimpleTimeModifier(), new SimpleTime(), new NumberTimeModifier()];

      FuzzyPatternsAnalyser.prototype.analyseTime = function(tokens) {
        var numberOfTokens, numberOfTokensInPattern, pattern, tv, _i, _j, _len, _len1, _ref, _ref1;
        this.tokensVariants = [];
        numberOfTokens = tokens.length;
        _ref = this.timePatterns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pattern = _ref[_i];
          numberOfTokensInPattern = pattern.length;
          if (numberOfTokens < numberOfTokensInPattern) {
            continue;
          }
          this.buildTokensVariants(tokens, numberOfTokensInPattern);
          _ref1 = this.tokensVariants;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            tv = _ref1[_j];
            if (pattern.check(tv.sequence) && pattern.validate(tv.tokens)) {
              delete this.tokensVariants;
              return pattern.transform(tv.tokens);
            }
          }
        }
        return null;
      };

      FuzzyPatternsAnalyser.prototype.buildTokensVariants = function(tokens, length) {
        var index, sequence, subTokens, _i, _results;
        _results = [];
        while (tokens.length >= length) {
          sequence = '';
          subTokens = [];
          for (index = _i = 0; 0 <= length ? _i < length : _i > length; index = 0 <= length ? ++_i : --_i) {
            sequence += tokens[index].token + ' ';
            subTokens.push(tokens[index]);
          }
          this.tokensVariants.push({
            sequence: sequence.trim(),
            tokens: subTokens
          });
          _results.push(tokens = _.rest(tokens));
        }
        return _results;
      };

      return FuzzyPatternsAnalyser;

    })();
  });

}).call(this);

// Generated by CoffeeScript 1.3.3
(function() {

  requirejs(['parser', 'scanner', 'input_reader', 'scanner_words_analyser', 'time_patterns_analyser', 'duration_patterns_analyser', 'fuzzy_patterns_analyser'], function(Parser, Scanner, InputReader, ScannerWordsAnalyser, TimePatternsAnalyser, DurationPatternsAnalyser, FuzzyPatternsAnalyser) {
    window.todo = {};
    window.todo.time = function(inputValue) {
      var analyseResult, inputReader, parser, result, scanner, scannerWordsAnalyser, timePatternsAnalyser;
      inputReader = new InputReader(inputValue);
      scannerWordsAnalyser = new ScannerWordsAnalyser();
      scanner = new Scanner(inputReader, scannerWordsAnalyser);
      parser = new Parser(scanner);
      result = parser.parse(inputValue);
      timePatternsAnalyser = new TimePatternsAnalyser();
      analyseResult = timePatternsAnalyser.analyse(result);
      if (analyseResult === null) {
        return inputValue;
      } else {
        return analyseResult;
      }
    };
    window.todo.duration = function(inputValue) {
      var analyseResult, durationPatternsAnalyser, inputReader, parser, result, scanner, scannerWordsAnalyser;
      inputReader = new InputReader(inputValue);
      scannerWordsAnalyser = new ScannerWordsAnalyser();
      scanner = new Scanner(inputReader, scannerWordsAnalyser);
      parser = new Parser(scanner);
      result = parser.parse(inputValue);
      durationPatternsAnalyser = new DurationPatternsAnalyser();
      analyseResult = durationPatternsAnalyser.analyse(result);
      if (analyseResult === null) {
        return inputValue;
      } else {
        return analyseResult.toString();
      }
    };
    return window.todo.fuzzy = function(inputValue) {
      var analyseResult, fuzzyPatternsAnalyser, inputReader, parser, result, scanner, scannerWordsAnalyser;
      inputReader = new InputReader(inputValue);
      scannerWordsAnalyser = new ScannerWordsAnalyser();
      scanner = new Scanner(inputReader, scannerWordsAnalyser);
      parser = new Parser(scanner);
      result = parser.parse(inputValue);
      fuzzyPatternsAnalyser = new FuzzyPatternsAnalyser();
      analyseResult = fuzzyPatternsAnalyser.analyseTime(result);
      if (analyseResult === null) {
        return inputValue;
      } else {
        return analyseResult.toString();
      }
    };
  });

}).call(this);

define("app.js", function(){});
}());