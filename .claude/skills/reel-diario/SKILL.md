---
name: reel-diario
description: Produce y entrega un reel holográfico de ciencia con los agentes reel-creador y reel-revisor (idea de tendencia → guion verificado → voz ElevenLabs → escenas 3D nuevas → render → revisión viral → entrega de video + PDF + descripción de IG). Úsalo en cada ejecución programada (3 al día) o cuando pidan "haz el reel de hoy" / "otro video".
---

# Reel del día

Una ejecución = **un** reel entregado. Decide tú sin preguntar (nadie está mirando), salvo que
algo bloquee por completo. Nunca inventes datos ni simules la voz. No crees PRs.

## 0. Preparación

```bash
cd <repo>   # PlinkSolutions/Shopify-AI-Toolkit
git fetch origin claude/create-video-setup-gqurcg
git checkout claude/create-video-setup-gqurcg && git pull --ff-only
cd video && scripts/holo/setup_assets.sh
test -n "$ELEVENLABS_API_KEY" && echo "clave ok" || echo "FALTA ELEVENLABS_API_KEY"
curl -s -o /dev/null -w "%{http_code}\n" https://api.elevenlabs.io/v1/models   # 200/401 = red ok · 000/403 = bloqueada
```

Todo el trabajo y los push van a la rama `claude/create-video-setup-gqurcg`. Si ElevenLabs
no está disponible, el reel sale como **vista previa sin voz** (`make_reel.sh <slug> --sin-voz`)
y lo dices claramente en la entrega con el motivo (falta la clave o la red bloquea
api.elevenlabs.io: se arregla en la configuración del entorno).

Turno según la hora en America/Chicago: mañana (antes de 12), mediodía (12–15), tarde (después).

## 1. Crear

Lanza el agente **reel-creador** en primer plano (el siguiente paso depende de él):
`subagent_type: "reel-creador"`. Si ese tipo no existe en la sesión, usa `general-purpose` con
"Lee `.claude/agents/reel-creador.md` (sin el bloque `---` inicial) y sigue sus instrucciones." delante.

Prompt: `Produce el reel del turno de <turno> del <fecha>. Repo en <ruta>, trabaja en video/. Devuélveme el slug, las rutas de la entrega y los bloqueos.`

## 2. Revisar

Lanza **reel-revisor** (o `general-purpose` con `.claude/agents/reel-revisor.md`) con
`Revisa el reel <slug>.` Lee su veredicto.

## 3. Corregir (máximo 2 rondas)

- **CAMBIOS** → pasa el informe completo al mismo creador (SendMessage a su id) para que corrija
  y vuelva a renderizar; luego otra revisión.
- **REHACER** → el creador libera la idea (`ideas.py liberar <n>`) y produce otra (cuenta como ronda).
- Tras 2 rondas sin APROBADO: entrega igualmente, marcado «pendiente de tu visto bueno», con el
  último informe del revisor.

## 4. Entregar

1. `SendUserFile` con `out/entregas/<slug>/<slug>.mp4` y `out/entregas/<slug>/<slug>.pdf`
   (`status: "proactive"`, `display: "attach"`, caption: `<Título> · <duración> · nota <X>/10`).
2. Mensaje final, corto, en español:
   - título, duración y veredicto del revisor (nota y lo mejor del video);
   - la descripción de Instagram de `descripcion-ig.txt` en un bloque de código, lista para copiar;
   - el comentario fijado;
   - bloqueos o avisos (vista previa sin voz, cambios pendientes).
3. `python3.13 scripts/holo/ideas.py hecha <n> --slug <slug>`, copia del PDF en
   `docs/holo/guiones/<slug>.pdf`, commit de todo el reel y
   `git pull --rebase && git push origin claude/create-video-setup-gqurcg` (reintenta si hay conflicto).

Si el disco se llena: borra `out/parts-*` y `out/*-master.mp4` de reels ya entregados.
