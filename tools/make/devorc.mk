devorc:
	docker compose exec -it -w /usr/src/app devorc pnpm --dir services/devorc cli

#devorc-health:
#	@curl -s http://localhost:9091/health | jq .
#
##devorc-issue-create:
##	@read -p "Enter issue title: " title; \
##	curl -s -X POST http://localhost:9091/devorc/issue/create \
##		-H 'Content-Type: application/json' \
##		-d "$$(jq -n --arg title "$$title" '{title: $$title}')" | jq .
##
##devorc-issue-flush:
##	@curl -s -X POST http://localhost:9091/devorc/issue/flush | jq .
#
#devorc-issue-select:
#	@read -p "Enter issue Id: " id; \
#	curl -s -X POST http://localhost:9091/devorc/issue/select \
#		-H 'Content-Type: application/json' \
#		-d "$$(jq -n --arg id "$$id" '{id: $$id}')" | jq .
#
#devorc-pull:
#	@curl -s -X POST http://localhost:9091/devorc/pull | jq .
#
#devorc-push:
#	@curl -s -X POST http://localhost:9091/devorc/push | jq .
#
#devorc-park:
#	@curl -s -X POST http://localhost:9091/devorc/park | jq .
#
#devorc-refresh-status:
#	@curl -s -X POST http://localhost:9091/devorc/refresh-status | jq .
