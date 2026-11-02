// Shape of a reel's guion.json — the single source for the narration, the
// scene list, the PDF (scripts/holo/make_guion_pdf.py) and the Instagram post.

export type Escena = {
  /** Narration of this scene, exactly as the voice reads it. */
  texto: string;
  /** Storyboard of this sentence (Spanish): the drawing that tells it, what changes on which word, labels. */
  imagen: string;
};

export type Guion = {
  numero: number;
  /** Folder and file name: "NN-palabra-clave". */
  slug: string;
  titulo: string;
  /** Number of the idea in docs/holo/ideas.json (0 if it is a new one). */
  idea: number;
  /** Why this idea, why now (trend, season, news). */
  por_que: string;
  /** Art direction (FORMATO.md §10) and why it fits the topic. */
  direccion_arte?: string;
  /** Voice used for this reel when it differs from scripts/holo/voz.json (same shape). */
  voz?: { voz: string; model_id: string; voice_settings: { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean; speed: number }; output_format?: string };
  bloques: { nombre: string; escenas: Escena[] }[];
  /** Words shown in the gold caption box (bold in the PDF). */
  palabras_clave: string[];
  /** End card: question with one boxed word, and the call to action. */
  cierre: { pregunta: string; clave: string; cta: string };
  fuentes: { texto: string; urls: string[] }[];
  instagram: { descripcion: string; hashtags: string[]; comentario_fijado: string };
};
