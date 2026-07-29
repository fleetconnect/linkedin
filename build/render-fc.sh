#!/usr/bin/env bash
# Render every Freight Ledger creative to PNG at 2x for print-crisp output.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# headless_shell honours --window-size exactly; full chrome --headless=new does not.
CHROME="/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
OUT="$ROOT/out/fc"
SRC="$ROOT/build/fc"
W=1080; H=1350; SCALE=2

mkdir -p "$OUT"

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  mapfile -t targets < <(ls "$SRC"/*.html | xargs -n1 basename)
fi

for f in "${targets[@]}"; do
  name="${f%.html}"
  "$CHROME" --no-sandbox --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=$SCALE \
    --default-background-color=00000000 \
    --virtual-time-budget=3000 \
    --screenshot="$OUT/$name.png" \
    --window-size=$W,$H \
    "file://$SRC/$f" 2>/dev/null
  printf '  rendered  %-28s %s\n' "$name.png" "$(du -h "$OUT/$name.png" | cut -f1)"
done
