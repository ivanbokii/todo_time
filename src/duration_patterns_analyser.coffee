define ['duration_patterns/simple', 'duration_patterns/simple_unit', 'duration_patterns/complex_unit'], 
(Simple, SimpleUnit, ComplexUnit) ->
  class DurationPatternsAnalyser
    patterns: [
        new ComplexUnit()
        new SimpleUnit()
        new Simple()
      ]

    analyse: (tokens) ->
      series = _.pluck(tokens, 'token').join(' ')

      result = null
      for pattern in @patterns
        if pattern.check(series) and pattern.validate(tokens)
          result = pattern.transform tokens
          break

      result