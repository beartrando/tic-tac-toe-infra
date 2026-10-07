# репозитории вне services/*, но внутри монорепы (сабмодули)
GIT_EXTRA_REPOS := proto context wiki \
	shared/logger \
	shared/errors \
	shared/kafka-manager \
	shared/grpc-client-manager \
	shared/pg-boss-manager

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
	done

	@for dir in $(GIT_EXTRA_REPOS); do \
		echo "\033[1;33m[*] Checking $$dir...\033[0m"; \
		if [ ! -e "$$dir/.git" ]; then \
			echo "\033[0;31m[!] Skipping $$dir — not a git repo\033[0m"; \
			continue; \
		fi; \
		cd "$$dir"; \
		if [ -z "$$(git status --porcelain)" ]; then \
			echo "\033[1;33m[-] No changes in $$dir\033[0m"; \
		else \
			git add . && \
			git commit -am "$(COMMIT_MSG)" && \
			echo "\033[0;32m[✓] Committed changes in $$dir\033[0m"; \
		fi; \
		cd - > /dev/null; \
	done

	@echo "\033[1;33m[*] Checking monorepo...\033[0m"; \
	if [ -z "$$(git status --porcelain)" ]; then \
		echo "\033[1;33m[-] No changes in monorepo\033[0m"; \
	else \
		git add . && \
		git commit -am "$(COMMIT_MSG)" && \
		echo "\033[0;32m[✓] Committed changes in monorepo\033[0m"; \
	fi
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-push-all:
	@echo "\033[1;34m[*] Pushing monorepo...\033[0m"; \
	if git push; then \
		echo "\033[0;32m[✓] Pushed monorepo\033[0m"; \
	else \
		echo "\033[0;31m[✗] Failed to push monorepo\033[0m"; \
	fi

	@for dir in $(GIT_SERVICES); do \
		echo "\033[1;34m[*] Pushing $$dir...\033[0m"; \
		SERVICE_PATH="$(SERVICE_DIR)/$$dir"; \
		if [ ! -e "$$SERVICE_PATH/.git" ]; then \
			echo "\033[0;31m[!] Skipping $$dir — not a git repo\033[0m"; \
			continue; \
		fi; \
		cd "$$SERVICE_PATH"; \
		if git push; then \
			echo "\033[0;32m[✓] Pushed $$dir\033[0m"; \
		else \
			echo "\033[0;31m[✗] Failed to push $$dir\033[0m"; \
		fi; \
		cd - > /dev/null; \
	done

	@for dir in $(GIT_EXTRA_REPOS); do \
		echo "\033[1;34m[*] Pushing $$dir...\033[0m"; \
		if [ ! -e "$$dir/.git" ]; then \
			echo "\033[0;31m[!] Skipping $$dir — not a git repo\033[0m"; \
			continue; \
		fi; \
		cd "$$dir"; \
		if git push; then \
			echo "\033[0;32m[✓] Pushed $$dir\033[0m"; \
		else \
			echo "\033[0;31m[✗] Failed to push $$dir\033[0m"; \
		fi; \
		cd - > /dev/null; \
	done

	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-pull-all:
	@failed=0; \
	echo "\033[1;34m[*] Checking monorepo...\033[0m"; \
	if [ -n "$$(git status --porcelain --ignore-submodules=all)" ]; then \
		echo "\033[0;31m[✗] Monorepo has uncommitted changes\033[0m"; \
		failed=1; \
	else \
		echo "\033[0;32m[✓] Monorepo is clean\033[0m"; \
	fi; \
	\
	for dir in $(GIT_SERVICES); do \
		echo "\033[1;34m[*] Checking $$dir...\033[0m"; \
		SERVICE_PATH="$(SERVICE_DIR)/$$dir"; \
		if ! git -C "$$SERVICE_PATH" rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
			echo "\033[0;31m[!] $$dir — not a git repo\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		if [ -n "$$(git -C "$$SERVICE_PATH" status --porcelain)" ]; then \
			echo "\033[0;31m[✗] $$dir has uncommitted changes\033[0m"; \
			failed=1; \
		else \
			echo "\033[0;32m[✓] $$dir is clean\033[0m"; \
		fi; \
	done; \
	\
	for dir in $(GIT_EXTRA_REPOS); do \
		echo "\033[1;34m[*] Checking $$dir...\033[0m"; \
		if ! git -C "$$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
			echo "\033[0;31m[!] $$dir — not a git repo\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		if [ -n "$$(git -C "$$dir" status --porcelain)" ]; then \
			echo "\033[0;31m[✗] $$dir has uncommitted changes\033[0m"; \
			failed=1; \
		else \
			echo "\033[0;32m[✓] $$dir is clean\033[0m"; \
		fi; \
	done; \
	\
	if [ "$$failed" -ne 0 ]; then \
		echo "\033[0;31m[✗] Pull aborted — some repositories have changes.\033[0m"; \
		exit 1; \
	fi; \
	\
	echo "\033[1;34m[*] All repositories are clean. Pulling dev...\033[0m"; \
	\
	echo "\033[1;34m[*] Pulling monorepo...\033[0m"; \
	git checkout dev && git pull origin dev || exit 1; \
	\
	for dir in $(GIT_SERVICES); do \
		SERVICE_PATH="$(SERVICE_DIR)/$$dir"; \
		echo "\033[1;34m[*] Pulling $$dir...\033[0m"; \
		git -C "$$SERVICE_PATH" checkout dev && \
		git -C "$$SERVICE_PATH" pull origin dev || exit 1; \
	done; \
	\
	for dir in $(GIT_EXTRA_REPOS); do \
		echo "\033[1;34m[*] Pulling $$dir...\033[0m"; \
		git -C "$$dir" checkout dev && \
		git -C "$$dir" pull origin dev || exit 1; \
	done; \
	\
	echo "\033[0;32m[✓] All repositories pulled successfully.\033[0m"

