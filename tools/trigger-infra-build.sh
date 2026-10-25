#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_PREFIX="tic-tac-toe"
GITHUB_ORG="beartrando"

SERVICES=(
  auth
#  gateway
#  profile
#  bot
#  battle
#  engine
#  matchmaking
#  orchestration
#  streaming
)

: "${GH_PAT:?Set GH_PAT environment variable}"

ROOT="$(git rev-parse --show-toplevel)"
INFRA_REPO="${GITHUB_ORG}/${PROJECT_PREFIX}-infra"

for SERVICE in "${SERVICES[@]}"; do
  REPO_NAME="${PROJECT_PREFIX}-${SERVICE}"
  REPO_PATH="${ROOT}/services/${SERVICE}"

  if [[ ! -d "$REPO_PATH/.git" && ! -f "$REPO_PATH/.git" ]]; then
    echo "SKIP $SERVICE: not a Git repository"
    continue
  fi

  BRANCH="$(git -C "$REPO_PATH" branch --show-current)"
  SHA="$(git -C "$REPO_PATH" rev-parse HEAD)"
  VERSION="$(git -C "$REPO_PATH" describe --tags --abbrev=0 2>/dev/null || echo '0.0.0-local')"

  if [[ -z "$BRANCH" ]]; then
    echo "SKIP $SERVICE: detached HEAD at $SHA; branch cannot be determined reliably"
    continue
  fi

  if [[ "$BRANCH" != "dev" && "$BRANCH" != "uat" && "$BRANCH" != "prod" ]]; then
    echo "SKIP $SERVICE: unsupported branch '$BRANCH'"
    continue
  fi

  if [[ -n "$(git -C "$REPO_PATH" status --porcelain)" ]]; then
    echo "SKIP $SERVICE: working tree has uncommitted changes"
    continue
  fi

  echo "Triggering infra: service=$SERVICE branch=$BRANCH version=$VERSION sha=$SHA"

  jq -n \
    --arg service "$SERVICE" \
    --arg repo "${GITHUB_ORG}/${REPO_NAME}" \
    --arg branch "$BRANCH" \
    --arg version "$VERSION" \
    --arg sha "$SHA" \
    '{
      event_type: "service-updated",
      client_payload: {
        service: $service,
        repo: $repo,
        branch: $branch,
        version: $version,
        sha: $sha
      }
    }' |
  curl --fail-with-body --silent --show-error \
    -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GH_PAT}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${INFRA_REPO}/dispatches" \
    -d @-

  echo "OK: $SERVICE"
done
