#!/bin/bash
echo "👀 Слідкую за всіма ресурсами..."
while true; do
  inotifywait -r -e modify,create,delete \
    src/main/resources/templates/ \
    src/main/resources/static/ && \
  echo "📝 Виявлено зміни..." && \
  cp -r src/main/resources/templates/* target/classes/templates/ 2>/dev/null
  cp -r src/main/resources/static/* target/classes/static/ 2>/dev/null
  echo "✅ Оновлено!"
  sleep 1
done
