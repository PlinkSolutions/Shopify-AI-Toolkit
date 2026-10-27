# Biblia del formato · Reels de ciencia holográfica

Contexto de trabajo para crear reels de curiosidades científicas en estilo
"holograma 3D con personajes cápsula". Léelo antes de escribir un guion, una
tabla de escenas o de editar uno de estos videos. Complementa la skill
`reel-ciencia-holografica` y la plantilla de Remotion `src/Holo/` (`HoloClip`).

---

## 1. Qué es el formato

- Reel vertical 9:16 de **60–100 s**, narrado en segunda persona ("tu cerebro…"),
  con una escena 3D por idea. Tema: "por qué pasa X", "qué pasaría si…",
  "cómo funciona…", misterios.
- Referencia analizada: *"¿Por qué basta con apoyar la cabeza en su pecho para
  quedarte dormido en minutos?"* (cuenta DSUBIDA Scientific). 1:41, 267 palabras
  (~160 por minuto), 16 escenas + logo, escenas de ~6 s (2–9 s).
- Lo que lo hace funcionar: pregunta íntima y universal, explicación con
  nombres reales (oxitocina, cortisol), un giro con investigador o estudio, cierre
  emocional y una llamada a compartir con **una persona concreta**.

## 2. Guion: 7 bloques

| # | Bloque | Fórmula | Duración aprox. |
|---|---|---|---|
| 1 | Gancho doble | "¿Por qué…? ¿Y por qué basta con…?" | 6–10 s |
| 2 | Reencuadre | "No es solo X. Tu cerebro…" | 4–6 s |
| 3 | Origen / analogía | "Piénsalo así:" + 3 elementos (primer alimento, primer calor, primer latido) | 10–15 s |
| 4 | Mecanismo | "Por eso, cuando…, pasan tres cosas:" con nombres reales | 15–20 s |
| 5 | Giro | "Pero aquí viene lo curioso:" + investigador (nombre + institución) o estudio | 15–25 s |
| 6 | Cierre emocional | Retoma el gancho: "Así que no es que… Es que tu cerebro…" | 6–10 s |
| 7 | Compartir | "Mándaselo a esa persona que…" (con humor o emoción) | 4–6 s |

Reglas:
- **Verificar todo** antes de escribir. Si no está 100 % probado: "los científicos creen…".
  Nombres de investigadores e instituciones copiados exactos de la fuente.
- Frases cortas, ritmo pausado; puntos suspensivos donde la voz respira.
- Para hipotéticos ("¿Qué pasaría si…?") el bloque 4 se convierte en una línea de
  tiempo ("a las 24 horas… al tercer día…").
- Para misterios, el bloque 5 presenta las teorías y el 6 admite que no se sabe.

## 3. Escenas

- Una escena por frase o idea (3–7 s), normalmente 12–16.
- Cada escena con una **metáfora tecnológica** que explique el cuerpo o la idea.
- El sujeto va centrado en los dos tercios inferiores; **el tercio superior queda libre para subtítulos**.
- Texto dentro de la imagen: máximo 1–3 palabras en mayúsculas. Las fichas con texto pequeño se añaden en edición.

### Biblioteca de metáforas (concepto → elemento)

| Concepto | Elemento visual |
|---|---|
| Recuerdo que no se borra | Ventana de error "NO SE PUEDE ELIMINAR", archivo `refugio.exe` |
| Instinto, origen | GPS "Destino guardado" → "Has llegado a tu destino" |
| Activar un estado | Interruptor "MODO DESCANSO: ON" |
| Algo que se acumula | Barra de progreso "NIVEL DE SUEÑO 100 %" |
| Primeras experiencias | Lista de logros "PRIMER ALIMENTO / PRIMER CALOR / PRIMER LATIDO" |
| Hormonas que suben y bajan | Gráfica: línea dorada sube, cian baja |
| Molécula concreta | Molécula de bolas blancas y doradas + etiqueta |
| Investigador citado | Ficha "INVESTIGADOR · ID" con silueta (nunca foto real) + sello "TEORÍA" |
| Dato sorprendente | Signo de interrogación dorado gigante + placa "DATO CURIOSO" |
| Comparar especies | Fila de cápsulas, la humana dorada "ÚNICOS" |
| Conexión entre personas | Circuito entre dos cerebros, "ACCESO CONCEDIDO", corazón que une |
| Estudio con escáner | Resonancia magnética de malla, "PARTICIPANTES: …" |
| Zona del cerebro | Cerebro de nube de puntos con nodos cian/dorado |
| Bloqueo / filtro | Firewall "BLOQUEADO", candado sobre un receptor |
| Conflicto de señales | Dos sensores con datos opuestos, "CONFLICTO DE DATOS" |
| Reinicio | "REINICIANDO SISTEMA…" |
| Algo invisible / filtrado | Capa oculta, interruptor "FILTRO: ON" |
| Repetición | Reproductor "REPETIR: ∞" |
| Cierre / compartir | Mano 3D con móvil: chat, menú compartir, "Enviado ✓" |

