requirejs ['parser', 'scanner', 'input_reader', 'scanner_words_analyser', 'time_patterns_analyser', 'duration_patterns_analyser'], 
  (Parser, Scanner, InputReader, ScannerWordsAnalyser, TimePatternsAnalyser, DurationPatternsAnalyser) -> 
    window.todo = {}
    window.todo.time = (inputValue) ->
      inputReader = new InputReader inputValue
      scannerWordsAnalyser = new ScannerWordsAnalyser()
      scanner = new Scanner inputReader, scannerWordsAnalyser

      parser = new Parser scanner
      result = parser.parse inputValue

      # $('.time .tokens').text _.pluck result, 'token'

      timePatternsAnalyser = new TimePatternsAnalyser()
      analyseResult = timePatternsAnalyser.analyse result

      if analyseResult is null then inputValue else analyseResult

    window.todo.duration = (inputValue) ->
      inputReader = new InputReader inputValue
      scannerWordsAnalyser = new ScannerWordsAnalyser()
      scanner = new Scanner inputReader, scannerWordsAnalyser

      parser = new Parser scanner
      result = parser.parse inputValue

      # $('.duration .tokens').text _.pluck result, 'token'

      durationPatternsAnalyser = new DurationPatternsAnalyser()
      analyseResult = durationPatternsAnalyser.analyse result

      if analyseResult is null then inputValue else analyseResult.toString()