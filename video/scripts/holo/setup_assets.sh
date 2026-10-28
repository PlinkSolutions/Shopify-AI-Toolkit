#!/usr/bin/env bash
# Prepare a fresh checkout for holographic reels: node modules, Python deps and
# the synthesized sound-effect library (public/holo/ is not in git).
# usage: scripts/holo/setup_assets.sh   (run from video/)
set -euo pipefail
cd "$(dirname "$0")/../.."

[[ -d node_modules/remotion ]] || npm ci --no-audit --no-fund

PY=$(command -v python3.13 || command -v python3)
if ! "$PY" -c "import numpy, PIL, reportlab" 2>/dev/null; then
  "$PY" -m pip install --quiet numpy pillow reportlab
fi

if [[ ! -f public/holo/sfx/glitch.wav ]]; then
  "$PY" scripts/holo/make_holo_sfx.py public/holo/sfx
  "$PY" scripts/holo/make_sfx_library.py public/holo/sfx
fi
echo "assets ok ($PY)"
