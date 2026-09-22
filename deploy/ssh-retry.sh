#!/usr/bin/env bash
set -euo pipefail
payload="$1"
shift
for attempt in 1 2 3 4 5; do
  status=0
  "$@" < "$payload" || status=$?
  if [ "$status" -eq 0 ]; then exit 0; fi
  # SSH 用 255 报传输错误；远端部署/迁移的业务错误不可通过重复部署掩盖。
  if [ "$status" -ne 255 ]; then
    echo "::error::Remote deployment failed with exit code $status; not retrying" >&2
    exit "$status"
  fi
  if [ "$attempt" -eq 5 ]; then
    echo "::error::SSH transport failed after $attempt attempts" >&2
    exit "$status"
  fi
  echo "::warning::SSH transport failed; retrying attempt $((attempt + 1))/5" >&2
  sleep "$((attempt * 15))"
done
