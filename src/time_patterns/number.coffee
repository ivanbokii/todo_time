define [], ->
  class NumberTime
    sequence: 'number'

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      hoursValid = 0 <= tokens[0].value <= 23

      hoursValid

    transform: (tokens) ->
      hoursValue = tokens[0].value
      hoursValue = if hoursValue < 10 then '0' + hoursValue else hoursValue

      minutesValue = '00'

      "#{hoursValue}:#{minutesValue}"