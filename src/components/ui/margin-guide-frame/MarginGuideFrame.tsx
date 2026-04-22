import { Z_INDEX } from "@/lib/z-index-scale";

type MarginGuideFrameProps = {
  className?: string;
};

const insetVar = "var(--inset-margin-guide)";

const DASH = 6;
const GAP = 6;
const period = DASH + GAP;

const horizontalDashes = `repeating-linear-gradient(to right, var(--color-ink-primary) 0 ${DASH}px, transparent ${DASH}px ${period}px)`;
const verticalDashes = `repeating-linear-gradient(to bottom, var(--color-ink-primary) 0 ${DASH}px, transparent ${DASH}px ${period}px)`;

const edge = "pointer-events-none fixed";
const edgeZStyle = { zIndex: Z_INDEX.marginGuide } as const;

export function MarginGuideFrame({ className = "" }: MarginGuideFrameProps) {
  return (
    <div className={`contents ${className}`} aria-hidden>
      <div
        className={`${edge} h-px`}
        style={{
          ...edgeZStyle,
          top: insetVar,
          left: 0,
          right: 0,
          background: horizontalDashes,
        }}
      />
      <div
        className={`${edge} h-px`}
        style={{
          ...edgeZStyle,
          bottom: insetVar,
          left: 0,
          right: 0,
          background: horizontalDashes,
        }}
      />
      <div
        className={`${edge} w-px`}
        style={{
          ...edgeZStyle,
          left: insetVar,
          top: 0,
          bottom: 0,
          background: verticalDashes,
        }}
      />
      <div
        className={`${edge} w-px`}
        style={{
          ...edgeZStyle,
          right: insetVar,
          top: 0,
          bottom: 0,
          background: verticalDashes,
        }}
      />
    </div>
  );
}
