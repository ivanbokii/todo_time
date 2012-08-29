#simple slide window implementation with hastables improvement
#the plan
#foreach pattern create hashtable with specific size and 
#then check pattern, go to next pattern

define ['fuzzy_patterns/simple_time', 'fuzzy_patterns/simple_time_modifier',
  'fuzzy_patterns/number_time_modifier', 'duration_patterns/simple_unit'], 
(SimpleTime, SimpleTimeModifier, NumberTimeModifier, DurationSimpleUnitPattern) ->
  class FuzzyPatternsAnalyser
    timePatterns: [
      new SimpleTimeModifier()
      new SimpleTime()
      new NumberTimeModifier()
    ]

    analyse: (tokens, input) ->
      analysedTokens = @_markTimePatternsIn tokens 
      complexDurationResult = @_analyseComplexDuration analysedTokens

      timeResult = null
      durationResult = null

      modifiedInput = input
      if complexDurationResult
        timeResult = complexDurationResult.time
        durationResult = complexDurationResult.duration
        modifiedInput = @_removeParsedFromInput input, complexDurationResult.position, complexDurationResult.length
      else
        timePattern = _.find analysedTokens, (t) -> t.token is 'time_pattern'

        if timePattern isnt undefined
          timeResult = timePattern.value.transform timePattern.raw
          simpleDurationResult = @_analyseSimpleDuration tokens

          modifiedInput = @_removeParsedFromInput input, timePattern.position, timePattern.length
          if simpleDurationResult
            durationResult = simpleDurationResult.duration
            modifiedInput = @_removeParsedFromInput modifiedInput, 
              simpleDurationResult.position - timePattern.length,
              simpleDurationResult.length

      inputResult = @_clean modifiedInput
      {time: timeResult, duration: durationResult, modifiedInput: inputResult}

    _analyseComplexDuration: (tokens) ->
      #map tokens to sequence
      #check index, if yes - analyse
      #if no - return false
      sequence = _.pluck(tokens, 'token').join(' ')
      durationSequence = 'word time_pattern word time_pattern'
      isFound = sequence.indexOf durationSequence
      
      #pattern not found
      if isFound is -1 then return false

      while tokens.length >= 4
        tokensToAnalyse = _.first tokens, 4
        sequence = _.pluck(tokensToAnalyse, 'token').join(' ')
        
        if sequence == durationSequence and tokensToAnalyse[0].raw is 'from' and tokensToAnalyse[2].raw is 'to'
          firstTime = tokensToAnalyse[1].value.transform tokensToAnalyse[1].raw
          secondTime = tokensToAnalyse[3].value.transform tokensToAnalyse[3].raw

          firstHoursAndMinutes = _.map firstTime.split(':'), (r) -> parseInt(r, 10)
          secondHoursAndMinutes = _.map secondTime.split(':'), (r) -> parseInt(r, 10)

          hoursValid = secondHoursAndMinutes[0] >= firstHoursAndMinutes[0]
          minutesValid = secondHoursAndMinutes[0] is firstHoursAndMinutes[0] and secondHoursAndMinutes[1] >
              firstHoursAndMinutes
          unless hoursValid or minutesValid
            return false
          else
            hours = secondHoursAndMinutes[0] - firstHoursAndMinutes[0]
            minutes = secondHoursAndMinutes[1] - firstHoursAndMinutes[1]
            duration = minutes + 60 * hours
            
            return {
              time: firstTime
              duration: duration
              position: tokensToAnalyse[0].position
              length: @_getTokensLength tokensToAnalyse 
            }

        tokens = _.rest tokens

      false

    _analyseSimpleDuration: (tokens) ->
      sequence = _.pluck(tokens, 'token').join(' ')
      durationSequence = 'word number time_unit'
      isFound = sequence.indexOf durationSequence

      #pattern not found
      if isFound is -1 then return false

      while tokens.length >= 3
        tokensToAnalyse = _.first tokens, 3
        sequence = _.pluck(tokensToAnalyse, 'token').join(' ')
        
        if sequence == durationSequence and tokensToAnalyse[0].raw is 'for'
          pattern = new DurationSimpleUnitPattern()

          return {
            duration: pattern.transform (_.rest tokensToAnalyse)
            position: tokensToAnalyse[0].position
            length: @_getTokensLength tokensToAnalyse
          }

        tokens = _.rest tokens

      false

    _markTimePatternsIn: (tokens) ->
      processedTokens = []
      smallestLength = _.chain(@timePatterns).min((tp) -> tp.length).value().length
      biggestLength = _.chain(@timePatterns).max((tp) -> tp.length).value().length

      while tokens.length >= smallestLength
        for pattern in @timePatterns
          tokensToAnalyse = _.first tokens, pattern.length
          sequence = _.map(tokensToAnalyse, (ta) -> ta.token).join(' ')

          if pattern.check(sequence) and pattern.validate(tokensToAnalyse)
            #removing captured pattern from input token. -1 because we use [0] element
            #for new token that gets pushed to processed tokens
            tokens = _.rest tokens, tokensToAnalyse.length - 1
            
            #create new token
            newToken = 
              token: 'time_pattern'
              raw: tokensToAnalyse
              value: pattern
              position: tokensToAnalyse[0].position
              length: @_getTokensLength tokensToAnalyse

            tokens[0] = newToken
            break

        processedTokens.push tokens[0]
        tokens = _.rest tokens

      processedTokens.push tokens
      processedTokens = _.flatten processedTokens
      processedTokens

    _getTokensLength: (tokens) ->
      lastTokenPosition = tokens[tokens.length - 1].position
      lastTokenLength = tokens[tokens.length - 1].length

      lastTokenPosition + lastTokenLength - tokens[0].position

    _removeParsedFromInput: (input, position, length) ->
      substrToRemove = input.slice position, position + length
      input.replace substrToRemove, ''

    _clean: (input) ->
      input = input.replace('at  ', '')

      if input.substring(input.length - 3) is 'at '
        input = _.first(input, input.length - 4).join('')

      input = input.trim()
      input = input.replace('  ', ' ')

      input