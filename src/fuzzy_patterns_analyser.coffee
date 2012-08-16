#simple slide window implementation with hastables improvement
#the plan
#foreach pattern create hashtable with specific size and 
#then check pattern, go to next pattern

define ['fuzzy_patterns/simple_time', 'fuzzy_patterns/simple_time_modifier',
  'fuzzy_patterns/number_time_modifier'], 
(SimpleTime, SimpleTimeModifier, NumberTimeModifier) ->
  class FuzzyPatternsAnalyser
    timePatterns: [
      new SimpleTimeModifier()
      new SimpleTime()
      new NumberTimeModifier()
    ]

    analyseTime: (tokens) ->
      @tokensVariants = []
      numberOfTokens = tokens.length

      for pattern in @timePatterns
        numberOfTokensInPattern = pattern.length

        continue if numberOfTokens < numberOfTokensInPattern

        @buildTokensVariants tokens, numberOfTokensInPattern
        for tv in @tokensVariants
          if pattern.check(tv.sequence) and pattern.validate(tv.tokens)
            delete @tokensVariants
            return pattern.transform tv.tokens

      null
      
    buildTokensVariants: (tokens, length) ->
      while tokens.length >= length
        sequence = ''
        subTokens = []
        
        for index in [0...length]
          sequence += (tokens[index].token + ' ')
          subTokens.push tokens[index]

        @tokensVariants.push {sequence: sequence.trim(), tokens: subTokens}
        tokens = _.rest tokens
      #search for time first
      # series = _.pluck tokens, 'token'
      # size = series.length
      
      # console.log size

      # result = null
      # for pattern in @patterns
      #   if pattern.check(series) and pattern.validate(tokens)
      #     result = pattern.transform tokens
      #     break

      # result