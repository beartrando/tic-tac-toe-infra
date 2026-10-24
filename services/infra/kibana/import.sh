#!/usr/bin/env bash
# Импортирует Data View и дашборд Battles в Kibana.
#
# Переменные окружения:
#   KIBANA_URL       — адрес Kibana (по умолчанию http://localhost:5601)
#   ES_URL           — адрес Elasticsearch для index templates (по умолчанию http://localhost:9200)
#   SKIP_TEMPLATES   — true: не применять index templates
#   RECREATE_INDICES — true: пересоздать индексы логов (см. apply-templates.sh)
set -euo pipefail

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
ES_URL="${ES_URL:-http://localhost:9200}"
KIBANA_USER="${KIBANA_USER:-elastic}"
KIBANA_PASS="${KIBANA_PASS:-${ELASTIC_PASSWORD:-changeme}}"
ES_USER="${ES_USER:-elastic}"
ES_PASS="${ES_PASS:-${ELASTIC_PASSWORD:-changeme}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NDJSON="$SCRIPT_DIR/saved-objects/battles.ndjson"

if [ ! -f "$NDJSON" ]; then
    echo "❌ нет файла: $NDJSON" >&2
    exit 1
fi

echo "⏳ Ожидание Kibana ($KIBANA_URL)..."
ready="false"
for _ in $(seq 1 60); do
    if curl -fsS -u "${KIBANA_USER}:${KIBANA_PASS}" "$KIBANA_URL/api/status" 2>/dev/null | grep -q '"level":"available"'; then
        ready="true"
        break
    fi
    sleep 2
done
if [ "$ready" != "true" ]; then
    echo "❌ Kibana не поднялась за 120 секунд: $KIBANA_URL" >&2
    exit 1
fi

if [ "${SKIP_TEMPLATES:-false}" != "true" ]; then
    ES_URL="$ES_URL" ES_USER="$ES_USER" ES_PASS="$ES_PASS" "$SCRIPT_DIR/elastic/apply-templates.sh"
fi

# Удаляем прежние версии объектов с теми же id (в т.ч. старые типы):
# import с overwrite=true не убирает объект, если у него изменился type.
legacy_objects=(
    "dashboard:battles"
    "visualization:battles-controls"
    "visualization:battles-timeline"
    "visualization:battles-operations"
    "search:battles-operations"
    "visualization:battles-pairs"
    "search:battles-messages"
    "index-pattern:battle-trace"
)
for object in "${legacy_objects[@]}"; do
    type="${object%%:*}"
    id="${object#*:}"
    curl -sS -u "${KIBANA_USER}:${KIBANA_PASS}" -o /dev/null -X DELETE "$KIBANA_URL/api/saved_objects/$type/$id" \
        -H "kbn-xsrf: true" || true
done

echo "📥 Импорт saved objects: $NDJSON"
response="$(curl -fsS -u "${KIBANA_USER}:${KIBANA_PASS}" -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
    -H "kbn-xsrf: true" \
    -F "file=@$NDJSON")"

if ! printf '%s' "$response" | grep -q '"success":true'; then
    echo "❌ Импорт завершился с ошибками: $response" >&2
    exit 1
fi

echo "✅ Data View battle-trace и дашборд Battles импортированы"
echo "👉 Открой: $KIBANA_URL/app/dashboards#/view/battles"
