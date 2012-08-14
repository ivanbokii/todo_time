requirejs ['parser', 'scanner', 'input_reader', 'scanner_words_analyser', 'time_patterns_analyser'], 
  (Parser, Scanner, InputReader, ScannerWordsAnalyser, TimePatternsAnalyser) -> 
    window.todo = {}
    window.todo.time = (inputValue) ->
      inputReader = new InputReader inputValue
      scannerWordsAnalyser = new ScannerWordsAnalyser()
      scanner = new Scanner inputReader, scannerWordsAnalyser

      parser = new Parser scanner
      result = parser.parse inputValue

      timePatternsAnalyser = new TimePatternsAnalyser()
      analyseResult = timePatternsAnalyser.analyse result

      analyseResult

    # window.todo.duration = (inputValue) ->
    #   inputReader = new InputReader inputValue
    #   scannerWordsAnalyser = new ScannerWordsAnalyser()
    #   scanner = new Scanner inputReader, scannerWordsAnalyser

    #   parser = new Parser scanner
    #   result = parser.parse inputValue

    #   timePatternsAnalyser = new TimePatternsAnalyser()