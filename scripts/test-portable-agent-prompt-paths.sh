#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"
cd "$repo_root"

if matches="$(git grep -nE '/Users/[^/]+/' -- '*.md' 2>/dev/null)" && [[ -n "$matches" ]]; then
  printf 'concrete macOS user-home paths remain in tracked Markdown:\n%s\n' "$matches" >&2
  exit 1
fi

git grep --quiet -F '$HOME/Desktop/Projects/ChoreChamp/' -- CHORECHAMP_AGENT_PROMPT.md
git grep --quiet -F '$HOME/Desktop/Projects/FocusFlow/' -- CHORECHAMP_AGENT_PROMPT.md
git grep --quiet -F '$HOME/Desktop/Projects/LifeContextCompiler/' -- CHORECHAMP_AGENT_PROMPT.md
git grep --quiet -F '$HOME/Desktop/Projects/RecordForge/' -- CHORECHAMP_AGENT_PROMPT.md

printf 'portable ChoreChamp prompt path checks passed\n'
