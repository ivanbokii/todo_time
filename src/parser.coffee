define [], () ->
  class Parser
    constructor: (@scanner) ->

    parse: ->
      tokens = []
      while (token = @scanner.nextToken()).token isnt 'end'
        tokens.push token

      tokens