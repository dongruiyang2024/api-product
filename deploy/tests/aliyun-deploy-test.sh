#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
source "$repo_root/deploy/wait-for-container.sh"
fixture_dir="$(mktemp -d)"
trap 'rm -rf "$fixture_dir"' EXIT
export fixture_dir

# 真正执行等待函数，用状态序列替代 Docker 边界；失败不能被健康等待吞掉。
docker() {
  local call
  call=$(cat "$fixture_dir/inspect-count")
  echo "$((call + 1))" > "$fixture_dir/inspect-count"
  sed -n "$((call + 1))p" "$fixture_dir/states"
}
sleep() { :; }
check_health() {
  local expected="$1" states="$2" status=0
  printf '%s\n' "$states" > "$fixture_dir/states"
  echo 0 > "$fixture_dir/inspect-count"
  wait_for_container test-container > "$fixture_dir/result" 2>&1 || status=$?
  [ "$status" -eq "$expected" ] || { cat "$fixture_dir/result"; exit 1; }
}
check_health 0 $'running starting\nrunning healthy'
[ "$(cat "$fixture_dir/inspect-count")" -eq 2 ]
for state in 'running unhealthy' 'exited starting' 'restarting starting' 'running missing'; do
  check_health 1 "$state"
  [ "$(cat "$fixture_dir/inspect-count")" -eq 1 ]
done
sleep() { SECONDS=$((SECONDS + 721)); }
check_health 1 'running starting'
grep -q 'within 720 seconds' "$fixture_dir/result"

# 真正执行重试入口，确认业务失败只执行一次，255 有界重试，输入每次重放。
sleep() { :; }
transport() {
  local call status
  call=$(cat "$fixture_dir/ssh-count")
  echo "$((call + 1))" > "$fixture_dir/ssh-count"
  [ "$(cat)" = 'payload' ] || return 42
  status=$(sed -n "$((call + 1))p" "$fixture_dir/exits")
  return "$status"
}
export -f sleep transport
check_retry() {
  local expected="$1" calls="$2" exits="$3" status=0
  printf '%s\n' "$exits" > "$fixture_dir/exits"
  echo 0 > "$fixture_dir/ssh-count"
  echo payload > "$fixture_dir/payload"
  bash "$repo_root/deploy/ssh-retry.sh" "$fixture_dir/payload" transport > "$fixture_dir/result" 2>&1 || status=$?
  [ "$status" -eq "$expected" ] && [ "$(cat "$fixture_dir/ssh-count")" -eq "$calls" ] || { cat "$fixture_dir/result"; exit 1; }
}
check_retry 0 1 '0'
check_retry 7 1 '7'
check_retry 0 2 $'255\n0'
check_retry 7 2 $'255\n7'
check_retry 255 5 $'255\n255\n255\n255\n255'
echo 'Aliyun deployment behavior tests passed'
