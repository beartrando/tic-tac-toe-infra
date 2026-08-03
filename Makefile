include make/parameters.mk
include make/kafka.mk
include make/front.mk
include make/terminal.mk

NODE_BIN=./node_modules/.bin
SERVICE_DIR := services

PROTO_FILES := $(shell find proto -name '*.proto')


NODE_PROTO_PATH=./src/contracts/proto
FLUTTER_PROTO_PATH=./lib/src/grpc/generated

up:
	@echo "🚀 Запуск docker compose (поднимаем все сервисы)..."
	@docker compose up -d
	@echo "✅ Сервисы запущены!"

install:
	@echo "🔧 Инициализация проекта"
	@echo "🔧 Клонирование подмодулей"
	@git submodule update --init --recursive > /dev/null 2>&1
	@echo "📦 Проверка .env файлов для всех сервисов..."
	@for service in $(NODE_SERVICES) $(FLUTTER_SERVICES); do \
		ENV_PATH="$(SERVICE_DIR)/$$service/.env"; \
		ENV_EXAMPLE_PATH="$(SERVICE_DIR)/$$service/.env.dist"; \
		if [ ! -f "$$ENV_PATH" ] && [ -f "$$ENV_EXAMPLE_PATH" ]; then \
			echo "[env] Копирую .env для $$service"; \
			cp "$$ENV_EXAMPLE_PATH" "$$ENV_PATH"; \
		fi; \
	done
	@if [ ! -f "docker-compose.yml" ] && [ -f "docker-compose.yml.dist" ]; then \
        echo "[env] Создаю docker-compose.yml из docker-compose.yml.dist"; \
        cp docker-compose.yml.dist docker-compose.yml; \
    fi
	@make proto-generate bip=no
	@make reset

install-deploy:
	@echo "🔧 Инициализация проекта"
	@echo "🔧 Клонирование подмодулей"
	@git submodule update --init --recursive > /dev/null 2>&1
	@echo "📦 Проверка .env файлов для всех сервисов..."
	@for service in $(NODE_SERVICES) $(FLUTTER_SERVICES); do \
		ENV_PATH="$(SERVICE_DIR)/.env.$$service"; \
		ENV_EXAMPLE_PATH="$(SERVICE_DIR)/$$service/.env.dist"; \
		if [ ! -f "$$ENV_PATH" ] && [ -f "$$ENV_EXAMPLE_PATH" ]; then \
			echo "[env] Копирую .env для $$service"; \
			cp "$$ENV_EXAMPLE_PATH" "$$ENV_PATH"; \
		fi; \
	done
	@if [ ! -f "docker-compose.yml" ] && [ -f "docker-compose.yml.dist" ]; then \
        echo "[env] Создаю docker-compose.yml из docker-compose.yml.deploy.dist"; \
        cp docker-compose.yml.deploy.dist docker-compose.yml; \
    fi
	@make proto-generate bip=no
	@make reset

bip:
	@paplay /usr/share/sounds/freedesktop/stereo/complete.oga


bipAlert:
	@printf "\a"  # системный сигнал


migrate:
	@echo '🚀 Apply migrations...'
	@if [ -n "$(service)" ]; then \
  		echo "▶️  Running migrations for $(service)..."; \
		docker compose exec -T -w /usr/src/app/$(SERVICE_DIR)/$(service) $(service) npx prisma migrate dev; \
	else \
		for s in $(PRISMA_SERVICES); do \
			echo "▶️  Running migrations for $$s..."; \
			docker compose exec -T -w /usr/src/app/$(SERVICE_DIR)/$$s $$s npx prisma migrate dev; \
		done \
	fi
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi


prod-migrate:
	for service in $(PRISMA_SERVICES); do \
        echo "▶️  Running migrations for $$service..."; \
        docker run --rm \
            --env-file ./services/.env.$$service \
            --network game_backend \
            ghcr.io/temenb/$$service/predeploy:dev; \
    done

prisma-generate:
	@echo '🚀 Generating Prisma clients...'
	@for service in $(PRISMA_SERVICES); do \
		echo '🚀 Generating' $$service 'Prisma client...' && \
		docker cp ./$(SERVICE_DIR)/$$service/prisma ttt-$$service:/usr/src/app/$(SERVICE_DIR)/$$service; \
		docker compose exec -T -w /usr/src/app/services/$$service $$service npx prisma generate; \
	done
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

