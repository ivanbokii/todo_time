$(document).ready ->
  $(".parse").click ->
    inputValue = $(".input").val()

    window.charChecker = new CharChecker()    
    window.inputReader = new InputReader inputValue
    window.scannerWordsAnalyser = new ScannerWordsAnalyser()
    window.scanner = new Scanner inputReader, scannerWordsAnalyser
    
    window.parser = new Parser scanner
    result = parser.parse()

    pattersnAnalyser = new TimePatternsAnalyser()
    pattersnAnalyser.analyse result
