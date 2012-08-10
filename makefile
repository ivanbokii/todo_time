SRC=$(wildcard src/*.coffee)
LIB=$(SRC:src/%.coffee=lib/%.js)

lib/%.js: src/%.coffee 
	coffee $< > $@

coffee: $(LIB)