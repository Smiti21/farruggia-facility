import { useEffect } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrubRiseOptions {
  /** Selector for the elements to rise, resolved inside the container. */
  targets?: string;
  /** Distance in px the elements start below their resting place. */
  distance?: number;
  /**
   * Start offset as a percentage of the element's own height. Takes precedence
   * over `distance`. Use this for masked word reveals, where the slide must
   * scale with the font size rather than being a fixed pixel drop.
   */
  yPercent?: number;
  /** Start opacity. */
  fade?: number;
  start?: string;
  end?: string;
  scrub?: number;
  stagger?: number;
}

/**
 * Rises elements into place tied directly to scroll position.
 *
 * Unlike a one-shot reveal this is scrubbed, so scrolling back up plays it in
 * reverse — the whole page keeps one continuous rhythm rather than a series of
 * animations that fire once and freeze.
 */
export function useScrubRise(
  containerRef: RefObject<HTMLElement | null>,
  {
    targets,
    distance = 72,
    yPercent,
    fade = 0,
    start = 'top bottom',
    end = 'top 55%',
    // Kept low on purpose. useSmoothScroll already eases the scroll position
    // itself, so a long scrub smooths an already-smoothed signal and the result
    // reads as lag rather than polish.
    scrub = 0.6,
    stagger = 0,
  }: ScrubRiseOptions = {},
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const nodes = targets
        ? gsap.utils.toArray<HTMLElement>(targets)
        : [container];
      if (!nodes.length) return;

      const from =
        yPercent !== undefined
          ? { yPercent, opacity: fade }
          : { y: distance, opacity: fade };
      const to = yPercent !== undefined ? { yPercent: 0 } : { y: 0 };

      gsap.fromTo(
        nodes,
        from,
        {
          ...to,
          opacity: 1,
          ease: 'none',
          stagger,
          scrollTrigger: { trigger: container, start, end, scrub },
        },
      );
    }, container);

    return () => ctx.revert();
  }, [containerRef, targets, distance, yPercent, fade, start, end, scrub, stagger]);
}
