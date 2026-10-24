include make/git.mk
include make/kafka.mk
include make/parameters.mk
include make/gh.mk
include make/devorc.mk
include make/kibana.mk

NODE_BIN=./node_modules/.bin
SERVICE_DIR := services

PROTO_FILES := $(shell find proto -name '*.proto')


NODE_PROTO_PATH=./src/contracts/proto
FLUTTER_PROTO_PATH=./lib/contracts/proto

up:
	@echo "🚀 Запуск docker compose (поднимаем все сервисы)..."
	@docker compose up -d
	@echo "✅ Сервисы запущены!"

install:
	@echo "🔧 Инициализация проекта"
	@echo "🔧 Клонирование подмодулей"
	@git submodule foreach --recursive 'git fetch origin' > /dev/null 2>&1
#	@git submodule update --init --recursive > /dev/null 2>&1
	@echo "📦 Проверка .env файлов для всех сервисов..."
	@for service in $(NODE_SERVICES) $(FLUTTER_SERVICES); do \
		ENV_PATH="$(SERVICE_DIR)/$$service/.env"; \
		ENV_EXAMPLE_PATH="$(SERVICE_DIR)/$$service/.env.dist"; \
		if [ ! -f "$$ENV_PATH" ] && [ -f "$$ENV_EXAMPLE_PATH" ]; then \
			echo "[env] Копирую .env для $$service"; \
			cp "$$ENV_EXAMPLE_PATH" "$$ENV_PATH"; \
		fi; \
	done


	for s in $(FRONT_SERVICES); do \
		echo "▶️  Creating env for $$s..."; \
		$(MAKE) -C services/$$s env-generate; \
	done \


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
	@if command -v paplay >/dev/null 2>&1 && [ -f /usr/share/sounds/freedesktop/stereo/complete.oga ]; then \
		paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || true; \
	fi


bipAlert:
	@printf "\a"  # системный сигнал


migrate:
	@echo '🚀 Apply migrations...'
	@if [ -n "$(service)" ]; then \
  		echo "▶️  Running migrations for $(service)..."; \
		docker compose exec -w /usr/src/app/$(SERVICE_DIR)/$(service) $(service) npx prisma migrate dev; \
	else \
		for s in $(PRISMA_SERVICES); do \
			echo "▶️  Running migrations for $$s..."; \
			docker compose exec -w /usr/src/app/$(SERVICE_DIR)/$$s $$s npx prisma migrate dev; \
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
		docker cp ./$(SERVICE_DIR)/$$service/src/infrastructure/db/prisma $(PROJECT_PREFIX)-$$service:/usr/src/app/$(SERVICE_DIR)/$$service; \
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




SHARED_ERRORS_CONTRACTS_PATH=shared/errors/src/contracts/proto

proto-generate:
	@echo '🚀 Proto generate...'

	echo "\033[1;34m[>] Generating proto for @shared/errors...\033[0m";

	rm -rf $(SHARED_ERRORS_CONTRACTS_PATH)
	mkdir -p $(SHARED_ERRORS_CONTRACTS_PATH)

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

	@for dir in $(NODE_SERVICES); do \
		echo "\033[1;33m[*] Checking $$dir...\033[0m"; \
		rm -rf $(SERVICE_DIR)/$$dir/${NODE_PROTO_PATH}; \
		mkdir -p $(SERVICE_DIR)/$$dir/${NODE_PROTO_PATH}; \
	done

ifneq ($(BACK_ONLY),true)
	@for dir in $(FLUTTER_SERVICES); do \
		echo "\033[1;33m[*] Checking $$dir...\033[0m"; \
		rm -rf $(SERVICE_DIR)/$$dir/${FLUTTER_PROTO_PATH}; \
		mkdir -p $(SERVICE_DIR)/$$dir/${FLUTTER_PROTO_PATH}; \
	done
endif


	@for dir in $(NODE_SERVICES); do \
		echo "\033[1;34m[>] Generating proto for $$dir...\033[0m"; \
		pnpm --filter $$dir proto:generate; \
		echo "\033[1;32m[✓] $$dir done\033[0m"; \
	done

ifneq ($(BACK_ONLY),true)
	@for dir in $(FLUTTER_SERVICES); do \
		echo "\033[1;34m[>] Generating proto for $$dir...\033[0m"; \
		protoc \
			--dart_out=$(SERVICE_DIR)/$$dir/${FLUTTER_PROTO_PATH} \
			--proto_path=./proto \
			$(PROTO_FILES); \
		echo "\033[1;32m[✓] $$dir done\033[0m"; \
	done
endif








test:
	@echo "🧪 Запуск тестов"

	@status=0; for service in $(NODE_SERVICES); do \
		echo '🚀 Test' $$service service; \
		docker compose exec -T -w /usr/src/app/services/$$service $$service pnpm test || status=1; \
	done; \
	if [ "$$status" -ne 0 ]; then exit $$status; fi
	@make bip

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

artifacts-drop:
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "tsconfig.tsbuildinfo" -type f -delete

build:
	@read -p "Build with cache? [Y/n] " answer; \
	no_cache=""; \
	if [ "$$answer" = "n" ] || [ "$$answer" = "N" ]; then \
	  	echo 'no cache'; \
		no_cache="--no-cache"; \
	fi; \
	BUILDKIT_PROGRESS=plain docker compose --parallel 4 build $$no_cache  || exit 1;



fix-eof:
	find . \
	   -type d \( \
		  -name .git -o \
		  -name .pnpm-store -o \
		  -name node_modules -o \
		  -name dist \
	   \) -prune -o \
	   -path './services/infra/postgres/data' -prune -o \
	   -path './services/front/.dart_tool' -prune -o \
	   -path './services/front/build' -prune -o \
	   -type f \
	   ! -iname '*.png' \
	   ! -iname '*.jpg' \
	   ! -iname '*.jpeg' \
	   ! -iname '*.gif' \
	   ! -iname '*.webp' \
	   ! -iname '*.ico' \
	   ! -iname '*.bmp' \
	   ! -iname '*.svg' \
	   ! -iname '*.bin' \
	   ! -iname '*.lock' \
	   ! -iname '*.turbo*' \
	   -exec sh -c '\
		  for f do \
			 if [ -s "$$f" ] && [ "$$(tail -c 1 "$$f" | od -An -t x1 | tr -d " ")" != "0a" ]; then \
				printf "\n" >> "$$f"; \
				echo "$$f"; \
			 elif [ -s "$$f" ] && [ "$$(tail -c 2 "$$f" | od -An -t x1 | tr -d " ")" = "0a0a" ]; then \
				perl -0pi -e "s/\\n+$$/\\n/" "$$f"; \
				echo "$$f"; \
			 fi; \
		  done \
   ' sh {} +