reset:
	docker stop $$(docker ps -aq) || true
	docker rm $$(docker ps -aq) || true
	docker volume rm $$(docker volume ls -q) || true
	docker compose up -d
	@make migrate bip=no
	docker stop $$(docker ps -aq) || true
	docker rm $$(docker ps -aq) || true
	docker compose up -d
	@make bip


seed:
	@echo "🌱 Запуск сидов"
	@for service in $(PRISMA_SERVICES); do \
		docker compose exec -T -w /usr/src/app/services/$$service $$service npx ts-node src/seed/seed.ts; \
	done
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-commit-and-push-all:
	@echo "🚀 Commit all repos..."
	@make git-commit-all bip=no
	@echo "🚀 Push all repos..."
	@make git-push-all bip=no
	@make bip

git-commit-all:
	@for dir in $(GIT_SERVICES); do \
		echo "\033[1;33m[*] Checking $$dir...\033[0m"; \
		SERVICE_PATH="$(SERVICE_DIR)/$$dir"; \
		if [ ! -e "$$SERVICE_PATH/.git" ]; then \
			echo "\033[0;31m[!] Skipping $$dir — not a git repo\033[0m"; \
			continue; \
		fi; \
		cd "$$SERVICE_PATH"; \
		if [ -z "$$(git status --porcelain)" ]; then \
			echo "\033[1;33m[-] No changes in $$dir\033[0m"; \
		else \
			git add . && \
			git commit -am "$(COMMIT_MSG)" && \
			echo "\033[0;32m[✓] Committed changes in $$dir\033[0m"; \
		fi; \
		cd - > /dev/null; \
	done \

	@echo "\033[1;33m[*] Checking proto...\033[0m"; \
	cd proto; \
	if [ -z "$$(git status --porcelain)" ]; then \
		echo "\033[1;33m[-] No changes in proto\033[0m"; \
	else \
		git add . && \
		git commit -am "$(COMMIT_MSG)" && \
		echo "\033[0;32m[✓] Commited changes in proto\033[0m"; \
	fi;
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

	@echo "\033[1;33m[*] Checking monorepo...\033[0m"; \
	if [ -z "$$(git status --porcelain)" ]; then \
		echo "\033[1;33m[-] No changes in monorepo\033[0m"; \
	else \
		git add . && \
		git commit -am "$(COMMIT_MSG)" && \
		echo "\033[0;32m[✓] Commited changes in monorepo\033[0m"; \
	fi;
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi


git-push-all:
	@for dir in $(GIT_SERVICES); do \
		echo "\033[1;34m[*] Pushing $$dir...\033[0m"; \
		SERVICE_PATH="$(SERVICE_DIR)/$$dir"; \
		cd "$$SERVICE_PATH"; \
		if git push; then \
			echo "\033[0;32m[✓] Pushed $$dir\033[0m"; \
		else \
			echo "\033[0;31m[✗] Failed to push $$dir\033[0m"; \
		fi; \
		cd - > /dev/null; \
	done

	@echo "\033[1;34m[*] Pushing proto...\033[0m"
	cd proto; \
	if git push; then \
		echo "\033[0;32m[✓] Pushed proto\033[0m"; \
	else \
		echo "\033[0;31m[✗] Failed to push proto\033[0m"; \
	fi
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

	@echo "\033[1;34m[*] Pushing monorepo...\033[0m"
	if git push; then \
		echo "\033[0;32m[✓] Pushed monorepo\033[0m"; \
	else \
		echo "\033[0;31m[✗] Failed to push monorepo\033[0m"; \
	fi
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi



SHARED_ERRORS_CONTRACTS_PATH=shared/errors/src/contracts/proto

