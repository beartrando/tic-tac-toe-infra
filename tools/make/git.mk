
.PHONY: git-create-prs

GIT_EXTRA_REPOS := \
	make \
	kibana \
	proto \
	services/infra/observability \
	docs/context \
	docs/wiki \
	docs/workflow

GIT_MODULE_REPOS := \
	shared/cache-store \
	shared/errors \
	shared/grpc-client-manager \
	shared/kafka-manager \
	shared/logger \
	shared/pg-boss-manager \
	shared/state-store \
	shared/persistent-logger \
	shared/otel \
	shared/timer

GIT_SERVICE_REPOS = $(addprefix $(SERVICE_DIR)/,$(GIT_SERVICES))

GIT_REPOS = \
    $(GIT_SERVICE_REPOS) \
    $(GIT_EXTRA_REPOS) \
    $(GIT_MODULE_REPOS)

empty :=
space := $(empty) $(empty)

git-print-repos:
	@echo "GIT_SERVICE_REPOS=$(subst $(space),:,$(GIT_SERVICE_REPOS))"
	@echo "GIT_EXTRA_REPOS=$(subst $(space),:,$(GIT_EXTRA_REPOS))"
	@echo "GIT_MODULE_REPOS=$(subst $(space),:,$(GIT_MODULE_REPOS))"

git-commit-and-push-all:
	@echo "🚀 Commit all repos..."
	@make git-commit-all bip=no
	@echo "🚀 Pull all repos..."
	@make git-pull-all bip=no
	@echo "🚀 Push all repos..."
	@make git-push-all bip=no
	@make bip

git-pull-all:
	@failed=0; \
	for dir in $(GIT_REPOS) .; do \
		echo "\033[1;34m[*] Pulling $$dir...\033[0m"; \
		if ! git -C "$$dir" pull; then \
			echo "\033[0;31m[✗] $$dir — pull failed\033[0m"; \
			failed=1; \
		fi; \
	done; \
	if [ "$$failed" -ne 0 ]; then \
		echo "\033[0;31m[✗] Some repositories failed to pull\033[0m"; \
		exit 1; \
	fi; \
	echo "\033[0;32m[✓] All repositories pulled successfully.\033[0m"
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-commit-all:
	git submodule foreach --recursive '\
		git add -A && \
		{ git diff --cached --quiet || git commit -m "$(COMMIT_MSG)"; } \
	'
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-push-all:
	git submodule foreach --recursive '\
		git push \
	'
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi







.PHONY: install-commit-hook

install-commit-hook:
	@set -e; \
	for dir in $(GIT_REPOS) .; do \
		git -C "$$dir" rev-parse --git-dir >/dev/null 2>&1 || continue; \
		hooks_dir=$$(git -C "$$dir" rev-parse --git-path hooks); \
		mkdir -p "$$hooks_dir"; \
		{ \
			printf '%s\n' '#!/bin/sh'; \
			printf '%s\n' 'MSG_FILE="$$1"'; \
			printf '%s\n' 'BRANCH=$$(git symbolic-ref --quiet --short HEAD) || exit 0'; \
			printf '%s\n' 'FIRST_LINE=$$(head -n 1 "$$MSG_FILE")'; \
			printf '%s\n' 'case "$$FIRST_LINE" in "$$BRANCH:"*) exit 0 ;; esac'; \
			printf '%s\n' 'case "$${2:-}" in merge|squash) exit 0 ;; esac'; \
			printf '%s\n' 'sed -i "1s|^|$$BRANCH: |" "$$MSG_FILE"'; \
		} > "$$hooks_dir/prepare-commit-msg"; \
		chmod +x "$$hooks_dir/prepare-commit-msg"; \
		echo "Installed: $$dir"; \
	done





git-check-dev:
	git submodule foreach --recursive '\
		test "$$(git branch --show-current)" = "dev" \
			&& echo "\033[32mdev\033[0m" \
			|| echo "\033[31mnot dev\033[0m"; \
		test -z "$$(git status --porcelain)" \
			&& echo "\033[32mclean\033[0m" \
			|| echo "\033[31mdirty\033[0m"; \
	'

.PHONY: git-list-prs

git-list-prs:
	@for dir in . $(GIT_REPOS); do \
	    printf "\033[0;36m%s:\033[0m\n" "$$dir"; \
	    repo=$$(git -C "$$dir" remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/]([^/]+/[^/.]+)(\.git)?#\1#'); \
	    output=$$(gh pr list --repo "$$repo" \
	        --state open \
	        --json number,title,url \
	        --jq '.[] | "\(.url) \(.title)"' 2>&1); \
	    status=$$?; \
	    printf '%s\n' "$$output"; \
	    if [ "$$status" -ne 0 ]; then \
	        printf "\033[0;31m[✗] Ошибка: %s\033[0m\n" "$$dir"; \
	    fi; \
	done

