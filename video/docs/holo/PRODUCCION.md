# Producción de reels holográficos · manual técnico

Cómo se fabrica un reel de principio a fin con el kit de Remotion. Complementa
`FORMATO.md` (qué hace viral al formato: guion, escenas, estilo, edición). Ejemplo
completo y aprobado: `src/Holo/reels/01-cosquillas/`.

Todo se ejecuta desde `video/`.

---

## 1. Estructura

```
src/Holo/
  stage.tsx              escenario 3D: HoloStage, Capsule, Platform, Cam, camAt, toScreen, colores
  kit/
    timeline.ts          makeTimeline(guion, voz) → escenas, páginas de subtítulos, beats; beat()
    Reel.tsx             HoloReel (escenas + subtítulos + destellos + glitch + cierre + audio), defineReel
    hud.tsx              Captions, Label, Badge, Chip, Toggle, Checklist, Notif, PredGraph, Countdown,
                         IdCard, Slider, Meter, Bar, Phone, EndCard
    props3d.tsx          Feather, HexShield, Brain/GlassBust/bustPoint, Node, Signal, Rings, Mri,
                         QuestionMark, RobotArm, Rat, Dome
    cues.ts              voiceCue, cutWhooshes, sfx, cueAt
    guion.ts             tipo de guion.json
  reels/
    index.ts             registro: cada reel es la composición "reel-<slug>"
    NN-palabra/          guion.json · voice.ts · timeline.ts · cues.ts · scenes.tsx · index.ts
public/holo/             (no está en git; se regenera)
  sfx/                   librería de efectos (setup_assets.sh)
  reels/<slug>/          voice.mp3 + voice.wav
scripts/holo/            herramientas (abajo)
out/entregas/<slug>/     entrega: <slug>.mp4, <slug>.pdf, descripcion-ig.txt, revision/
```

## 2. Un reel nuevo, paso a paso

```bash
scripts/holo/setup_assets.sh                          # una vez por máquina: npm, Python, efectos
python3.13 scripts/holo/ideas.py libres               # elegir idea (o agregar una de tendencia)
python3.13 scripts/holo/ideas.py reservar N --slug NN-palabra
# escribir src/Holo/reels/NN-palabra/guion.json (sección 3)
node scripts/holo/new_reel.mjs NN-palabra             # carpeta, escenas provisionales, registro
node scripts/holo/voice_elevenlabs.mjs src/Holo/reels/NN-palabra   # voz + tiempos exactos por palabra
node scripts/holo/reel_info.mjs NN-palabra            # duración, escenas, palabras por minuto
# construir scenes.tsx y cues.ts (secciones 4 y 5), revisar con stills
scripts/holo/make_reel.sh NN-palabra                  # render + entrega + revisión objetiva
python3.13 scripts/holo/ideas.py hecha N --slug NN-palabra
```

- `NN` = siguiente número libre (`ls src/Holo/reels`). `palabra` = 1–2 palabras del tema, sin acentos.
- **Nunca cambies el texto del guion después de generar la voz**: el timeline lanza un error
  (voice.ts no coincide). Si hay que cambiar el texto, regenera la voz.
- Sin voz todavía (p. ej. ElevenLabs caído): `make_reel.sh NN-palabra --sin-voz` hace una
  vista previa con tiempos estimados. No es una entrega final.

## 3. guion.json

Tipo en `kit/guion.ts`. Es la única fuente del video, el PDF y la publicación.

- `bloques`: los 7 bloques de `FORMATO.md`, cada uno con sus `escenas`.
  `escena.texto` = frase exacta que dice la voz (una escena por frase o idea, 12–18 escenas, 2–8 s cada una);
  `escena.imagen` = qué se ve, en español, concreto.
- `palabras_clave`: 12–20 palabras (forma exacta como aparecen, en minúsculas) que van en el recuadro dorado.
- `cierre`: pregunta para comentar con una palabra en recuadro (`clave` debe aparecer en `pregunta`) y `cta`.
- `fuentes`: cada dato con su fuente real (URL abierta y leída). Hipótesis → «los científicos creen».
- `instagram`: descripción lista para pegar (gancho en la primera línea, 3 datos con emoji,
  pregunta para comentar, CTA de enviar y de guardar), 4–6 hashtags, comentario fijado.
- 220–280 palabras en total (≈ 85–105 s a 160 palabras por minuto). Puntos suspensivos donde respira.

## 4. Escenas (scenes.tsx)

Patrón (ver `01-cosquillas/scenes.tsx`):

```tsx
export const S03: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, from, to, target);        // acercamiento lento durante toda la escena
  const t = beat(sc, "cerebro");              // frame (relativo) en que la voz dice la palabra
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>{/* objetos 3D */}</HoloStage>
      {/* HUD 2D encima: Label anclado a un punto 3D, Chip, Meter… con at={t} */}
    </AbsoluteFill>
  );
};
```

