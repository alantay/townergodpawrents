#!/bin/sh
# Shrinks a diary photo (JPEG/PNG/HEIC) into a guest's folder as a web-sized
# JPEG and prints the markdown path to paste into the entry.
#
#   scripts/prep-photo.sh tiny ~/Downloads/IMG_1234.HEIC manja-moment
#   → ./tiny/tiny-manja-moment.jpg
#
# Diary prints never display wider than ~1160px, so 1600px on the long side
# keeps them sharp enough while stopping 20MB phone PNGs bloating the repo.
# Not for cut-outs: those need their transparent PNG.
set -eu

if [ $# -ne 3 ]; then
  echo "usage: scripts/prep-photo.sh <guest> <source-photo> <slug>" >&2
  exit 1
fi

guest=$1 src=$2 slug=$3
root=$(cd "$(dirname "$0")/.." && pwd)
dir="$root/src/content/guests/$guest"
out="$dir/$guest-$slug.jpg"

[ -f "$root/src/content/guests/$guest.md" ] || { echo "no guest \"$guest\" in src/content/guests/" >&2; exit 1; }
[ -f "$src" ] || { echo "no file at $src" >&2; exit 1; }
[ -e "$out" ] && { echo "$out already exists — pick another slug" >&2; exit 1; }

mkdir -p "$dir"
# -Z would also upscale a small photo, so only shrink ones that are too big.
long=$(sips -g pixelWidth -g pixelHeight "$src" | awk '/pixel/ { if ($2 > m) m = $2 } END { print m }')
if [ "$long" -gt 1600 ]; then
  sips -s format jpeg -s formatOptions 80 -Z 1600 "$src" --out "$out" >/dev/null
else
  sips -s format jpeg -s formatOptions 80 "$src" --out "$out" >/dev/null
fi
echo "./$guest/$guest-$slug.jpg ($(du -k "$out" | cut -f1)KB)"
