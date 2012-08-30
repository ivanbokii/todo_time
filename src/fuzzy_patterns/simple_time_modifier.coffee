define [], ->
  class SimpleTimeModifier
    sequence: 'number colon number time_modifier'
    length: 4

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      hoursValid = 0 <= tokens[0].value <= 23
      minutesValid = 0 <= tokens[2].value <= 59

      hoursValid and minutesValid

    transform: (tokens) ->
      hours = tokens[0].value
      timeModifier = tokens[3].value

      if timeModifier is 'am'
        if hours is 12 then hours = hours - 12
      else if timeModifier is 'pm'
        if hours isnt 12 then hours = hours + 12

      hoursValue = hours
      hoursValue = if hoursValue < 10 then '0' + hoursValue else hoursValue

      minutesValue = tokens[2].value
      minutesValue = if minutesValue < 10 then '0' + minutesValue else minutesValue

      "#{hoursValue}:#{minutesValue}"
