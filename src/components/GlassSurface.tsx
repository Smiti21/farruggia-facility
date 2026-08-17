import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import gsap from 'gsap';
import { allowInputMotion, canHover } from '../lib/motion';

interface GlassSurfaceProps {
  children: ReactNode;
  /** Layout classes for the outer wrapper. This is what scroll animations move. */
  className?: string;
  /** Classes for the glass pane itself. This is what tilts. */
  panelClassName?: string;
  /** Maximum tilt in degrees at the pane's edges. */
  tilt?: number;
  /** Maximum pointer-follow translation in px. */
  lift?: number;
  /** Show the specular highlight that tracks the cursor. */
  glare?: boolean;
  /** Diameter of that highlight. */
  glareSize?: number;
  style?: CSSProperties;
}

/**
 * A pane of liquid glass.
 *
 * Tilt is measured against the pane's *own* bounds, so each surface behaves
 * like a separate physical object: it leans toward the cursor while the
 * pointer is over it and settles level when the pointer leaves. A soft
 * specular highlight follows the cursor across the surface.
 *
 * Two nested elements matter here — the wrapper carries scroll animation, the
 * pane carries pointer animation. Keeping them apart means GSAP never has two
 * sources fighting over one transform.
 */
export default function GlassSurface({
  children,
  className = '',
  panelClassName = '',
  tilt = 4,
  lift = 12,
  glare = true,
  glareSize = 520,
  style,
}: GlassSurfaceProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);
  const [pointerCapable, setPointerCapable] = useState(canHover);

  // Drop the backdrop-filter on panes that are well away from the viewport.
  // Defaults to "on screen" so that if IntersectionObserver never runs, the
  // panes simply stay blurred rather than rendering flat.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => pane.classList.toggle('is-offscreen', !entry.isIntersecting),
      // Generous margin: the blur must already be on before a pane scrolls in,
      // or the transition would be visible at the edge of the screen.
      { rootMargin: '60% 0px 60% 0px' },
    );

    observer.observe(pane);
    return () => observer.disconnect();
  }, []);

  // Input capability is not fixed for the life of the page: a 2-in-1 docking a
  // mouse, or a browser that reports touch at load and a trackpad a moment
  // later, both flip this. Watching the query means the tilt switches on when
  // a pointer appears instead of staying dead until a reload.
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = () => setPointerCapable(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    // Tilt is meaningless without a hovering pointer. It is input-driven —
    // the pane only moves while the visitor's cursor is on it — so it is not
    // gated on prefers-reduced-motion. See src/lib/motion.ts.
    if (!pointerCapable || !allowInputMotion()) return;

    const opts = { duration: 0.9, ease: 'power3.out' };
    const rotX = gsap.quickTo(pane, 'rotationX', opts);
    const rotY = gsap.quickTo(pane, 'rotationY', opts);
    const moveX = gsap.quickTo(pane, 'x', opts);
    const moveY = gsap.quickTo(pane, 'y', opts);

    // The highlight is translated, never repositioned via the gradient itself.
    const glareEl = glareRef.current;
    const glareX = glareEl ? gsap.quickTo(glareEl, 'x', { duration: 0.5, ease: 'power2.out' }) : null;
    const glareY = glareEl ? gsap.quickTo(glareEl, 'y', { duration: 0.5, ease: 'power2.out' }) : null;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;

      // One layout read per frame, and only for the pane under the cursor.
      const r = pane.getBoundingClientRect();
      if (!r.width || !r.height) return;

      const px = (pending.x - r.left) / r.width - 0.5; // -0.5 … 0.5
      const py = (pending.y - r.top) / r.height - 0.5;

      rotY(px * tilt * 2);
      rotX(-py * tilt * 2);
      moveX(px * lift * 2);
      moveY(py * lift * 2);

      // Pixel offsets within the pane — a compositor-only transform.
      glareX?.((px + 0.5) * r.width);
      glareY?.((py + 0.5) * r.height);

      // Revealed here rather than on pointerenter: the highlight parks at the
      // pane's top-left corner until it has a position, so fading it in any
      // earlier would flash it in the corner for a frame.
      if (glare) pane.style.setProperty('--glare-opacity', '1');
    };

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onEnter = () => {
      // Promote to its own layer only for the duration of the interaction.
      // The glare reveals itself in apply(), once it has a position.
      pane.classList.add('is-interacting');
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      pending = null;
      if (glare) pane.style.setProperty('--glare-opacity', '0');
      // Drop the layer once the settle-back animation has finished.
      window.setTimeout(() => pane.classList.remove('is-interacting'), 1000);
      // Reuse the same quickTo setters rather than a fresh gsap.to, so the
      // settle-back never has to overwrite the tweens driving the tilt.
      rotX(0);
      rotY(0);
      moveX(0);
      moveY(0);
    };

    pane.addEventListener('pointermove', onMove, { passive: true });
    pane.addEventListener('pointerenter', onEnter);
    pane.addEventListener('pointerleave', onLeave);

    return () => {
      pane.removeEventListener('pointermove', onMove);
      pane.removeEventListener('pointerenter', onEnter);
      pane.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tilt, lift, glare, pointerCapable]);

  return (
    <div className={className} style={{ perspective: '1000px', ...style }}>
      <div
        ref={paneRef}
        className={`glass-surface ${panelClassName}`}
        style={glare ? ({ '--glare-size': `${glareSize}px` } as CSSProperties) : undefined}
      >
        {glare && <span ref={glareRef} className="glass-glare" aria-hidden="true" />}
        {children}
      </div>
    </div>
  );
}
