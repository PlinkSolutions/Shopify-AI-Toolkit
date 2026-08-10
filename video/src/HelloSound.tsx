import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HelloSoundProps = {
  text: string;
  audioFile: string; // file name inside the public/ folder
};

export const HelloSound: React.FC<HelloSoundProps> = ({ text, audioFile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const scale = interpolate(enter, [0, 1], [0.9, 1]);
  const opacity = interpolate(
    frame,
    [0, 18, durationInFrames - 18, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Plays the audio from the public/ folder */}
      <Audio src={staticFile(audioFile)} />

      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          color: "#ffffff",
          fontSize: 170,
          fontWeight: 700,
          textShadow: "0 0 30px rgba(255,255,255,0.4)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
