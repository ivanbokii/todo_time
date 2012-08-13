task :default do
  %x[node r.js -o baseUrl=. name=almond.js include=app.js out=../min/todo_time.js wrap=true optimize=none]
  %x[node r.js -o baseUrl=. name=almond.js include=app.js out=../min/todo_time.min.js wrap=true]
end