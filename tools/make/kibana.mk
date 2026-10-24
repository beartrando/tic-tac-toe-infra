KIBANA_URL ?= http://localhost:5601
ES_URL ?= http://localhost:9200

.PHONY: kibana-import
kibana-import:
	@echo "📊 Импорт data view и дашборда в Kibana ($(KIBANA_URL))"
	@KIBANA_URL=$(KIBANA_URL) ES_URL=$(ES_URL) ./kibana/import.sh

.PHONY: kibana-templates
kibana-templates:
	@echo "🧩 Применение index templates в Elasticsearch ($(ES_URL))"
	@ES_URL=$(ES_URL) ./kibana/elastic/apply-templates.sh

.PHONY: kibana-export
kibana-export:
	@echo "📤 Экспорт saved objects из Kibana ($(KIBANA_URL))"
	@mkdir -p kibana/saved-objects
	@curl -fsS -X POST "$(KIBANA_URL)/api/saved_objects/_export" \
		-H "kbn-xsrf: true" \
		-H "Content-Type: application/json" \
		-d '{"objects":[{"type":"index-pattern","id":"battle-trace"},{"type":"visualization","id":"battles-controls"},{"type":"visualization","id":"battles-timeline"},{"type":"search","id":"battles-messages"},{"type":"visualization","id":"battles-operations"},{"type":"dashboard","id":"battles"}],"includeReferencesDeep":true}' \
		-o /tmp/ttt-kibana-export.ndjson
	@# последняя строка ответа — служебная сводка экспорта, в NDJSON для импорта она не нужна
	@head -n -1 /tmp/ttt-kibana-export.ndjson > kibana/saved-objects/battles.ndjson
	@rm -f /tmp/ttt-kibana-export.ndjson
	@echo "✅ kibana/saved-objects/battles.ndjson"
