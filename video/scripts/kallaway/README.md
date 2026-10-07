# Kallaway reel pipeline

Builds `KallawayReel`: talking head in the bottom 64%, original motion
graphics per beat on grid paper above, caption pill on the split line.

1. Join the clips in order into `public/k_joined.mp4` (ffmpeg `concat`), and
   extract 16 kHz mono float32 audio: `audio.f32`.
2. `node transcribe-fixed.mjs <models> audio.f32 words.json 10` — Whisper
   word timings per separately recorded 10 s clip (see
   `../behind-captions/README.md` for the model source).
3. `python3 jumpcuts.py audio.f32 words.json cuts.json` — finds pauses from
   audio energy (> 0.25 s) and keeps the speech segments, remapping word
   times onto the edited timeline.
4. `python3 make_reel_data.py cuts.json ../../src/Kallaway/reel/data.ts` —
   fixes Whisper mishearings and writes segments + words for the reel.

Scenes live in `src/Kallaway/reel/scenes.tsx`; each one is keyed to the
word it illustrates. `public/k_joined.mp4` is gitignored (user footage).
