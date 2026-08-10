import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type MyCompProps = {
  title: string;
  subtitle: string;
  bgFrom: string;
  bgTo: string;
};

export const MyComp: React.FC<MyCompProps> = ({
  title,
  subtitle,
  bgFrom,
  bgTo,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title springs in (scale + fade)
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(enter, [0, 1], [0.7, 1]);
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle fades up slightly later
  const subOpacity = interpolate(frame, [18, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [18, 38], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Everything fades out at the end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${bgFrom} 0%, ${bgTo} 100%)`,
        opacity: fadeOut,
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            opacity: titleOpacity,
            color: "white",
            fontSize: 130,
            fontWeight: 800,
            textAlign: "center",
            letterSpacing: -2,
            padding: "0 80px",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            color: "rgba(255,255,255,0.75)",
            fontSize: 48,
            fontWeight: 500,
            marginTop: 28,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
