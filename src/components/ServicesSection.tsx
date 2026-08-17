import { useRef, useState } from 'react';
import { Leaf, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import GlassSurface from './GlassSurface';
import RevealText from './RevealText';
import { useLanguage } from './LanguageContext';
import { useScrubRise } from '../hooks/useScrubRise';
import { CONTACT } from '../translations';
import type { ServiceItem, ServiceKey } from '../translations';

const ICONS: Record<ServiceKey, LucideIcon> = {
  technical: Wrench,
  security: ShieldCheck,
  landscaping: Leaf,
  other: Sparkles,
};

/**
 * Faint monochrome tints so the four cards read as a set while still passing
 * the video through. Differentiation is by weight, not hue.
 */
const TINTS: Record<ServiceKey, string> = {
  technical: 'from-white/[0.09] via-white/[0.02] to-transparent',
  security: 'from-white/[0.07] via-white/[0.02] to-transparent',
  landscaping: 'from-white/[0.05] via-white/[0.02] to-transparent',
  other: 'from-white/[0.03] via-white/[0.01] to-transparent',
};

function ServiceCard({ item }: { item: ServiceItem }) {
  const [hasImage, setHasImage] = useState(true);
  const Icon = ICONS[item.key];

  return (
    <GlassSurface
      className="service-card h-full"
      panelClassName="h-full flex flex-col rounded-2xl sm:rounded-3xl group"
      tilt={5}
      lift={10}
      glareSize={420}
    >
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden shrink-0">
        {hasImage ? (
          <img
            src={`/images/service-${item.key}.jpg`}
            alt=""
            loading="lazy"
            onError={() => setHasImage(false)}
            className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        ) : (
          // No photography: a translucent tint that still lets the video read
          // through, so the card stays glass rather than becoming a solid block.
          <div
            className={`w-full h-full bg-gradient-to-br ${TINTS[item.key]} flex items-center justify-center transition-transform duration-[900ms] ease-out group-hover:scale-105`}
          >
            <Icon
              size={56}
              strokeWidth={0.9}
              className="text-white/25 transition-colors duration-500 group-hover:text-white/70"
              aria-hidden="true"
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </div>

      <div className="p-6 sm:p-8 md:p-10 flex-1">
        <h3 className="font-sans text-white text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          {item.title}
        </h3>
        <p className="mt-3 sm:mt-4 font-sans text-white/60 text-sm sm:text-base leading-relaxed max-w-[52ch]">
          {item.desc}
        </p>
      </div>
    </GlassSurface>
  );
}

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const { t, tList } = useLanguage();
  const items = tList<ServiceItem>('services.items');

  // Heading words slide out from behind their own mask…
  useScrubRise(headerRef, {
    targets: '.reveal-word',
    yPercent: 115,
    fade: 1,
    start: 'top bottom-=60',
    end: 'top 62%',
    scrub: 0.6,
    stagger: 0.06,
  });

  // …and the cards rise in sequence, scrubbed so scrolling back reverses it.
  useScrubRise(gridRef, {
    targets: '.service-card',
    distance: 90,
    start: 'top bottom',
    end: 'top 45%',
    scrub: 0.6,
    stagger: 0.08,
  });

  useScrubRise(ctaRef, { distance: 40, start: 'top bottom', end: 'top 80%', scrub: 0.6 });

  return (
    <section ref={sectionRef} id="services" className="relative z-20 py-24 sm:py-28 md:py-40">
      <div className="mx-auto w-full max-w-[1250px] px-5 sm:px-6 md:px-10">
        <div ref={headerRef} className="text-center">
          <p className="font-sans text-white/45 text-[0.7rem] sm:text-xs md:text-sm font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em]">
            Frauenfeld · Schweiz
          </p>
          <h2 className="font-sans text-white text-4xl sm:text-5xl md:text-7xl font-bold mt-5 sm:mt-6 tracking-tight text-balance">
            <RevealText>{t('services.title')}</RevealText>
          </h2>
          <p className="mt-5 sm:mt-6 mx-auto max-w-[62ch] font-sans text-white/60 text-sm sm:text-base md:text-lg leading-relaxed">
            {t('services.intro')}
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-14 sm:mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 items-stretch"
        >
          {items.map((item) => (
            <ServiceCard key={item.key} item={item} />
          ))}
        </div>

        <div ref={ctaRef} className="mt-14 sm:mt-16 flex justify-center">
          <a
            href={`mailto:${CONTACT.email}`}
            className="inline-flex items-center gap-3 rounded-full bg-white px-6 sm:px-8 py-3.5 sm:py-4 font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] text-black text-center transition-[gap,box-shadow] duration-300 ease-out hover:gap-5 hover:shadow-[0_16px_50px_-12px_rgba(255,255,255,0.45)]"
          >
            {t('cta')}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
