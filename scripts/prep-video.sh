#!/bin/sh
# Transcodes a diary video clip into a guest's folder as a web-sized H.264
# MP4 and prints the markdown path to paste into the entry.
#
#   scripts/prep-video.sh tiny ~/Downloads/IMG_1234.mov zoomies
#   → ./tiny/tiny-zoomies.mp4
#
# Diary clips never display wider than ~1160px, so 1280px on the long side
# plus a fairly aggressive CRF keeps them watchable while stopping a phone's
# default export bloating the repo. Requires ffmpeg (brew install ffmpeg).
set -eu

if [ $# -ne 3 ]; then
  echo "usage: scripts/prep-video.sh <guest> <source-video> <slug>" >&2
  exit 1
fi

guest=$1 src=$2 slug=$3
root=$(cd "$(dirname "$0")/.." && pwd)
dir="$root/src/content/guests/$guest"
out="$dir/$guest-$slug.mp4"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found — brew install ffmpeg" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found — brew install ffmpeg" >&2; exit 1; }
[ -f "$root/src/content/guests/$guest.md" ] || { echo "no guest \"$guest\" in src/content/guests/" >&2; exit 1; }
[ -f "$src" ] || { echo "no file at $src" >&2; exit 1; }
case "$src" in
  *.mp4|*.MP4|*.mov|*.MOV) ;;
  *) echo "source must be an .mp4 or .mov video, got $src" >&2; exit 1 ;;
esac
[ -e "$out" ] && { echo "$out already exists — pick another slug" >&2; exit 1; }

mkdir -p "$dir"
ffmpeg -loglevel error -i "$src" \
  -c:v libx264 -crf 28 -preset veryfast -vf "scale='min(1280,iw)':-2" \
  -c:a aac -b:a 128k -movflags +faststart \
  "$out"
size_kb=$(du -k "$out" | cut -f1)
if [ "$size_kb" -gt 20480 ]; then
  echo "warning: $out is ${size_kb}KB even after compression — consider trimming it" >&2
fi

# The site can't run ffprobe at Vercel build time, so the actual encoded
# dimensions (portrait clips included) are captured here as a sidecar file
# and read back in as plain JSON when sizing the diary card.
width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$out")
height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$out")
printf '{"width":%s,"height":%s}\n' "$width" "$height" > "$out.json"

echo "./$guest/$guest-$slug.mp4 (${size_kb}KB)"
