window.Scanner = class Scanner
  constructor: (@inputReader, @scannerWordsAnalyser) ->
    @currentToken = null
  
  currentToken: ->
    @currentToken

  nextToken: ->
    @currentToken = @_extractToken()
    @currentToken

  _extractToken: ->
    @_skipWhitespaces()
    
    currentChar = @inputReader.currentChar()

    token = null
    if CharChecker.isNumber currentChar
      token = new Token @inputReader, 'number', CharChecker.isNumber
      token.value = parseInt token.value
    
    else if CharChecker.isAlpha currentChar
      token = new Token @inputReader, 'word', CharChecker.isAlpha

      scannerWordsAnalyser.timeModifierCheck token
      scannerWordsAnalyser.wordNumberCheck token
    
    else  if CharChecker.isColon currentChar
      token = new Token @inputReader, 'colon'

    else if currentChar is undefined
      token = new Token @inputReader, 'end'

    else
      token = new Token @inputReader, 'undef'
    
    token

  _skipWhitespaces: ->
    while @inputReader.currentChar() is ' ' then @inputReader.nextChar()