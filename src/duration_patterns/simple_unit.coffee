define [], ->
  class SimpleUnitPattern
    sequence: 'number time_unit'

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      true

    transform: (tokens) ->
      time = tokens[0]
      unit = tokens[1].value

      result = time.value
      if unit is 'h' then result *= 60

      result
