# BehindCaptions pipeline

Builds the `BehindCaptions` composition: captions rendered *behind* the
speaker, with a 3D look. Layers: full video → captions → person cutout.

1. **Join clips** (1 → 2 → 3) into `public/joined.mp4` with ffmpeg `concat`.
2. **Transcribe** each 10 s clip with Whisper-small (transformers.js, ONNX
   weights from the `sts-whisper-small` npm package) for word timestamps:
   `node transcribe-clips.mjs <models-dir> audio.f32 words.json`
   (`audio.f32` = 16 kHz mono float32 PCM).
3. **Cut out the person** with `build_person.py` → `public/person.webm`
   (VP9 + alpha) and a grayscale matte. MODNet for close-ups; for the
   top-down clip ISNet gates the outline and MODNet fills it in.
   Models: MODNet from `@rmbg/model-modnet`, ISNet from
   `@imgly/background-removal-node` (both npm).
4. **Lay out captions** with `make_pages.py words.json matte.mp4 ffmpeg
   ../../src/BehindCaptions/pages.ts` — groups words into 1–2 word pages
   and places each page just below the top of the head so the head
   overlaps the lower part of the letters.

`public/joined.mp4` and `public/person.webm` are gitignored (large media).
