window.TimePatternsAnalyser = class TimePatternsAnalyser
  patterns = [
      {
        #at five oclock
        sequence: 'word number word'
        validator: @validate
        transformer: @transform
      }
    ]

  analyse: (tokens) ->
    testPattern = patterns[0]
    types = _.pluck(tokens, 'token').join(' ')
    console.log testPattern.sequence is types

  check: (types, pattern) ->

  validate: (tokens) ->

  transform: (tokens) ->
