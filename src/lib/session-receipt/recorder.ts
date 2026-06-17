import type { SessionEvent } from "./types";

type Recorder = (event: SessionEvent) => void;

let recorder: Recorder | null = null;

export function setSessionReceiptRecorder(next: Recorder | null): void {
  recorder = next;
}

export function recordSessionEvent(event: SessionEvent): void {
  const active = recorder;
  if (!active) return;
  queueMicrotask(() => active(event));
}