Personajes: **cápsula blanca** de cristal (él / tú) y **cápsula dorada** (ella / el
otro / el bebé). Esfera flotando sobre cuerpo de pastilla, sin cara ni brazos.

## 4. Estilo visual

Bloque STYLE (al final de cada prompt de imagen):

> premium 3D holographic science explainer, vertical 9:16. Deep navy-black background (#0A0F1C), glowing perspective grid floor fading into darkness, soft volumetric spotlight from above, circular glowing platform with thin gold and orange concentric rings under the subject. Minimalist capsule characters: sphere head floating above a pill-shaped body, no face, no limbs. Character A: frosted white translucent glass with bright white rim light. Character B: emissive warm gold (#F5B83D) with soft bloom. Accent color cyan (#4FD1E8) for data and nerves. Tiny monospace uppercase HUD labels with thin leader lines. Clean Octane-style render, glossy materials, subtle bloom, shallow depth of field, cinematic, minimal, lots of negative space, subject centered in lower two-thirds, top third empty for subtitles.

Bloque MOTION BASE (al final de cada prompt de movimiento):

> Slow cinematic push-in, subtle 10° orbit, holographic elements gently pulse and flicker, floating dust particles, HUD labels type in, smooth easing, no camera shake, keep the character design identical.

Paleta: fondo #0A0F1C · dorado #F5B83D (emoción) · cian #4FD1E8 (datos, nervios) ·
blanco cristal · rojo-naranja solo para alertas o dolor.

## 5. Edición (medido en la referencia)

- **Cortes secos con destello de luz de 1–2 fotogramas** en cada cambio de escena.
  Excepciones: la ficha del investigador entra girando en 3D; el final cierra con glitch RGB.
- Dentro de cada escena: acercamiento lento; los elementos aparecen al ritmo de la voz
  (etiquetas que se escriben solas, interruptores, barras que se llenan, gráficas que se dibujan).
- **Subtítulos** arriba, blancos, Poppins ~50 px a 1080 de ancho, 1–4 palabras por página,
  estilo karaoke (las palabras siguientes en gris hasta que se dicen) y **palabra clave en
  recuadro dorado**.
- Audio: voz siempre delante; música ambiental constante unos 20 dB por debajo;
  sonidos de interfaz suaves (blips al aparecer etiquetas, whoosh en los cortes).
- Cierre: logo propio 2 s ("Síguenos para más…"). Nunca el logo de otra cuenta.

## 6. Voz

ElevenLabs: masculina, cálida, medio-grave, ritmo pausado, tono documental íntimo
(Stability ~50, Similarity ~75, Style ~20). Unas 150–165 palabras por minuto.

## 7. Producción

Dos caminos, combinables:

1. **IA generativa** (más cinematográfico, cuesta créditos): imágenes con Nano Banana Pro
   (STYLE), animación con Seedance 2.0 o Veo 3.1 (MOTION BASE + movimiento extra).
   Nunca generar sin que el usuario apruebe los prompts y el coste.
2. **Remotion `HoloClip`** (gratis, repetible): `video/src/Holo/` tiene el escenario 3D
   (suelo, foco, plataforma, polvo, bloom), las cápsulas, escenas de ejemplo, subtítulos
   karaoke, etiquetas ancladas a puntos 3D, destellos en los cortes y sonidos sintetizados.
   Render: `npx remotion render HoloClip out/clip.mp4 --gl=angle`.

Flujo recomendado: guion verificado → voz → transcripción con tiempos por palabra →
tabla de escenas (una por frase) → clips (IA o Remotion) → montaje en la plantilla
(subtítulos sincronizados con la voz real, destellos, etiquetas, música, logo).

## 8. Checklist antes de publicar

- [ ] Cada dato verificado; hipótesis marcadas como "los científicos creen".
- [ ] Gancho doble en los primeros 3 s; tercio superior libre en todas las escenas.
- [ ] Una metáfora tecnológica por escena; personajes idénticos en todo el video.
- [ ] Subtítulos sincronizados con la voz real; palabras clave en recuadro dorado.
- [ ] Destello en cada corte; música ~20 dB bajo la voz.
- [ ] CTA a una persona concreta; logo propio al final.
- [ ] Etiqueta "Hecho con IA" activada si hay imágenes generadas.

## 9. Banco de ideas

100 ideas en `ideas.md` / `ideas.json` (generadas por `ideas.py`), en 10 categorías:
tu cuerpo, tu cerebro, sueño, amor, ¿qué pasaría si…?, espacio, misterios, cosas de todos
los días, animales y actualidad. Etiquetas: base, hipótesis, misterio, tendencia,
verificar y ⭐ recomendadas para empezar.
