define ['time_patterns/simple', 'time_patterns/simple_modifier', 'time_patterns/number', 'time_patterns/number_modifier'], 
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

      result = null
      for pattern in @patterns
        if pattern.check(series) and pattern.validate(tokens)
          result = pattern.transform tokens
          break

      result