- **Cada historia necesita imágenes propias.** Las cápsulas y el escenario son la identidad del
  canal; las metáforas y objetos se crean para cada guion (nuevos props en `kit/props3d.tsx`
  o en el propio `scenes.tsx`). No repitas las escenas de otro reel.
- Todo movimiento se ancla a palabras con `beat()`; nada de frames fijos que dependan de la voz.
- **Encuadre 9:16**: a distancia ~12 de cámara solo hay ±1.9 unidades horizontales visibles.
  Sujeto en los dos tercios inferiores; **la franja superior (y < 380 px) es de los subtítulos**.
  Elementos importantes entre x 80–960 px e y 380–1560 px (abajo y a la derecha Instagram pone
  su interfaz).
- Cámara: `from`/`to` a z 9–13, `target` y ~1.5. Objetos grandes → aleja la cámara antes que recortar.
- Luz: bloom 0.6 (0.65–0.8 solo para un objeto que debe brillar). Si un still sale quemado, baja
  intensidades de los materiales, no subas la exposición.
- HUD: `Label` (punto 3D + línea + texto que se escribe), `Chip` (placa), `Meter`/`Bar`/`Slider`
  (valores), `Checklist`, `Countdown`, `IdCard` (investigador, sin foto), `Notif`, `PredGraph`, `Phone`
  (compartir, para la última escena). Texto en mayúsculas, 1–3 palabras.
- Personajes sin cara ni manos. Colores: dorado emoción, cian datos/nervios, rojo-naranja (`ALERT`) solo alertas.
- La primera escena es el gancho: algo debe moverse o aparecer en los primeros 0,5 s.
- Escenas de más de ~7 s necesitan 2–3 cambios internos (nuevo elemento, giro de cámara, valor que sube).

Revisar mientras construyes (rápido, sin render completo):

```bash
node scripts/holo/stills.mjs reel-NN-palabra /tmp/stills 30 400 900   # PNG a media resolución
```

Mira cada escena a mitad y en sus beats: sujeto completo, nada quemado, etiquetas sin solaparse,
franja de subtítulos libre.

## 5. Sonido (cues.ts)

- Voz siempre delante; **sin música de fondo**.
- `cutWhooshes(TL)` en cada corte; `sfx(nombre, frame, vol)` en los momentos clave con `cueAt(TL)(escena, "palabra")`.
- Librería (`public/holo/sfx`): pad, whoosh, blip, thump, zap, laugh, notif, error, zip, glow, scan,
  servo, chirps, fear, rise, sent, glitch. Sonidos nuevos → `scripts/holo/make_sfx_library.py`.
- Niveles: unos 8 dB bajo la voz → vol 0.2–0.35 (blips 0.25–0.35, whoosh 0.28, glitch final 0.45).
  Un efecto encima de una palabra importante, más bajo (≤0.2).

## 6. Render y entrega

`scripts/holo/make_reel.sh <slug>`:

1. comprueba tipos, genera efectos si faltan;
2. renderiza en trozos de 400 frames (se reanuda si se corta; cualquier cambio en `src/` o en la voz
   obliga a renderizar todo): ~3–4 min por trozo con 4 núcleos, ~30 min por reel de 100 s;
3. mezcla el audio desde `cues.ts` (segundos);
4. deja en `out/entregas/<slug>/`: `<slug>.mp4` (para IG), `<slug>.pdf` (guion completo),
   `descripcion-ig.txt` y `revision/` (report.json + hook.png, scenes.png, contact.png, end.png).

Para otro agente o persona: el PDF se genera también suelto con
`python3.13 scripts/holo/make_guion_pdf.py src/Holo/reels/<slug> salida.pdf`.

## 7. Herramientas

| Script | Para qué |
|---|---|
| `setup_assets.sh` | npm, dependencias de Python, librería de efectos |
| `ideas.py` | banco vivo de ideas: libres, agregar, reservar, hecha, liberar |
| `new_reel.mjs` | carpeta y escenas provisionales desde guion.json |
| `voice_elevenlabs.mjs` | voz (ElevenLabs, ajustes en `voz.json`) + `voice.ts` exacto |
| `align_words.mjs` | tiempos para una voz grabada a mano (transcripción de Whisper) |
| `reel_info.mjs` | duración, escenas, palabras por minuto |
| `stills.mjs` | fotogramas sueltos para revisar |
| `make_reel.sh` | render completo y entrega |
| `review_video.py` | comprobaciones objetivas del video final |
| `make_guion_pdf.py` | PDF del guion |
| `mix_audio.mjs`, `render_chunks.sh` | usados por make_reel |

Variables de entorno: `ELEVENLABS_API_KEY` (secreto), `ELEVENLABS_VOICE_ID` (opcional; si falta se busca
la voz por nombre). La red del entorno debe permitir `api.elevenlabs.io`.
