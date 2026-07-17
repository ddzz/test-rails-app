#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): auto-correct RuboCop offenses in the edited file.
# Receives the tool payload as JSON on stdin. Always exits 0 so it never blocks work.
set -uo pipefail

file_path=$(ruby -rjson -e 'puts JSON.parse($stdin.read).dig("tool_input", "file_path").to_s' 2>/dev/null)

case "$file_path" in
  *.rb) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" 2>/dev/null || exit 0
[ -f "$file_path" ] && [ -x bin/rubocop ] || exit 0

bin/rubocop -a --force-exclusion --fail-level fatal "$file_path" >/dev/null 2>&1
exit 0
