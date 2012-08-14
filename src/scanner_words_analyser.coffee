define [], ->
  class ScannerWordsAnalyser
    wordsNumbers:
      one: 1
      two: 2
      three: 3
      four: 4
      five: 5
      six: 6
      seven: 7
      eigth: 8
      nine: 9
      ten: 10
      eleven: 11
      twelve: 12

    time_units:
      m: ['m', 'min', 'minute', 'minutes']
      h: ['h', 'hr', 'hour', 'hours']

    timeModifierCheck: (token) ->
      if token.raw is 'am' or token.raw is 'pm'
        token.token = 'time_modifier'

    wordNumberCheck: (token) ->
      wordsNumbers = @wordsNumbers

      for word, number of wordsNumbers
        if word is token.raw
          token.token = 'number'
          token.value = number

    timeUnitCheck: (token) ->
      if _.any(@time_units.m, (m) -> token.raw is m)
        token.token = 'time_unit'
        token.value = 'm'
      else if _.any(@time_units.h, (h) -> token.raw is h)
        token.token = 'time_unit'
        token.value = 'h'