# Wiki

## Project Workflow (brief)

### Infrastructure
- **Kafka** — event messaging (battle events, user.created)
- **PostgreSQL + pgbouncer** — relational database
- **Redis** — caching for battle state
- **gRPC** — inter-service communication
- **HTTP Gateway** — external API entry point

### Core Services & Flow
1. **Gateway** (`services/gateway`) — HTTP entry point that proxies requests via gRPC to Engine
2. **Engine** (`services/engine`) — core game logic: battle creation/moves/timeouts, Redis cache, Kafka consumers, timed callbacks, Prisma persistence
3. **Message pipeline**: producers → Kafka → consumers (BattleMatchedConsumer, job service)
4. **Orchestration** — coordinates between services
5. Other services: auth, bot, battle, streaming, profile, front (Flutter)

### Development (make targets)
- `make up` — start all Docker services
- `make install` — init .env, generate proto contracts  
- `make migrate` — run database migrations
- `make test` — run tests across services
- `make reset` — full rebuild/restart
