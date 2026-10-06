CONTEXT_DIR := context
CONTEXT_NAME := CONTEXT
EXCLUDED_DIRS := services/postgres services/pgbouncer

.PHONY: context-init context-apply context-capture context-drop

context-init:
	@if find . \
		$(foreach dir,$(EXCLUDED_DIRS),-path './$(dir)' -prune -o) \
		-path './$(CONTEXT_DIR)' -prune -o \
		-type d -name '$(CONTEXT_NAME)' -print -quit | grep -q .; then \
		echo "ERROR: CONTEXT directory already exists in the project."; \
		echo "context-init is allowed only for initial setup."; \
		exit 1; \
	fi
	@find $(CONTEXT_DIR) -type d -name '$(CONTEXT_NAME)' -print | while read -r dir; do \
		target="$${dir#$(CONTEXT_DIR)/}"; \
		mkdir -p "$$(dirname "$$target")"; \
		cp -R "$$dir" "$$target"; \
	done

context-capture:
	@find . \
		$(foreach dir,$(EXCLUDED_DIRS),-path './$(dir)' -prune -o) \
		-path './$(CONTEXT_DIR)' -prune -o \
		-type d -name '$(CONTEXT_NAME)' -print \
		-exec sh -c ' \
			for dir do \
				target="$(CONTEXT_DIR)/$${dir#./}"; \
				mkdir -p "$$target"; \
				cp -R "$$dir"/. "$$target"/; \
			done \
		' sh {} +

context-drop:
	@dirs="$$(find . \
		$(foreach dir,$(EXCLUDED_DIRS),-path './$(dir)' -prune -o) \
		-path './$(CONTEXT_DIR)' -prune -o \
		-type d -name '$(CONTEXT_NAME)' -print)"; \
	if [ -z "$$dirs" ]; then \
		echo "No CONTEXT directories found."; \
		exit 0; \
	fi; \
	echo "CONTEXT directories:"; \
	echo "$$dirs"; \
	echo; \
	printf "Delete all listed CONTEXT directories? [y/N] "; \
	read answer; \
	case "$$answer" in \
		y|Y|yes|YES) \
			echo "$$dirs" | while IFS= read -r dir; do \
				rm -rf "$$dir"; \
			done; \
			echo "CONTEXT directories deleted."; \
			;; \
		*) \
			echo "Aborted."; \
			exit 1; \
			;; \
	esac
