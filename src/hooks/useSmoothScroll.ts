import { useEffect } from 'react';
import gsap from 'gsap';
import { allowInputMotion, canHover } from '../lib/motion';

/** How much of the remaining distance is covered each frame. Lower = heavier. */
const EASE = 0.11;
/** Below this many pixels the glide is finished. */
const SETTLE = 0.4;
/** Tolerance for deciding that something other than us moved the scroll. */
const DESYNC = 2;

function maxScroll(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/**
 * Returns true when the wheel event started inside an element that can still
 * scroll in that direction — the glass panel's accordion, for instance. Those
 * keep native scrolling so we never trap the pointer.
 */
function overNestedScroller(node: EventTarget | null, delta: number): boolean {
  let el = node instanceof HTMLElement ? node : null;

  while (el && el !== document.body && el !== document.documentElement) {
    const overflowY = getComputedStyle(el).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if (!(delta < 0 && atTop) && !(delta > 0 && atBottom)) return true;
    }
    el = el.parentElement;
  }

  return false;
}

/** Normalises the three deltaMode units browsers may report into pixels. */
function deltaPixels(e: WheelEvent): number {
  if (e.deltaMode === 1) return e.deltaY * 16; // lines
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight; // pages
  return e.deltaY;
}

/**
 * Adds weighted, gliding wheel scrolling on desktop.
 *
 * Wheel events are intercepted and fed into a target position that the page
 * eases toward on GSAP's ticker, so a notchy mouse wheel produces continuous
 * motion instead of 100px jumps. Touch devices are left alone — their native
 * momentum scrolling is already smooth, and overriding it feels worse.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    // Wheel-driven, so it counts as input motion. See src/lib/motion.ts.
    if (!canHover() || !allowInputMotion()) return;

    let target = window.scrollY;
    let current = target;
    let running = false;

    const stop = () => {
      running = false;
      gsap.ticker.remove(tick);
    };

    function tick() {
      // A nav tween, keyboard or anchor jump moved the page: hand control back.
      if (Math.abs(window.scrollY - current) > DESYNC) {
        current = window.scrollY;
        target = current;
        stop();
        return;
      }

      target = Math.min(target, maxScroll());
      current += (target - current) * EASE;

      if (Math.abs(target - current) < SETTLE) {
        current = target;
        stop();
      }

      window.scrollTo(0, current);
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      if (overNestedScroller(e.target, e.deltaY)) return;

      e.preventDefault();

      // The visitor grabbing the wheel outranks any in-flight nav animation.
      gsap.killTweensOf(window);

      if (!running) {
        current = window.scrollY;
        target = current;
      }

      target = Math.max(0, Math.min(maxScroll(), target + deltaPixels(e)));

      if (!running) {
        running = true;
        gsap.ticker.add(tick);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      stop();
    };
  }, []);
}
