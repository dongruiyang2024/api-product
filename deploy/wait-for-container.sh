#!/usr/bin/env bash
# 普通 InitEnt 有 600 秒预算；额外 120 秒覆盖健康探测及容器状态传播。
wait_for_container() {
  local container_id="$1" deadline=$((SECONDS + 720)) state
  while (( SECONDS < deadline )); do
    state="$(docker inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")" || return "$?"
    case "$state" in
      'running healthy') return 0 ;;
      'running starting') ;;
      *) echo "sub2api startup failed: $state" >&2; return 1 ;;
    esac
    sleep 5
  done
  echo "sub2api did not become healthy within 720 seconds" >&2
  return 1
}
