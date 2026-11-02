import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Capsule, Cam, HoloStage, V3 } from "../../stage";
import { Chip } from "../../kit/hud";
import { beat, Scene } from "../../kit/timeline";

// One scene per narration segment. Every beat (a label typing in, a toggle
// flipping, a signal travelling) is keyed to the word that triggers it.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
const cam = (sc: Scene, from: V3, to: V3, target: V3, orbit = 0.14): Cam => ({ from, to, target, orbit, dur: sc.dur });

type P = { sc: Scene };

// 1 — "¿Por qué los niños se vuelven locos después de comer dulces?"
// TODO: Fondo degradado rosa caramelo. Un niño-bolita brillante con disfraz de calabaza junto a una montaña de caramelos envueltos y piruletas. En «locos» rebota de un lado a otro dejando una estela; etiqueta HIPERACTIVO.
export const S01: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "¿Por");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 1
      </Chip>
    </AbsoluteFill>
  );
};

// 2 — "Casi todo el mundo te dirá que es el azúcar."
// TODO: Un cubo de azúcar gigante y brillante en el centro; flechas desde todos los lados lo señalan. En «azúcar» se le cuelga la etiqueta CULPABLE.
export const S02: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Casi");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 2
      </Chip>
    </AbsoluteFill>
  );
};

// 3 — "Pues no."
// TODO: Cae un sello rojo FALSO sobre la etiqueta CULPABLE; el cubo se encoge y el fondo pasa de rosa a azul menta.
export const S03: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Pues");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 3
      </Chip>
    </AbsoluteFill>
  );
};

// 4 — "En un estudio, unas familias siguieron tres dietas, de tres semanas cada una:"
// TODO: Tres platos con campana brillante en fila, cada uno con su calendario (SEMANA 1, 2, 3). En «tres dietas» se levantan las tres campanas a la vez.
export const S04: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "En");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 4
      </Chip>
    </AbsoluteFill>
  );
};

// 5 — "una llena de azúcar y dos con endulzantes. Nadie sabía cuál le tocaba."
// TODO: Dentro: un plato con cubos de azúcar rosas y dos con sobres de endulzante azul menta. En «nadie sabía» las campanas bajan y se barajan como en el juego del vasito, con un signo de interrogación encima.
export const S05: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "una");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 5
      </Chip>
    </AbsoluteFill>
  );
};

// 6 — "Ni los niños que, según sus papás, eran sensibles al azúcar… se portaron distinto."
// TODO: Tres niños-bolita, cada uno bajo un medidor de CONDUCTA (una dieta por niño). En «sensibles» les aparece la etiqueta SENSIBLE AL AZÚCAR; en «distinto» las tres agujas se alinean en el mismo punto y aparece 39 MEDICIONES · SIN CAMBIOS.
export const S06: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Ni");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 6
      </Chip>
    </AbsoluteFill>
  );
};

// 7 — "Entonces, ¿qué está pasando?"
// TODO: Una lupa gigante barre la escena y se detiene sobre una mamá-bolita (más grande, con lentes) que mira a su hijo.
export const S07: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Entonces,");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 7
      </Chip>
    </AbsoluteFill>
  );
};

// 8 — "Otros científicos les dijeron a unas mamás que sus hijos habían tomado mucha azúcar."
// TODO: Le entregan a la mamá un vaso brillante con la etiqueta AZÚCAR. En «mucha azúcar» se le llena de cubos rosas la burbuja de pensamiento.
export const S08: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Otros");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 8
      </Chip>
    </AbsoluteFill>
  );
};

// 9 — "Era mentira: todos tomaron un endulzante sin azúcar."
// TODO: En «mentira» la etiqueta AZÚCAR del vaso se despega y debajo aparece SIN AZÚCAR en azul menta.
export const S09: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Era");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 9
      </Chip>
    </AbsoluteFill>
  );
};

// 10 — "Aun así, esas mamás vieron a sus hijos más inquietos… y los vigilaban más de cerca."
// TODO: Pantalla partida. Arriba, a través de unas gafas rosas (lo que la mamá espera), el niño rebota sin parar y su medidor INQUIETO se dispara en «inquietos»; abajo, sin gafas, el mismo niño juega tranquilo. En «más de cerca» la mamá se pega al niño con un foco encima: CONTROL +.
export const S10: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Aun");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 10
      </Chip>
    </AbsoluteFill>
  );
};

// 11 — "Y cuando juntaron todos los experimentos que había, el azúcar no cambió la conducta de los niños."
// TODO: Una pila de fichas de experimentos cae sobre una balanza con un cubo de azúcar en un plato y un sobre de endulzante en el otro. En «no cambió» la balanza queda perfectamente nivelada y una línea plana cruza la gráfica de CONDUCTA.
export const S11: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Y");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 11
      </Chip>
    </AbsoluteFill>
  );
};

// 12 — "Así que los científicos creen que lo que los acelera no son los dulces: es la fiesta, los disfraces, los otros niños…"
// TODO: Vuelve el niño-calabaza del inicio sobre el degradado rosa. En «fiesta» aparecen globos y confeti; en «disfraces» capas y antifaces; en «otros niños» entran rebotando más niños-bolita.
export const S12: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Así");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 12
      </Chip>
    </AbsoluteFill>
  );
};

// 13 — "y lo que nosotros esperamos ver."
// TODO: Las gafas rosas de la mamá bajan sobre toda la pantalla y la escena entera se tiñe de rosa caramelo.
export const S13: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "y");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 13
      </Chip>
    </AbsoluteFill>
  );
};

// 14 — "Envíaselo a quien no deja que los niños coman dulces porque se ponen locos."
// TODO: Un móvil brillante comparte el video con TÍA. En «locos» el sello FALSO cae dentro del chat.
export const S14: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Envíaselo");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 14
      </Chip>
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14];
