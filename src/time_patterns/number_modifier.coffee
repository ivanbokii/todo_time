define [], ->
  class NumberModifierTime
    sequence: 'number time_modifier'

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      hoursValid = 0 <= tokens[0].value <= 23

      hoursValid

    transform: (tokens) ->
      hours = tokens[0].value
      timeModifier = tokens[1].value

      if timeModifier is 'am'
        if hours is 12 then hours = hours - 12
      else if timeModifier is 'pm'
        if hours isnt 12 then hours = hours + 12

      hoursValue = hours
      hoursValue = if hoursValue < 10 then '0' + hoursValue else hoursValue

      minutesValue = '00'

      "#{hoursValue}:#{minutesValue}"