#
#GREEN := \033[32m
#RED := \033[31m
#RESET := \033[0m
#
#git-check-push-and-switch-dev:
#	@for dir in $(GIT_REPOS); do \
#	    branch=$$(git -C "$$dir" branch --show-current); \
#	    if [ "$$branch" ]; then \
#			if ! git -C "$$dir" diff --quiet || \
#			   ! git -C "$$dir" diff --cached --quiet || \
#			   [ -n "$$(git -C "$$dir" ls-files --others --exclude-standard)" ]; then \
#				echo "$(RED)[✗] $$dir: dirty$(RESET)"; \
#				continue; \
#			fi; \
#			if [ "$$branch" != "dev" ]; then \
#				if ! git -C "$$dir" fetch -q origin || \
#				   ! git -C "$$dir" rev-parse --verify "origin/$$branch" >/dev/null 2>&1 || \
#				   [ "$$(git -C "$$dir" rev-parse HEAD)" != "$$(git -C "$$dir" rev-parse "origin/$$branch")" ]; then \
#					echo "$(RED)[✗] $$dir: not pushed$(RESET)"; \
#					continue; \
#				fi; \
#			fi; \
#	    fi; \
#	    if ! git -C "$$dir" switch -q dev || \
#	       ! git -C "$$dir" pull -q --ff-only origin dev; then \
#	        echo "$(RED)[✗] $$dir: failed to switch/pull dev$(RESET)"; \
#	        continue; \
#	    fi; \
#	    echo "[$(GREEN)✓$(RESET)] $$dir"; \
#	done
#








git-push-base:
	@for dir in $(GIT_BASE); do \
		echo "\033[1;34m[*] Pushing $$dir...\033[0m"; \
		SERVICE_PATH="$$dir"; \
		if [ ! -e "$$SERVICE_PATH/.git" ]; then \
			echo "\033[0;31m[!] Skipping $$dir — not a git repo\033[0m"; \
			continue; \
		fi; \
		cd "$$SERVICE_PATH"; \
		if git push base dev; then \
			echo "\033[0;32m[✓] Pushed $$dir\033[0m"; \
		else \
			echo "\033[0;31m[✗] Failed to push $$dir\033[0m"; \
		fi; \
		cd - > /dev/null; \
	done

	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-pull-base:
	@failed=0; \
	for dir in $(GIT_BASE); do \
		echo "\033[1;34m[*] Pulling $$dir...\033[0m"; \
		if ! git -C "$$dir" pull base dev; then \
			echo "\033[0;31m[✗] $$dir — pull failed\033[0m"; \
			failed=1; \
		fi; \
	done; \
	if [ "$$failed" -ne 0 ]; then \
		echo "\033[0;31m[✗] Some repositories failed to pull\033[0m"; \
		exit 1; \
	fi; \
	echo "\033[0;32m[✓] All repositories pulled successfully.\033[0m"
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

git-merge-dev-to-uat:
	@$(MAKE) git-merge-source-branch-to-target-branch TARGET_BRANCH=uat SOURCE_BRANCH=dev

