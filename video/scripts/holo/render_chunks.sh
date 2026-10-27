#!/usr/bin/env bash
# Resumable render: video in chunks (skipping chunks already finished), audio
# once, then concatenate and mux. Re-run the same command to continue after
# an interruption.
#
# usage: scripts/holo/render_chunks.sh <CompositionId> <totalFrames> <out.mp4> [chunkSize] [cues.ts]
# With a cue module the soundtrack is mixed by mix_audio.mjs (seconds) instead
# of an audio-only render, which evaluates every WebGL frame (slower than video).
set -euo pipefail
ID=$1; TOTAL=$2; OUT=$3; CHUNK=${4:-400}; CUES=${5:-}
FF=${FFMPEG:-/usr/local/lib/python3.13/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2}
PARTS="out/parts-$ID"
mkdir -p "$PARTS"

n=0
: > "$PARTS/list.txt"
for ((start = 0; start < TOTAL; start += CHUNK)); do
  end=$((start + CHUNK - 1)); ((end >= TOTAL)) && end=$((TOTAL - 1))
  part=$(printf "%s/part%02d.mp4" "$PARTS" "$n")
  if [[ -f "$part.done" ]]; then
    echo "skip part $n ($start-$end)"
  else
    echo "render part $n ($start-$end)"
    npx remotion render "$ID" "$part" --frames="$start-$end" --muted --gl=angle --concurrency=3 --crf=19 --log=error
    touch "$part.done"
  fi
  echo "file '$(basename "$part")'" >> "$PARTS/list.txt"
  n=$((n + 1))
done

if [[ ! -f "$PARTS/audio.wav.done" ]]; then
  if [[ -n "$CUES" ]]; then
    echo "mix audio"
    node scripts/holo/mix_audio.mjs "$CUES" "$PARTS/audio.wav"
  else
    echo "render audio"
    npx remotion render "$ID" "$PARTS/audio.wav" --codec=wav --log=error
  fi
  touch "$PARTS/audio.wav.done"
fi

echo "concat + mux"
"$FF" -v error -y -f concat -safe 0 -i "$PARTS/list.txt" -i "$PARTS/audio.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "done $OUT"
