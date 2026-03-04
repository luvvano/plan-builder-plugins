#!/bin/bash
# Load existing plan context if .planning/ exists
if [ -d ".planning" ]; then
  echo "=== Existing Plan Context ==="
  [ -f ".planning/PROJECT.md" ] && cat ".planning/PROJECT.md"
  echo ""
  [ -f ".planning/ROADMAP.md" ] && cat ".planning/ROADMAP.md"
fi
