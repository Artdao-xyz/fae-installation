/** Inline SVGs — swap paths when final format assets land in `public/svg/`. */

export function FormatLongFormIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
      <path
        d="M1 2h18M1 7h12M1 12h18"
        stroke="currentColor"
        strokeWidth={0.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FormatShortFormIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
      <path
        d="M1 3h18M1 8h10"
        stroke="currentColor"
        strokeWidth={0.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FormatAudioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
      <path
        d="M6 4v6M8 2v10M10 5v4M12 3v8M14 6v2"
        stroke="currentColor"
        strokeWidth={0.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FormatVideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
      <rect
        x={1}
        y={2}
        width={12}
        height={10}
        rx={0.5}
        stroke="currentColor"
        strokeWidth={0.75}
      />
      <path
        d="M14 5l4 2.5v-1L14 9V5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FormatInteractiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
      <rect
        x={1}
        y={1}
        width={8}
        height={6}
        rx={0.5}
        stroke="currentColor"
        strokeWidth={0.75}
      />
      <rect
        x={11}
        y={7}
        width={8}
        height={6}
        rx={0.5}
        stroke="currentColor"
        strokeWidth={0.75}
      />
      <path
        d="M12 3h3M13.5 1.5v3"
        stroke="currentColor"
        strokeWidth={0.75}
        strokeLinecap="round"
      />
    </svg>
  );
}