proto-generate:
	@echo '🚀 Proto generate...'

	@for dir in $(NODE_SERVICES); do \
		echo "\033[1;33m[*] Checking $$dir...\033[0m"; \
		rm -rf $(SERVICE_DIR)/$$dir/${NODE_PROTO_PATH}; \
		mkdir -p $(SERVICE_DIR)/$$dir/${NODE_PROTO_PATH}; \
	done

	rm -rf $(SHARED_ERRORS_CONTRACTS_PATH)
	mkdir -p $(SHARED_ERRORS_CONTRACTS_PATH)

	@for dir in $(FLUTTER_SERVICES); do \
		echo "\033[1;33m[*] Checking $$dir...\033[0m"; \
		rm -rf $(SERVICE_DIR)/$$dir/${FLUTTER_PROTO_PATH}; \
		mkdir -p $(SERVICE_DIR)/$$dir/${FLUTTER_PROTO_PATH}; \
	done

	@for dir in $(NODE_SERVICES); do \
		echo "\033[1;34m[>] Generating proto for $$dir...\033[0m"; \
		pnpm --filter $$dir proto:generate; \
		echo "\033[1;32m[✓] $$dir done\033[0m"; \
	done

	@for dir in $(FLUTTER_SERVICES); do \
		echo "\033[1;34m[>] Generating proto for $$dir...\033[0m"; \
		protoc \
			--dart_out=$(SERVICE_DIR)/$$dir/${FLUTTER_PROTO_PATH} \
			--proto_path=./proto \
			$(PROTO_FILES); \
		echo "\033[1;32m[✓] $$dir done\033[0m"; \
	done

	echo "\033[1;34m[>] Generating proto for @shared/errors...\033[0m";
	protoc \
		--plugin=./node_modules/.bin/protoc-gen-ts_proto \
		--ts_proto_out=$(SHARED_ERRORS_CONTRACTS_PATH) \
		--ts_proto_opt=esModuleInterop=true,outputServices=none \
		--proto_path=./proto \
		./proto/common/error.proto;
	echo "\033[1;32m[✓] @shared/errors done\033[0m";
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi








test:
	@echo "🧪 Запуск тестов"

	@for service in $(NODE_SERVICES); do \
		echo '🚀 Test' $$service service && \
		docker compose exec -T -w /usr/src/app/services/$$service $$service pnpm test; \
	done
	@make bip

tmux:
	tmux new-session -d -s logs
	tmux send-keys -t logs:0 'docker compose logs -f streaming | lnav -t ' C-m
	tmux split-window -h -t logs:0
	tmux send-keys -t logs:0.1 'docker compose logs -f battle | lnav -t ' C-m
	tmux split-window -v -t logs:0.1
	tmux send-keys -t logs:0.2 'docker compose logs -f engine | lnav -t ' C-m
	tmux split-window -v -t logs:0.0
	tmux select-pane -t logs:0.1
	tmux attach -t logs

healthloop:
	@echo "▶ Starting health loop..."
	@while true; do \
		now=$$(date '+%Y-%m-%d %H:%M:%S'); \
		response=$$(curl -s http://127.0.0.1:9090/gateway/health); \
		if echo "$$response" | grep -q '"status":1'; then \
			echo "$$now ✅ Services healthy"; \
		else \
			echo "$$now ❌ Not healthy"; \
			echo "$$response" \
				| grep -oE '"[a-zA-Z0-9_-]+":2' \
				| sed 's/"//g' \
				| cut -d: -f1 \
				| sed 's/^/❌ /'; \
			$(MAKE) bip; \
		fi; \
		sleep 5; \
	done

battles-clear:
	docker compose exec postgres psql -U postgres -d battle -c "TRUNCATE TABLE battles CASCADE;"

reset-db:
	docker compose down postgres
	docker volume rm game_postgres_data
	docker compose up postgres -d
	@make migrate

reset-kafka:
	docker compose down kafka
	docker volume rm game_kafka_data
	docker compose up kafka -d
	@make migrate

battles-drop:
	dc exec postgres dropdb -U postgres battle





BATTLE_ID := e9034cbf-30fb-42ee-8bed-40218b6ac9f3

kafka-connect-bot:
	echo '{"battleId":"$(BATTLE_ID)"}' | \
    docker compose exec -T kafka \
        /opt/kafka/bin/kafka-console-producer.sh \
        --bootstrap-server localhost:9092 \
        --topic bot.connecting-request

artifacts-drop:
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "tsconfig.tsbuildinfo" -type f -delete

build:
	@for service in $(NODE_SERVICES); do \
		BUILDKIT_PROGRESS=plain docker compose build "$$service" || exit 1; \
	done
