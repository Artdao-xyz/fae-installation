export type FormatItem = {
  id: string;
  label: string;
};

export const FORMAT_ITEMS: readonly FormatItem[] = [
  { id: "long-form", label: "Long-form" },
  { id: "short-form", label: "Short-form" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "interactive", label: "Interactive" },
] as const;
