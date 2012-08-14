define [], ->
  class SimplePattern
    sequence: 'number'

    check: (sequence) ->
      sequence is @sequence

    validate: (tokens) ->
      true

    transform: (tokens) ->
      tokens[0].value
