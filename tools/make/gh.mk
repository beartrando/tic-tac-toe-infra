GH_OWNER := beartrando
GH_COLLABORATOR := temenb

.PHONY: repo-create

repo-create:
	@if [ -z "$(NAME)" ]; then \
		echo "Usage: make repo-create NAME=<repository>"; \
		exit 1; \
	fi
	@gh repo create $(GH_OWNER)/$(NAME) --public
	@gh api --method PUT \
		-H "Accept: application/vnd.github+json" \
		"/repos/$(GH_OWNER)/$(NAME)/collaborators/$(GH_COLLABORATOR)" \
		-f permission=push >/dev/null
	@gh api --method PATCH \
		-H "Accept: application/vnd.github+json" \
		"/repos/$(GH_OWNER)/$(NAME)" \
		-F delete_branch_on_merge=true >/dev/null
	@echo ""
	@echo "Invitation:"
	@gh api \
		-H "Accept: application/vnd.github+json" \
		"/repos/$(GH_OWNER)/$(NAME)/invitations" \
		--jq '.[] | select(.invitee.login == "$(GH_COLLABORATOR)") | .html_url'

#git-protect-branches:
#	@for dir in $(GIT_REPOS); do \
#	    repo=$$(git -C "$$dir" remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/]([^/]+/[^/.]+)(\.git)?#\1#'); \
#	    if [ -z "$$repo" ]; then \
#	        echo "$(RED)[✗] $$dir: cannot determine repository$(RESET)"; \
#	        continue; \
#	    fi; \
#	    for branch in dev uat prod; do \
#	        if ! gh api "repos/$$repo/branches/$$branch" >/dev/null 2>&1; then \
#	            echo "$(RED)[✗] $$repo: $$branch not found$(RESET)"; \
#	            continue; \
#	        fi; \
#	        output=$$(gh api \
#	            --method PUT \
#	            "repos/$$repo/branches/$$branch/protection" \
#	            -H "Accept: application/vnd.github+json" \
#	            -f 'required_status_checks=null' \
#	            -F 'enforce_admins=true' \
#	            -f 'required_pull_request_reviews[required_approving_review_count]=0' \
#	            -F 'allow_force_pushes=false' \
#	            -F 'allow_deletions=false' \
#	            -F 'required_conversation_resolution=true' 2>&1); \
#	        status=$$?; \
#	        if [ "$$status" -eq 0 ]; then \
#	            echo "[$(GREEN)✓$(RESET)] $$repo: $$branch"; \
#	        else \
#	            echo "$(RED)[✗] $$repo: $$branch — $$output$(RESET)"; \
#	        fi; \
#	    done; \
#	done
