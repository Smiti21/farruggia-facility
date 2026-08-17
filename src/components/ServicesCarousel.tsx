import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Leaf, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ServiceMotif from './ServiceMotifs';
import { useLanguage } from './LanguageContext';
import { subscribeToDeviceTilt } from '../lib/deviceTilt';
import { allowInputMotion, canHover } from '../lib/motion';
import type { ServiceItem, ServiceKey } from '../translations';

const ICONS: Record<ServiceKey, LucideIcon> = {
  technical: Wrench,
  security: ShieldCheck,
  landscaping: Leaf,
  other: Sparkles,
};

/**
 * Parallel slices that give each card real volumetric thickness. Stacking a few
 * layers a fraction of a pixel apart reads as a solid object with an edge, which
 * a single flat div never does once it rotates.
 */
const THICKNESS = [-1.47, -0.73, 0, 0.73, 1.47];

/** Perspective distance. The peek maths below depends on this exact value. */
const PERSPECTIVE = 1350;
/**
 * Scroll distance the section stays pinned for, per card, as a fraction of the
 * viewport height. Four cards at 0.75 means the section holds the screen for
 * roughly three viewports before releasing.
 */
const SCROLL_PER_CARD = 0.75;
/** How quickly the cylinder chases the scroll position. Lower is heavier. */
const FOLLOW = 0.12;
/**
 * Gap between the centre card and its neighbours.
 *
 * 36 is the balance point. Lower and the neighbour collides with the centre
 * card, which is magnified 1.4x by perspective and so much taller than it
 * looks; higher and it collides with the card leaving the frame behind it.
 */
const GAP = 36;
/**
 * Exponent on the departing card's travel. 1.0 sends it off immediately and
 * leaves the stage sparse; 2.2 keeps it around but lets the neighbour catch up
 * to it. 1.5 holds it in frame without the two ever meeting.
 */
