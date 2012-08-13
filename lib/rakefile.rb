task :default do
  exec 'node r.js -o baseUrl=. name=almond.js include=app.js out=../min/todo_time.js wrap=true optimize=none'
end