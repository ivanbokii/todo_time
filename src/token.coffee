define ['input_reader', 'char_checker'], (InputReader, CharChecker) ->
  class Token
    raw: ''
    token: null
    value: null
    position: null
    length: null

    constructor: (@inputReader, @token, @checker) ->
      @_readTokenFrom inputReader

    _readTokenFrom: (inputReader) ->
      if @token is 'undef' or @token is 'colon'
        @raw = inputReader.currentChar()
        @value = @raw
        @position = inputReader.position
        @length = 1
        inputReader.nextChar()
        
        return

      if @token is 'end'
        return

      @position = inputReader.position
      while @checker.call CharChecker, (char = inputReader.currentChar())
        @raw += char
        inputReader.nextChar()
      @length = inputReader.position - @position

      @value = @raw