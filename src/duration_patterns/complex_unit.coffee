define [], ->
  class ComplexUnitPattern
    sequence: 'number time_unit number time_unit'

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      true

    transform: (tokens) ->
      first = @_calculate tokens[0].value, tokens[1].value
      second = @_calculate tokens[2].value, tokens[3].value

      first + second

    _calculate: (value, unit) ->
      result = value
      if unit is 'h' then result *= 60

      result