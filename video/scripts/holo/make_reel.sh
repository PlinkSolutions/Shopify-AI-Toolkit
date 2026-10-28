#!/usr/bin/env bash
# Render a holographic reel end to end and collect the deliverables:
#   out/entregas/<slug>/<slug>.mp4          Instagram-ready video (H.264, 1080x1920)
#   out/entregas/<slug>/<slug>.pdf          guion: dialogue, voice text, scenes, sources, IG post
#   out/entregas/<slug>/descripcion-ig.txt  caption + hashtags + pinned comment, with emojis
#   out/entregas/<slug>/revision/           report.json + contact sheets for the reviewer
#
# usage: scripts/holo/make_reel.sh <slug> [--sin-voz]
#   --sin-voz  preview before the narration exists: silent placeholder track,
#              captions on estimated timings (never deliver this as final)
# Interrupted renders resume; any change to src/ or to the voice re-renders
# everything (the chunk cache is keyed to a fingerprint of both).
set -euo pipefail
cd "$(dirname "$0")/../.."
SLUG=${1:?usage: make_reel.sh <slug> [--sin-voz]}
NOVOICE=0
[[ "${2:-}" == "--sin-voz" ]] && NOVOICE=1
ID=reel-$SLUG
DIR=src/Holo/reels/$SLUG
FF=${FFMPEG:-ffmpeg}
export FFMPEG=$FF
PY=$(command -v python3.13 || command -v python3)
[[ -f $DIR/guion.json ]] || { echo "no existe $DIR/guion.json"; exit 1; }

scripts/holo/setup_assets.sh
npx tsc --noEmit -p .

VOICE=public/holo/reels/$SLUG/voice.wav
if [[ ! -f $VOICE ]]; then
  if ((NOVOICE)); then
    SECS=$(node scripts/holo/reel_info.mjs "$SLUG" | "$PY" -c "import json,sys; print(json.load(sys.stdin)['seconds'])")
    mkdir -p "$(dirname "$VOICE")"
    "$FF" -v error -y -f lavfi -i anullsrc=r=48000:cl=mono -t "$SECS" -c:a pcm_s16le "$VOICE"
    echo "AVISO: vista previa sin voz ($SECS s de silencio)"
  else
    echo "falta $VOICE: node scripts/holo/voice_elevenlabs.mjs $DIR  (o --sin-voz para una vista previa)"
    exit 1
  fi
fi

# chunk cache fingerprint: all source code + the voice track
FP=$( (find src -type f -print0 | sort -z | xargs -0 sha1sum; sha1sum "$VOICE") | sha1sum | cut -c1-16)
PARTS=out/parts-$ID
if [[ -f $PARTS/fingerprint && "$(cat "$PARTS/fingerprint")" != "$FP" ]]; then
  echo "código o voz cambiaron: render completo"
  rm -rf "$PARTS"
fi
mkdir -p "$PARTS"
echo "$FP" > "$PARTS/fingerprint"

TOTAL=$(node scripts/holo/reel_info.mjs "$SLUG" frames)
rm -f "$PARTS/audio.wav.done" # always remix (cheap, and cue volumes may have changed)
scripts/holo/render_chunks.sh "$ID" "$TOTAL" "out/$SLUG-master.mp4" 400 "$DIR/cues.ts"

DEST=out/entregas/$SLUG
mkdir -p "$DEST/revision"
"$FF" -v error -y -i "out/$SLUG-master.mp4" -vf "scale=out_range=tv" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -profile:v high -c:a copy -movflags +faststart "$DEST/$SLUG.mp4"
"$PY" scripts/holo/make_guion_pdf.py "$DIR" "$DEST/$SLUG.pdf"
"$PY" -c "
import json, sys
g = json.load(open(sys.argv[1], encoding='utf8'))['instagram']
print(g['descripcion'] + '\n\n' + ' '.join(g['hashtags']) + '\n\n— Comentario fijado —\n' + g['comentario_fijado'])
" "$DIR/guion.json" > "$DEST/descripcion-ig.txt"
"$PY" scripts/holo/review_video.py "$DEST/$SLUG.mp4" "$SLUG" "$DEST/revision" > /dev/null
((NOVOICE)) && echo "SIN VOZ" > "$DEST/VISTA-PREVIA-SIN-VOZ.txt"
ls -la "$DEST"
echo "listo: $DEST"
