#!/usr/bin/env bash
# Wire a hero photograph into a cinematic lockup and render the finished ad.
#
#   ./build/place-hero.sh A01 ~/Downloads/cascadia-fuel-island.jpg
#
# Copies the image into assets/hero/, points the layout's .hero at it, drops the
# placeholder treatment, and re-renders to out/campaign/<ID>-*.png.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ID="${1:?usage: place-hero.sh <CONCEPT_ID> <image-path>   e.g. A01 hero.jpg}"
IMG="${2:?usage: place-hero.sh <CONCEPT_ID> <image-path>}"

[ -f "$IMG" ] || { echo "no such image: $IMG" >&2; exit 1; }

LAYOUT=$(ls "$ROOT/build/campaign/${ID}"-*.html 2>/dev/null | head -1)
[ -n "$LAYOUT" ] || { echo "no layout for $ID in build/campaign/" >&2; exit 1; }

EXT="${IMG##*.}"
mkdir -p "$ROOT/assets/hero"
DEST="$ROOT/assets/hero/${ID}.${EXT}"
cp "$IMG" "$DEST"

# point .hero at the plate and drop the placeholder + its caption
python3 - "$LAYOUT" "${ID}.${EXT}" <<'PY'
import re, sys
path, rel = sys.argv[1], sys.argv[2]
s = open(path).read()
s = s.replace('<div class="hero placeholder"></div>',
              f'<div class="hero" style="background-image:url(\'../../assets/hero/{rel}\')"></div>')
s = re.sub(r'\s*<div class="plate-note">.*?</div>', '', s, flags=re.S)
open(path, 'w').write(s)
PY

"$ROOT/build/render-campaign.sh" "$(basename "$LAYOUT")"
echo "  hero placed: $DEST"

cat <<'NOTE'

  Before this goes live, check the plate for:
    · third-party carrier livery or fleet names on the cab or trailer
    · readable license plates or DOT / MC numbers
    · non-US cabs (Scania, MAN, cab-over Volvo FH) — the audience clocks these instantly
    · anyone recognisable, which needs a model release
NOTE
