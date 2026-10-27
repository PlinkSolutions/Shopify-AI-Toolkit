// Narration of "¿Por qué no puedes hacerte cosquillas a ti mismo?", one entry
// per scene, exactly as read in public/holo/tickle/voice.wav. Kept free of
// imports so scripts/holo/align_words.mjs can load it on its own.
export const SEGMENTS: string[] = [
  "¿Por qué no puedes hacerte cosquillas a ti mismo?",
  "¿Y por qué basta con que alguien acerque la mano… para que te rías antes de que te toque?",
  "No es que tu piel falle. Es que tu cerebro sabe lo que vas a hacer… antes de que lo hagas.",
  "Piénsalo así: cuando mueves la mano, tu cerebelo copia la orden, predice lo que vas a sentir… y apaga la sensación.",
  "Tus propias cosquillas son un mensaje que tu cerebro ya leyó.",
  "Pero si la mano es de otra persona, no hay predicción.",
  "Y pasan tres cosas: la señal llega completa… el hipotálamo, una zona que controla tus reacciones automáticas, se enciende… y tu cuerpo estalla en risa.",
  "Investigadores de la Universidad de Friburgo lo vieron con resonancia magnética:",
  "el hipotálamo se activa incluso antes del contacto, solo con anticipar las cosquillas.",
  "Pero aquí viene lo curioso.",
  "En el University College London, la neurocientífica Sarah-Jayne Blakemore hizo que voluntarios se hicieran cosquillas con un robot.",
  "Si el robot copiaba su movimiento al instante, las sentían mucho menos… pero con un pequeño retraso, volvían. Cuanto más retraso, más cosquillas.",
  "Y no somos los únicos. En la Universidad Humboldt de Berlín vieron que las ratas también se ríen con las cosquillas, con un sonido que no podemos oír…",
  "pero si tenían miedo, las cosquillas desaparecían.",
  "Los científicos creen que en nosotros pasa algo parecido. Las cosquillas no son solo un juego… son una señal de confianza. Tu cerebro solo se deja sorprender por alguien con quien se siente a salvo.",
  "Mándaselo a esa persona que sabe exactamente dónde tienes cosquillas.",
];

/** Script words in reading order (the unit every timing refers to). */
export const scriptWords = () => SEGMENTS.flatMap((s, seg) => s.split(/\s+/).filter(Boolean).map((text) => ({ text, seg })));