git-merge-source-branch-to-target-branch:
	@failed=0; \
	TARGET_BRANCH="$(TARGET_BRANCH)"; \
	SOURCE_BRANCH="$(SOURCE_BRANCH)"; \
	for dir in $(GIT_REPOS) .; do \
		SERVICE_PATH="$$dir"; \
		echo "\033[1;34m[*] Merging $$SOURCE_BRANCH -> $$TARGET_BRANCH: $$dir...\033[0m"; \
		if ! git -C "$$SERVICE_PATH" rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
			echo "\033[0;31m[!] $$dir — not a git repo\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		if [ -n "$$(git -C "$$SERVICE_PATH" status --porcelain)" ]; then \
			echo "\033[0;31m[✗] $$dir has uncommitted changes; skipping\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		if ! git -C "$$SERVICE_PATH" checkout "$$SOURCE_BRANCH"; then \
			echo "\033[0;31m[✗] Source branch $$SOURCE_BRANCH not found in $$dir\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		if ! git -C "$$SERVICE_PATH" checkout "$$TARGET_BRANCH"; then \
			echo "\033[1;34m[*] Creating branch $$TARGET_BRANCH from origin or $$SOURCE_BRANCH...\033[0m"; \
			if git -C "$$SERVICE_PATH" show-ref --verify --quiet "refs/remotes/origin/$$TARGET_BRANCH"; then \
				if ! git -C "$$SERVICE_PATH" checkout -b "$$TARGET_BRANCH" "origin/$$TARGET_BRANCH"; then \
					failed=1; \
					continue; \
				fi; \
			else \
				if ! git -C "$$SERVICE_PATH" checkout -b "$$TARGET_BRANCH" "$$SOURCE_BRANCH"; then \
					failed=1; \
					continue; \
				fi; \
			fi; \
		fi; \
		if ! git -C "$$SERVICE_PATH" merge "$$SOURCE_BRANCH"; then \
			echo "\033[0;31m[✗] Merge failed in $$dir; aborting\033[0m"; \
			git -C "$$SERVICE_PATH" merge --abort; \
			git -C "$$SERVICE_PATH" checkout "$$SOURCE_BRANCH"; \
			failed=1; \
			continue; \
		fi; \
		if ! git -C "$$SERVICE_PATH" push -u origin "$$TARGET_BRANCH"; then \
			echo "\033[0;31m[✗] Failed to push $$TARGET_BRANCH in $$dir\033[0m"; \
			git -C "$$SERVICE_PATH" checkout "$$SOURCE_BRANCH"; \
			failed=1; \
			continue; \
		fi; \
		if ! git -C "$$SERVICE_PATH" checkout "$$SOURCE_BRANCH"; then \
			echo "\033[0;31m[✗] Failed to switch back to $$SOURCE_BRANCH in $$dir\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		echo "\033[0;32m[✓] Merged $$SOURCE_BRANCH -> $$TARGET_BRANCH and pushed: $$dir\033[0m"; \
	done; \
	if [ "$$failed" -ne 0 ]; then \
		echo "\033[0;31m[✗] Some repositories failed\033[0m"; \
		exit 1; \
	fi; \
	echo "\033[0;32m[✓] All repositories merged into $$TARGET_BRANCH\033[0m"
	@if [ "$(bip)" != "no" ]; then \
		$(MAKE) bip; \
	fi

.PHONY: git-merge-all

git-merge-all:
	@failed=0; \
	for dir in $(GIT_REPOS) .; do \
		SERVICE_PATH="$$dir"; \
		if ! git -C "$$SERVICE_PATH" rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
			echo "\033[0;31m[!] $$dir — not a git repo\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		current=$$(git -C "$$SERVICE_PATH" branch --show-current 2>/dev/null); \
		if [ -z "$$current" ]; then \
			echo "\033[0;31m[✗] $$dir — detached HEAD, skipping\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		if [ "$$current" = "dev" ]; then \
			echo "\033[0;33m[=] $$dir — already on dev, skipping\033[0m"; \
			continue; \
		fi; \
		if [ -n "$$(git -C "$$SERVICE_PATH" status --porcelain)" ]; then \
			echo "\033[0;31m[✗] $$dir has uncommitted changes; skipping\033[0m"; \
			failed=1; \
			continue; \
		fi; \
		echo "\033[1;34m[*] Merging $$current -> dev: $$dir...\033[0m"; \
		if ! git -C "$$SERVICE_PATH" checkout dev; then \
			if git -C "$$SERVICE_PATH" show-ref --verify --quiet "refs/remotes/origin/dev"; then \
				if ! git -C "$$SERVICE_PATH" checkout -b dev origin/dev; then \
					failed=1; \
					continue; \
				fi; \
			else \
				echo "\033[0;31m[✗] dev branch not found in $$dir\033[0m"; \
				failed=1; \
				git -C "$$SERVICE_PATH" checkout "$$current"; \
				continue; \
			fi; \
		fi; \
		git -C "$$SERVICE_PATH" pull --ff-only origin dev 2>/dev/null || true; \
		if ! git -C "$$SERVICE_PATH" merge "$$current"; then \
			echo "\033[0;31m[✗] Merge failed in $$dir; aborting\033[0m"; \
			git -C "$$SERVICE_PATH" merge --abort; \
			git -C "$$SERVICE_PATH" checkout "$$current"; \
			failed=1; \
			continue; \
		fi; \
		if ! git -C "$$SERVICE_PATH" push -u origin dev; then \
			echo "\033[0;31m[✗] Failed to push dev in $$dir\033[0m"; \
			git -C "$$SERVICE_PATH" checkout "$$current"; \
			failed=1; \
			continue; \
		fi; \
		echo "\033[0;32m[✓] Merged $$current -> dev and pushed: $$dir\033[0m"; \
	done; \
	if [ "$$failed" -ne 0 ]; then \
		echo "\033[0;31m[✗] Some repositories failed\033[0m"; \
		exit 1; \
	fi; \
	echo "\033[0;32m[✓] All repositories merged into dev\033[0m"
