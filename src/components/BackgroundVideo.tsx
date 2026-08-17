import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type HlsType from 'hls.js';
import { allowInputMotion, canHover } from '../lib/motion';

/**
 * Overscale on the video wrapper, kept deliberately small.
 *
 * Every percent of scale above 1 upsamples the source. At 1.08 a 1920x1080
 * clip was being blown up past its native resolution on wide screens, which
 * shows badly on footage encoded at only ~2.4 Mbps. At 1.04 the composited
 * layer still stays inside the source resolution on any display up to 1920,
 * so the footage renders at or below 1:1 — as sharp as the file allows.
 */
const OVERSCALE = 1.04;
/** Never drift further than this, however large the window is. */
const MAX_PARALLAX = 14;
/** Length of the loop cross-dissolve, in seconds. */
const CROSSFADE = 1.1;
/** How often the loop driver checks the active clip's remaining time, in ms. */
const DRIVER_MS = 100;

/**
 * Largest safe drift for the current viewport. The overscale leaves a margin of
 * `(OVERSCALE - 1) / 2` on each side; the drift is kept to 80% of it so a
 * narrow window can never expose the black edge behind the video.
 */
function parallaxTravel(): number {
  const margin = ((OVERSCALE - 1) / 2) * 0.8;
  return Math.min(MAX_PARALLAX, window.innerWidth * margin, window.innerHeight * margin);
}

interface BackgroundVideoProps {
  /** `.mp4` is loaded directly; `.m3u8` is loaded through hls.js. */
  src: string;
  className?: string;
}

/**
 * Full-bleed looping background video.
 *
 * Playback is independent of scroll position. For progressive sources the loop
 * is handled by two staggered <video> elements that cross-dissolve into each
 * other, rather than by the `loop` attribute — see `useEffect` below.
 */
export default function BackgroundVideo({ src, className = '' }: BackgroundVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // hls.js attaches to a single element, so streamed sources fall back to the
  // plain `loop` attribute; the cross-dissolve is for progressive files.
  const isHls = src.endsWith('.m3u8');

  /* ---- Source loading ---------------------------------------------------- */
  useEffect(() => {
    const a = aRef.current;
    if (!a) return;

    if (!isHls) {
      for (const el of [a, bRef.current]) {
        if (!el) continue;
        el.src = src;
        el.load();
      }
      return;
    }

    let hls: HlsType | null = null;
    let cancelled = false;

    void import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        a.src = src; // Safari plays HLS natively.
        void a.play().catch(() => {});
        return;
      }
      hls = new Hls({ maxBufferLength: 30, startPosition: 0, autoStartLoad: true });
      hls.on(Hls.Events.MANIFEST_PARSED, () => void a.play().catch(() => {}));
      hls.loadSource(src);
      hls.attachMedia(a);
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src, isHls]);

  /* ---- Seamless loop via cross-dissolve ---------------------------------- */
  useEffect(() => {
    if (isHls) return;
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    // Measured on the supplied clip: its last frame differs from its first by
    // almost as much as the middle of the clip does. It is a hard cut, so the
    // `loop` attribute produces a visible jump every time round. Two staggered
    // elements dissolving into one another hide the seam for *any* footage.
    //
    // The second decoder only runs during the dissolve — about 1.1s in every
    // 12s — so this costs far less than keeping two videos playing throughout.
    const videos: HTMLVideoElement[] = [a, b];
    for (const el of videos) {
      el.loop = false; // the driver owns looping now
      el.style.transition = `opacity ${CROSSFADE}s linear`;
    }
    a.style.opacity = '1';
    b.style.opacity = '0';
    void a.play().catch(() => {});

    let active = 0;
    let swapping = false;
    let swapTimer = 0;

    const driver = window.setInterval(() => {
      const current = videos[active];
      if (swapping) return;

      // Self-healing: a tab that loaded in the background, an iOS interruption
      // or a decoder hiccup can all leave the active clip paused with nothing
      // to restart it. The driver is already running, so it may as well check.
      if (!document.hidden && current.paused) {
        void current.play().catch(() => {});
        return;
      }

      if (!current.duration || !Number.isFinite(current.duration)) return;
      if (current.duration - current.currentTime > CROSSFADE) return;

      swapping = true;
      const next = videos[1 - active];
      next.currentTime = 0;
      void next.play().catch(() => {});
      next.style.opacity = '1';
      current.style.opacity = '0';

      swapTimer = window.setTimeout(() => {
        current.pause();
        current.currentTime = 0;
        active = 1 - active;
        swapping = false;
      }, CROSSFADE * 1000);
    }, DRIVER_MS);

    return () => {
      window.clearInterval(driver);
      window.clearTimeout(swapTimer);
    };
  }, [isHls, src]);

  /* ---- Fade in once the first frames are decodable ----------------------- */
  useEffect(() => {
    const a = aRef.current;
    if (!a) return;
    const onReady = () => setReady(true);
    a.addEventListener('canplay', onReady);
    if (a.readyState >= 3) onReady();
    return () => a.removeEventListener('canplay', onReady);
  }, []);

  /* ---- Stop decoding while the tab is in the background ------------------ */
  useEffect(() => {
    const onVisibility = () => {
      const a = aRef.current;
      const b = bRef.current;
      if (document.hidden) {
        a?.pause();
        b?.pause();
      } else {
        // Only the visible element resumes; the standby one stays parked.
        const visible = [a, b].find((el) => el && el.style.opacity !== '0');
        void visible?.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* ---- Pointer parallax --------------------------------------------------- */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (!canHover() || !allowInputMotion()) return;

    const xTo = gsap.quickTo(wrapper, 'x', { duration: 1.5, ease: 'power2.out' });
    const yTo = gsap.quickTo(wrapper, 'y', { duration: 1.5, ease: 'power2.out' });

    let frame = 0;
    const onMove = (e: MouseEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const travel = parallaxTravel();
        xTo((e.clientX / window.innerWidth - 0.5) * 2 * -travel);
        yTo((e.clientY / window.innerHeight - 0.5) * 2 * -travel);
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const videoClass = 'absolute inset-0 w-full h-full object-cover';

  return (
    <div
      ref={wrapperRef}
      // Keep this scale in step with OVERSCALE above — parallaxTravel() sizes
      // the drift from it.
      className={`fixed top-0 left-0 w-full h-full z-0 scale-[1.04] origin-center bg-black will-change-transform [backface-visibility:hidden] ${className}`}
      aria-hidden="true"
    >
      {/* The stack fades in as a unit, leaving each video's own opacity free to
          drive the loop cross-dissolve. */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <video ref={aRef} muted playsInline preload="auto" loop={isHls} className={videoClass} />
        {!isHls && <video ref={bRef} muted playsInline preload="auto" className={videoClass} />}
      </div>

      {/* Both gradients on one element: two stacked full-screen overlays meant
          two extra composited layers over the video. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(120% 80% at 50% 40%, transparent 25%, rgba(0,0,0,0.55) 100%),' +
            'linear-gradient(to bottom, rgba(0,0,0,0.62), rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.72))',
        }}
      />
    </div>
  );
}
