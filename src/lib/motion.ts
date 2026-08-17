/**
 * Motion policy for the whole site.
 *
 * `prefers-reduced-motion` is a blunt instrument on Windows: it follows the
 * OS-wide "Animation effects" toggle, which plenty of people switch off for
 * perceived performance rather than because motion makes them unwell. Treating
 * it as "disable everything" silently strips the site of its entire character
 * for those visitors.
 *
 * So the policy distinguishes two kinds of motion:
 *
 * - **Ambient** — plays on its own with no input at all. The marquee. This is
 *   what the reduced-motion setting is really aimed at, and it stays disabled.
 * - **Input-driven** — only ever moves in direct response to the visitor's own
 *   pointer or scroll: the glass tilt, the cursor glare, the parallax drift,
 *   the scrubbed reveals. Nothing here moves unless the visitor moves first,
 *   so it stays on.
 *
 * If you want the strict interpretation instead, make `allowInputMotion`
 * return `!prefersReducedMotion()` — every effect on the site routes through
 * these three functions.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when there is a real hovering pointer — a mouse or trackpad. */
export function canHover(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Motion that plays by itself. Suppressed when reduced motion is requested. */
export function allowAmbientMotion(): boolean {
  return !prefersReducedMotion();
}

/** Motion that only responds to the visitor's own pointer or scroll. */
export function allowInputMotion(): boolean {
  return true;
}
