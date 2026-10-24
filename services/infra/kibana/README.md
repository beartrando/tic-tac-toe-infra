# Kibana: просмотр логов сервисов

Provisioning Kibana для просмотра логов tic-tac-toe: Data View, дашборд `Battles`
и index templates Elasticsearch. Всё хранится как код, чтобы стенд поднимался
воспроизводимо, а не создавался руками в UI.

## Состав

```
kibana/
├── import.sh                    # импорт saved objects (+ применение index templates)
├── elastic/
│   ├── apply-templates.sh       # идемпотентно применяет index templates в Elasticsearch
│   └── templates/
│       └── service-messages.json
└── saved-objects/
    └── battles.ndjson           # Data View, поиски, визуализации, дашборд
```

## Использование

```bash
make kibana-import                       # из корня infra (KIBANA_URL=http://localhost:5601)
KIBANA_URL=http://host:5601 make kibana-import
```

Скрипт:

1. ждёт, пока Kibana ответит `available` (до 120 секунд);
2. применяет index templates (`ES_URL`, по умолчанию `http://localhost:9200`);
3. удаляет прежние версии объектов `battle-trace` / `Battles` (id фиксированы);
4. импортирует `saved-objects/battles.ndjson` с `overwrite=true`.

Экспорт текущего состояния из Kibana (для обновления NDJSON):

```bash
make kibana-export
```

## Что показывает дашборд `Battles`

Data View `battle-trace` = `service-messages`, time field `@timestamp`.

| панель | что показывает |
|---|---|
| Controls | фильтры `battle_id`, `service`, `transport` |
| Battles timeline | гистограмма событий по времени с разбивкой по `service` |
| Messages | таблица транспортных сообщений: время, сервис, направление, транспорт, канал, `battle_id`, `trace_id`, `span_id`, payload |
| Operations | группировка по `trace_id`: время запроса/ответа и число сообщений одной операции |

## Runtime-поля

В документах `service-messages` нет полей `battle_id` и `transport` верхнего уровня
(они объявлены в mapping, но сервисы их пока не заполняют). Поэтому в Data View
добавлены runtime-поля с другими именами, чтобы не перекрывать mapping:

| runtime-поле | подпись в UI | откуда берётся |
|---|---|---|
| `battleId` | `battle_id` | `payload.battleId`, `payload.id.value`, `payload.move.battleId`, `payload.leave.battleId`, `payload.battle.id` |
| `transportKind` | `transport` | `channel`: `/...` → `grpc`, `ws-...` → `websocket`, строка с пробелом → `http`, иначе `kafka` |

Когда сервисы начнут писать `battle_id`/`transport` в документы, runtime-поля можно
удалить и переключить панели на обычные поля — имена в UI не изменятся.

## Index templates

Шаблоны задают корреляционные поля как `keyword` (иначе динамический mapping делает
`text` + `.keyword`, и агрегации в дашборде ломаются). Шаблон действует только на
новые индексы: существующий индекс нужно пересоздать (в dev данные логов не жалко).

`payload` объявлен как `flattened`, а не `object`: сервисы пишут в него разные формы
(proto-объекты, доменные сущности с value-object'ами, сырые websocket-сообщения), и
при динамическом mapping одно и то же поле получает разные типы — например
`payload.id` как `{"value": "…"}` и как `"…"`. Elasticsearch не может менять тип поля
и отклоняет такие документы целиком (`document_parsing_exception`). `flattened`
индексирует все вложенные значения как keywords и принимает любую форму.

Применить шаблон и пересоздать индекс:

```bash
RECREATE_INDICES=true bash kibana/elastic/apply-templates.sh
```

## Ограничения

- Панель Operations построена по `service-messages` и `trace_id`.
- `trace_id`/`span_id` заполняются из активного OpenTelemetry-спана; по `trace_id`
  можно открыть полный трейс в Grafana Tempo.
- Порты `9200`/`5601` публикуются в локальном `docker-compose.yml`; в `.dist`
  дашборд импортируется внутри сети.
