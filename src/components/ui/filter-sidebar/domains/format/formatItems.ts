import type { ComponentType } from "react";
import {
  FormatAudioIcon,
  FormatInteractiveIcon,
  FormatLongFormIcon,
  FormatShortFormIcon,
  FormatVideoIcon,
} from "./FormatIcons";

export type FormatItem = {
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

export const FORMAT_ICON_ITEMS: readonly FormatItem[] = [
  { id: "long-form", label: "Long-form", Icon: FormatLongFormIcon },
  { id: "short-form", label: "Short-form", Icon: FormatShortFormIcon },
  { id: "audio", label: "Audio", Icon: FormatAudioIcon },
  { id: "video", label: "Video", Icon: FormatVideoIcon },
  { id: "interactive", label: "Interactive", Icon: FormatInteractiveIcon },
] as const;
