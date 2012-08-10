window.InputReader = class InputReader
  constructor: (@input) ->
    @position = 0

  nextChar: ->
    @input[@position++]

  currentChar: ->
    @input[@position]