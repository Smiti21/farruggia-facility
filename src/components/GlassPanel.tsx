import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus } from 'lucide-react';
import GlassSurface from './GlassSurface';
import { useLanguage } from './LanguageContext';
import type { ServiceItem } from '../translations';

gsap.registerPlugin(ScrollTrigger);

/**
 * Splits a sentence into tokens and wraps the requested words in <em>.
 * Matching ignores case and trailing punctuation so 'all' still matches 'all.'.
 */
function withItalics(text: string, italics: string[]) {
  const wanted = new Set(italics.map((w) => w.toLowerCase()));
  return text.split(/(\s+)/).map((token, i) => {
    const bare = token.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
    if (bare && wanted.has(bare)) {
      return (
        <span key={i} className="italic text-white/80">
          {token}
        </span>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

export default function GlassPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { t, tList, dict } = useLanguage();
  const items = tList<ServiceItem>('services.items');
  const marquee = tList<string>('marquee');

  const [openKey, setOpenKey] = useState<string | null>(items[0]?.key ?? null);

  /**
   * Which row should be open after the visitor clicks `clicked`.
   *
   * Current policy: accordion — one row at a time, and clicking the open row
   * closes it. This keeps the panel a fixed-ish height so the glass never
   * scrolls internally on a laptop, at the cost of making visitors click four
   * times to compare all four services.
   */
  const nextOpenKey = (clicked: string, currentlyOpen: string | null): string | null =>
    currentlyOpen === clicked ? null : clicked;

  const heading = useMemo(
    () => withItalics(dict.about.heading, dict.about.italics),
    [dict],
  );

  /* Slide the panel up as the last viewport of the hero track scrolls in. */
  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrapper,
        { yPercent: 100 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            // Explicit pixel range rather than 'top bottom' → 'bottom bottom'.
            // That pair spanned a full viewport starting only once the panel's
            // container reached the screen, which left a gap after the headline
            // had faded. Starting at 0.25vh overlaps the two.
            trigger: document.body,
            start: () => window.innerHeight * 0.25,
            end: () => window.innerHeight * 1.2,
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        },
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      id="about"
      className="absolute bottom-0 left-0 w-full h-screen z-10 flex items-end justify-center px-3 sm:px-4 pb-3 sm:pb-4 md:pb-8 pointer-events-none"
    >
      {/* The wrapper carries the scroll slide; GlassSurface carries the tilt. */}
      <div
        ref={wrapperRef}
        className="w-full max-w-[1250px] h-[900px] max-h-[93vh] sm:max-h-[88vh] md:max-h-[85vh] pointer-events-auto mx-auto"
      >
        <GlassSurface
          className="w-full h-full"
          panelClassName="w-full h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl"
          tilt={9}
          lift={16}
          glareSize={900}
        >
          {/* ---- Copy + collapsible services ---- */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col items-center justify-center px-5 sm:px-8 md:px-12 py-8 sm:py-10 text-center">
            <p className="font-serif italic text-white/60 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6 tracking-wide">
              {t('about.subtitle')}
            </p>

            <h2
              className="font-sans text-white font-medium leading-[1.12] tracking-tight w-full max-w-[1000px] mx-auto text-balance"
              style={{ fontSize: 'clamp(1.375rem, 4.2vw, 3.5rem)' }}
            >
              {heading}
            </h2>

            {/* Collapsible service rows — two columns once there is room. */}
            <div className="w-full max-w-[900px] mx-auto mt-8 sm:mt-10 md:mt-12 text-left grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
              {items.map((item) => {
                const isOpen = openKey === item.key;
                return (
                  <div key={item.key} className="border-b border-white/10 self-start w-full">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenKey((prev) => nextOpenKey(item.key, prev))}
                        aria-expanded={isOpen}
                        aria-controls={`panel-${item.key}`}
                        className="w-full flex items-center justify-between gap-4 py-3.5 md:py-4 text-left group cursor-pointer"
                      >
                        <span className="font-sans text-white/80 text-base sm:text-lg md:text-xl font-medium transition-colors duration-300 group-hover:text-white">
                          {item.title}
                        </span>
                        <Plus
                          size={18}
                          strokeWidth={1.5}
                          className={`shrink-0 text-white/40 transition-[transform,color] duration-300 group-hover:text-white ${
                            isOpen ? 'rotate-45' : ''
                          }`}
                        />
                      </button>
                    </h3>
                    <div
                      id={`panel-${item.key}`}
                      className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                      style={{
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="overflow-hidden">
                        <p className="font-sans text-white/60 text-sm md:text-base leading-relaxed pb-4 pr-6 max-w-[60ch]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- Marquee ---- */}
          <div className="border-t border-white/10 py-4 sm:py-6 overflow-hidden shrink-0">
            <div className="flex w-max animate-marquee">
              {Array.from({ length: 4 }).map((_, copy) => (
                <div key={copy} className="flex items-center shrink-0" aria-hidden={copy > 0}>
                  {marquee.map((word, i) => (
                    <span key={`${copy}-${i}`} className="flex items-center">
                      <span className="px-4 sm:px-6 font-sans font-semibold text-xs sm:text-sm tracking-widest uppercase text-white opacity-40 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        {word}
                      </span>
                      <span className="text-white/20 select-none">•</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
}
