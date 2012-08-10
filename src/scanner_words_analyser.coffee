window.ScannerWordsAnalyser = class ScannerWordsanalyser
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

  timeModifierCheck: (token) ->
    if token.raw is 'am' or token.raw is 'pm'
      token.token = 'time_modifier'

  wordNumberCheck: (token) ->
    wordsNumbers = @wordsNumbers

    for word, number of wordsNumbers
      if word is token.raw
        token.token = 'number'
        token.value = number



