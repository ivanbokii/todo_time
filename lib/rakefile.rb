task :default do
  %x[coffee -c -o ./ ../src/]

  %x[node vendor/r.js -o baseUrl=. name=vendor/almond.js include=app.js out=../min/todo_time.js wrap=true optimize=none]
  %x[node vendor/r.js -o baseUrl=. name=vendor/almond.js include=app.js out=../min/todo_time.min.js wrap=true]
end