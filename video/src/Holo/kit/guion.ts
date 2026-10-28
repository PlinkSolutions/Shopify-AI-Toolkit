// Shape of a reel's guion.json — the single source for the narration, the
// scene list, the PDF (scripts/holo/make_guion_pdf.py) and the Instagram post.

export type Escena = {
  /** Narration of this scene, exactly as the voice reads it. */
  texto: string;
  /** What the scene shows (Spanish, for the PDF and the reviewer). */
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
  bloques: { nombre: string; escenas: Escena[] }[];
  /** Words shown in the gold caption box (bold in the PDF). */
  palabras_clave: string[];
  /** End card: question with one boxed word, and the call to action. */
  cierre: { pregunta: string; clave: string; cta: string };
  fuentes: { texto: string; urls: string[] }[];
  instagram: { descripcion: string; hashtags: string[]; comentario_fijado: string };
};
