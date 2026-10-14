import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import * as M from "./models";
import { IconStage } from "./studio";

// Review sheet: one icon per frame, settled pose, on the reel's wall colour.
export const ICONS: [string, React.FC][] = [
  ["Ghost", M.Ghost],
  ["Coin", M.Coin],
  ["Camera", M.Camera],
  ["Clapper", M.Clapper],
  ["Star", M.Star],
  ["Stairs", M.Stairs],
  ["GradCap", M.GradCap],
  ["PersonPlus", M.PersonPlus],
  ["PromptCard", M.PromptCard],
  ["Phone", M.Phone],
  ["PlayButton", M.PlayButton],
  ["Mic", M.Mic],
  ["Scissors", M.Scissors],
  ["CoinStack", M.CoinStack],
  ["Warning", M.Warning],
  ["SameFace", M.SameFace],
  ["Robot", M.Robot],
  ["Retry", M.Retry],
  ["Target", M.Target],
  ["Compass", M.Compass],
  ["PlinkBadge", M.PlinkBadge],
  ["ChatBubble", M.ChatBubble],
  ["PaperPlane", M.PaperPlane],
];

export const IconGallery: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#e9b6cf" }}>
    {ICONS.map(([name, Icon], i) => (
      <Sequence key={name} from={i} durationInFrames={1} layout="none">
        <IconStage size={600} settled>
          <Icon />
        </IconStage>
      </Sequence>
    ))}
  </AbsoluteFill>
);
