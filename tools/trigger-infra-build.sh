#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_PREFIX="tic-tac-toe"
GITHUB_ORG="beartrando"

: "${GH_PAT:?Set GH_PAT environment variable}"

ROOT="$(git rev-parse --show-toplevel)"
INFRA_REPO="${GITHUB_ORG}/${PROJECT_PREFIX}-infra"

# Discover repositories (gitlinks) under services/server/.
# Source of truth: monorepo gitlinks (mode 160000), not a hardcoded list.
# Fallbacks: git submodule status, then directory scan.
SERVICE_PATHS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  SERVICE_PATHS+=("$line")
done < <(
  git -C "$ROOT" ls-files -s 2>/dev/null \
    | awk '$1=="160000" && $4 ~ /^services\/server\// {print $4}' \
    | sort -u
)

if [[ ${#SERVICE_PATHS[@]} -eq 0 ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    SERVICE_PATHS+=("$line")
  done < <(
    git -C "$ROOT" submodule status --recursive 2>/dev/null \
      | awk '{print $2}' | grep '^services/server/' | sort -u || true
  )
fi

if [[ ${#SERVICE_PATHS[@]} -eq 0 ]]; then
  for d in "$ROOT"/services/server/*/; do
    [[ -e "$d/.git" ]] && SERVICE_PATHS+=("${d#"$ROOT"/}")
  done
fi

if [[ ${#SERVICE_PATHS[@]} -eq 0 ]]; then
  echo "No repositories found under services/server/"
  exit 0
fi

for REPO_PATH_REL in "${SERVICE_PATHS[@]}"; do
  SERVICE="$(basename "$REPO_PATH_REL")"
  REPO_PATH="${ROOT}/${REPO_PATH_REL}"

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
    --arg repo "${GITHUB_ORG}/${PROJECT_PREFIX}-${SERVICE}" \
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
  curl --fail --silent --show-error \
    -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GH_PAT}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${INFRA_REPO}/dispatches" \
    -d @-

  echo "OK: $SERVICE"
done
