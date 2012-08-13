define [], ->

  class CharChecker
    @numberReg = /^[0-9]$/
    @alphaReg = /^[A-Za-z]$/

    @isNumber: (char) ->
      @numberReg.test char

    @isAlpha: (char) ->
      @alphaReg.test char

    @isColon: (char) ->
      char is ':'