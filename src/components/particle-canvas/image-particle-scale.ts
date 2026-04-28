/**
 * Idle transform scale uses a small frame box; spread uses lg outer. Match rendered
 * width across the swap: scale = target visual width / current layout width.
 */
export function scaleForTargetVisualWidth(
  targetVisualWidthPx: number,
  layoutWidthPx: number,
): number {
  const lw = Math.max(1e-3, layoutWidthPx);
  return Math.max(0, targetVisualWidthPx / lw);
}
