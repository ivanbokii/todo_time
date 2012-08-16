define [], ->
  class SimpleTime
    sequence: 'number colon number'
    length: 3

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      hoursValid = 0 <= tokens[0].value <= 23
      minutesValid = 0 <= tokens[2].value <= 59

      hoursValid and minutesValid

    transform: (tokens) ->
      hoursValue = tokens[0].value
      hoursValue = if hoursValue < 10 then '0' + hoursValue else hoursValue

      minutesValue = tokens[2].value
      minutesValue = if minutesValue < 10 then '0' + minutesValue else minutesValue

      "#{hoursValue}:#{minutesValue}"