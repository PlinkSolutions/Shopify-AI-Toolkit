# BehindCaptions pipeline

Builds the `BehindCaptions` composition: 3D captions *behind* the speaker.
Layers: full video → captions → person cutout. Each caption page is split
into a left and a right "wall" anchored at the frame edges that recede in
perspective toward the speaker, so the text flanks them without covering
them; words slide out from behind the speaker and slide back on exit.

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
   ../../src/BehindCaptions/pages.ts <anton.woff>` — groups words into 1–2
   word pages, splits each page into left/right parts, and picks for each
   page the height beside the head (not above it) and the font size at which
   the projected text stays clear of the person's silhouette, using the
   matte and real Anton glyph widths (needs `fonttools`). The perspective
   constants must match `BehindCaptions.tsx`.

`public/joined.mp4` and `public/person.webm` are gitignored (large media).

## BehindCaptionsTop (title style)

Alternative layout: one big flat Bebas Neue word (or two short ones) per
page in `#f0d820`, spanning the width above the speaker, with the bottom
30% of the letters tucked behind the head. Words rise from behind the head.
`make_pages_top.py words.json matte.mp4 ffmpeg
../../src/BehindCaptionsTop/pages.ts <bebas-neue.woff>`

## BehindCaptions3D (bubbly poster style)

Big Gluten 900 captions in lime `#c0de4e` with a dark-green 3D extrusion,
1–2 lines per page, behind the speaker. `make_pages_3d.py` tries 1/2-line
layouts, sizes and heights and measures with the matte how much of each
word the speaker covers: every word stays readable (≤ 40 % hidden) and the
layout aims for ~22 % overlap so the text clearly sits behind them. Pages
never end on a function word (el, la, de, a, y, que…).
`make_pages_3d.py words.json matte.mp4 ffmpeg
../../src/BehindCaptions3D/pages.ts <gluten-latin-900-normal.woff>`
