define [], ->
  class NumberTimeModifier
    sequence: 'number time_modifier'
    length: 2

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      hoursValid = 0 <= tokens[0].value <= 23

      hoursValid

    transform: (tokens) ->
      hours = tokens[0].value
      if tokens[1].value is 'pm'
        hours = tokens[0].value + 12

      hoursValue = hours
      hoursValue = if hoursValue < 10 then '0' + hoursValue else hoursValue

      minutesValue = '00'

      "#{hoursValue}:#{minutesValue}"