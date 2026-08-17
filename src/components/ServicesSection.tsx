import { useRef } from 'react';
import RevealText from './RevealText';
import ServicesCarousel from './ServicesCarousel';
import { useLanguage } from './LanguageContext';
import { useScrubRise } from '../hooks/useScrubRise';
import { CONTACT } from '../translations';
import type { ServiceItem } from '../translations';

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const { t, tList } = useLanguage();
  const items = tList<ServiceItem>('services.items');

  useScrubRise(headerRef, {
    targets: '.reveal-word',
    yPercent: 115,
    fade: 1,
    start: 'top bottom-=60',
    end: 'top 62%',
    scrub: 0.6,
    stagger: 0.06,
  });

  useScrubRise(ctaRef, { distance: 40, start: 'top bottom', end: 'top 80%', scrub: 0.6 });

  return (
    <section ref={sectionRef} id="services" className="relative z-20 py-24 sm:py-28 md:py-36">
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
      </div>

      {/* The carousel is presentational: it rotates one card to the front at a
          time, so the full list is also rendered for assistive technology and
          for search engines, which cannot follow a 3D transform. */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.key}>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 sm:mt-12 md:mt-14" aria-hidden="true">
        <ServicesCarousel />
      </div>

      <div ref={ctaRef} className="mt-10 sm:mt-14 flex justify-center px-5">
        <a
          href={`mailto:${CONTACT.email}`}
          className="inline-flex items-center gap-3 rounded-full bg-white px-6 sm:px-8 py-3.5 sm:py-4 font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] text-black text-center transition-[gap,box-shadow] duration-300 ease-out hover:gap-5 hover:shadow-[0_16px_50px_-12px_rgba(255,255,255,0.45)]"
        >
          {t('cta')}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
