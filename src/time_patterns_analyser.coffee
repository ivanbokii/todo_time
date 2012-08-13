define ['patterns/simple', 'patterns/simple_modifier', 'patterns/number', 'patterns/number_modifier'], 
(Simple, SimpleModifier, NumberTime, NumberModifierTime) ->
  class TimePatternsAnalyser
    patterns: [
        new SimpleModifier()
        new Simple()
        new NumberModifierTime()
        new NumberTime()
      ]

    analyse: (tokens) ->
      series = _.pluck(tokens, 'token').join(' ')

      result = _.pluck(tokens, 'raw').join(' ')
      for pattern in @patterns
        if pattern.check(series) and pattern.validate(tokens)
          result = pattern.transform tokens
          break

      result