const EXIT_EASE = 1.5;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export default function ServicesCarousel() {
  const { tList } = useLanguage();
  const items = tList<ServiceItem>('services.items');
  const cardCount = items.length;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameId = useRef(0);

  const progress = useRef(0);
  /** Where the scrollbar says the cylinder should be. */
  const targetProgress = useRef(0);
  const tilt = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  // Defaults to visible so that if IntersectionObserver never reports (or is
  // unavailable) the carousel still animates. Defaulting to false would leave
  // it frozen with no way to recover.
  const visible = useRef(true);

  const [metrics, setMetrics] = useState({ cardW: 340, cardH: 243 });

  /* ---- Responsive card size --------------------------------------------- */
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      let cardW = Math.round(w * 0.2 + 150);
      // Shrink on short viewports so three cards still fit vertically.
      cardW = Math.round(cardW * Math.min(1, Math.max(0.66, h / 880)));
      cardW = Math.min(380, Math.max(232, cardW));

      // Taller than a bank card's 1.59 — these hold a heading and a paragraph.
      setMetrics({ cardW, cardH: Math.round(cardW / 1.4) });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  /* ---- Tilt input: cursor on desktop, the handset itself on phones -------- */
  useEffect(() => {
    if (!allowInputMotion()) return;

    if (canHover()) {
      const onMove = (e: MouseEvent) => {
        tilt.current.targetX = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)));
        tilt.current.targetY = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)));
      };
      const onLeave = () => {
        tilt.current.targetX = 0;
        tilt.current.targetY = 0;
      };

      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
      return () => {
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseleave', onLeave);
      };
    }

    // No cursor: the gyroscope drives exactly the same two variables.
    return subscribeToDeviceTilt((x, y) => {
      tilt.current.targetX = x;
      tilt.current.targetY = y;
    });
  }, []);

  /* ---- Only animate while the section is actually on screen -------------- */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') {
      visible.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { rootMargin: '10% 0px' },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /* ---- Pin the section and let the scrollbar drive the cylinder ---------- */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    if (!wrapper || !stage || cardCount < 2) return;

    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top top',
      // The pin length is what the visitor scrolls through while the section
      // holds the screen. Expressed as a function so it re-measures on resize.
      end: () => `+=${window.innerHeight * SCROLL_PER_CARD * cardCount}`,
      pin: stage,
      pinSpacing: true,
      // Lets ScrollTrigger apply the pin a fraction early, which removes the
      // one-frame jump you otherwise get at high scroll speeds.
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Map 0…1 across the pin onto card 0 → last card, so the section
        // releases exactly as the final card settles at the front.
        targetProgress.current = self.progress * (cardCount - 1);
      },
    });

    return () => trigger.kill();
  }, [cardCount]);

  /* ---- Render loop -------------------------------------------------------- */
  useEffect(() => {
    if (!cardCount) return;
    const { cardH } = metrics;

    const tick = () => {
      frameId.current = requestAnimationFrame(tick);

      // Off-screen: skip all the work, but keep the loop alive so it resumes
      // the moment the section scrolls back in.
      if (!visible.current) return;

      // Chase the scroll position rather than advancing on a timer. The easing
      // here is what keeps the cylinder feeling weighted instead of welded to
      // the scrollbar.
      progress.current += (targetProgress.current - progress.current) * FOLLOW;

      // Inertia — the tilt lags the cursor rather than snapping to it.
      tilt.current.x += (tilt.current.targetX - tilt.current.x) * 0.08;
      tilt.current.y += (tilt.current.targetY - tilt.current.y) * 0.08;

      const stage = stageRef.current;
      const h = stage?.clientHeight ?? window.innerHeight;

      const continuous = progress.current;
      const rounded = Math.round(continuous);
      const diff = continuous - rounded;
      // Non-linear step: the carousel dwells at each card before accelerating
      // to the next, instead of drifting at a constant rate.
      const eased = Math.sign(diff) * Math.pow(Math.abs(diff) * 2, 4.2) / 2;
      const active = rounded + eased;

      for (let i = 0; i < cardCount; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        // Wrap to the nearest representation around the cylinder.
        let offset = i - active;
        const half = cardCount / 2;
        while (offset > half) offset -= cardCount;
        while (offset < -half) offset += cardCount;

        const abs = Math.abs(offset);
        const sign = Math.sign(offset);

        if (abs > 3) {
          card.style.visibility = 'hidden';
          continue;
        }
        card.style.visibility = 'visible';

        let y = 0;
        let z = 0;
        let rot = 0;

        if (abs <= 1) {
          const t = smoothstep(abs);
          y = -sign * (t * (cardH + GAP));
          z = 400 + t * (220 - 400);
          rot = t * 132;
        } else {
          // offset 1 → 2: the neighbour continues past the edge and out of
          // sight.
          //
          // With four cards, offset 2 is the far side of the cylinder — the
          // same slot as offset -2 — so a card there has to be off-screen.
          // Parking it at the stage edge instead (as a five-card carousel can
          // afford to) puts two cards on the same side of the centre, and they
          // overlapped by ~47px at every settled position.
          const t = smoothstep(Math.min(abs - 1, 1));
          const zEnd = -250;
          const rotEnd = 195;

          // Perspective-aware: solve for the offset that puts the card a full
          // card-height beyond the stage boundary at its final depth.
          const scaleEnd = PERSPECTIVE / (PERSPECTIVE - zEnd);
          const yEnd = (h / 2 + cardH) / scaleEnd + cardH / 2;

          // Travel is eased harder than depth, so the card hangs near the stage
          // edge rather than leaving as soon as it passes the neighbour.
          const tTravel = Math.pow(t, EXIT_EASE);

          y = -sign * ((cardH + GAP) + tTravel * (yEnd - (cardH + GAP)));
          z = 220 + t * (zEnd - 220);
          rot = 132 + t * (rotEnd - 132);
        }

        // Interactive tilt applies only to the card at the front.
        const centreFactor = Math.max(0, 1 - abs);
        const tiltX = -tilt.current.y * 14 * centreFactor;
        const tiltY = tilt.current.x * 18 * centreFactor;

        card.style.zIndex = Math.round(z).toString();
        // Drives the specular band. Scaled by centreFactor so only the card
        // facing the viewer catches the light; the ones turning away keep a
        // still highlight, which is how real glass behaves off-axis.
        card.style.setProperty('--sheen', (tilt.current.x * 70 * centreFactor).toFixed(1));
        card.style.transform =
          `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) ` +
          `rotateX(${(-sign * rot + tiltX).toFixed(2)}deg) ` +
          `rotateY(${tiltY.toFixed(2)}deg) rotateZ(-3deg)`;
      }
    };

    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
  }, [metrics, cardCount]);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Full-viewport while pinned, so nothing else competes for attention
          while the visitor scrolls through the cards. */}
      <div
        ref={stageRef}
        className="relative w-full h-screen flex items-center justify-center overflow-hidden"
        style={{ perspective: `${PERSPECTIVE}px` }}
      >
      <div
        className="absolute"
        style={{
          width: `${metrics.cardW}px`,
          height: `${metrics.cardH}px`,
          transformStyle: 'preserve-3d',
        }}
      >
        {items.map((item, i) => {
          const Icon = ICONS[item.key];
          return (
            <div
              key={item.key}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="absolute inset-0"
              style={{
                width: `${metrics.cardW}px`,
                height: `${metrics.cardH}px`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'visible',
              }}
            >
              {THICKNESS.map((zOffset, layer) => {
                const isFront = layer === THICKNESS.length - 1;
                const isBack = layer === 0;

                // Structural middle slices — these are the visible "edge".
                if (!isFront && !isBack) {
                  return (
                    <div
                      key={layer}
                      className="absolute inset-0 rounded-[18px] pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(120,120,120,0.55)',
                        transform: `translateZ(${zOffset}px)`,
                      }}
                    />
                  );
                }

                if (isFront) {
                  return (
                    <div
                      key={layer}
                      className="absolute inset-0 rounded-[18px] overflow-hidden pointer-events-none border border-white/15"
                      style={{
                        // A translucent fill rather than backdrop-filter: a blur
                        // inside a rotating preserve-3d subtree is both very
                        // expensive and unreliable across browsers.
                        background:
                          'linear-gradient(150deg, rgba(255,255,255,0.13), rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.32))',
                        transform: `translateZ(${zOffset}px)`,
                        backfaceVisibility: 'hidden',
                        // Refractive rim: bright along the top-left where the
                        // light lands, dark along the bottom-right, plus the
                        // drop shadow that lifts the card off the background.
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.28), inset 1px 0 0 rgba(255,255,255,0.14),' +
                          'inset 0 -1px 0 rgba(0,0,0,0.35), inset -1px 0 0 rgba(0,0,0,0.25),' +
                          '0 30px 60px -25px rgba(0,0,0,0.9)',
                      }}
                    >
                      {/* Etched ornament, masked away under the text block. */}
                      <div
                        className="absolute inset-0 text-white/[0.16]"
                        style={{
                          maskImage:
                            'radial-gradient(135% 100% at 22% 92%, transparent 0%, transparent 30%, #000 72%)',
                          WebkitMaskImage:
                            'radial-gradient(135% 100% at 22% 92%, transparent 0%, transparent 30%, #000 72%)',
                        }}
                      >
                        <ServiceMotif serviceKey={item.key} />
                      </div>

                      {/* Bloom sitting just under the surface. */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'radial-gradient(70% 55% at 18% 8%, rgba(255,255,255,0.16), transparent 70%)',
                        }}
                      />

                      <div className="absolute inset-0 p-6 sm:p-7 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <Icon
                            size={30}
                            strokeWidth={1.1}
                            className="text-white/85"
                            aria-hidden="true"
                          />
                          <span className="font-sans text-[11px] tracking-[0.28em] text-white/40 tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-sans text-white text-lg sm:text-xl font-semibold tracking-tight text-balance">
                            {item.title}
                          </h3>
                          <p className="mt-2 font-sans text-white/60 text-[12.5px] sm:text-[13.5px] leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Specular band. Twice the card's width and slid across
                          by --sheen, which the render loop drives from the tilt,
                          so the highlight tracks the light as the card turns.
                          Translating a pre-rendered gradient is compositor work;
                          animating the gradient's own stops would repaint. */}
                      <div
                        className="absolute inset-y-0 -left-1/2 w-[200%] pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(102deg, transparent 38%, rgba(255,255,255,0.05) 45%,' +
                            'rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.05) 55%, transparent 62%)',
                          transform: 'translateX(calc(var(--sheen, 0) * 1px))',
                        }}
                      />
                    </div>
                  );
                }

                // Back face — flipped so it reads correctly as the card turns.
                return (
                  <div
                    key={layer}
                    className="absolute inset-0 rounded-[18px] overflow-hidden pointer-events-none border border-white/10"
                    style={{
                      background:
                        'linear-gradient(150deg, rgba(255,255,255,0.05), rgba(0,0,0,0.55))',
                      transform: `translateZ(${zOffset}px) rotateX(180deg)`,
                      backfaceVisibility: 'hidden',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
                    }}
                  >
                    <div className="absolute left-0 right-0 top-5 h-8 bg-black/70" />
                    <div className="absolute left-6 bottom-6 right-6">
                      <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-white/40">
                        Farruggia Facility
                      </p>
                      <p className="mt-1.5 font-sans text-white/80 text-sm font-medium">
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
