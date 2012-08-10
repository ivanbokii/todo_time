window.Token = class Token
  raw: ''
  token: null
  value: null

  constructor: (@inputReader, @token, @checker) ->
    @_readTokenFrom inputReader

  _readTokenFrom: (inputReader) ->
    if @token is 'undef' or @token is 'colon'
      @raw = inputReader.currentChar()
      @value = @raw
      inputReader.nextChar()
      
      return

    if @token is 'end'
      return

    while @checker.call CharChecker, (char = inputReader.currentChar())
      @raw += char
      inputReader.nextChar()

    @value = @raw