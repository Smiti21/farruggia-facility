import { useRef } from 'react';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import GlassSurface from './GlassSurface';
import RevealText from './RevealText';
import { useLanguage } from './LanguageContext';
import { useScrubRise } from '../hooks/useScrubRise';
import { CONTACT } from '../translations';

export default function Footer() {
  const { t, dict, language, toggleLanguage } = useLanguage();
  const year = new Date().getFullYear();

  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detailsRef = useRef<HTMLDListElement>(null);

  useScrubRise(panelRef, { distance: 110, start: 'top bottom', end: 'top 50%', scrub: 0.6 });
  useScrubRise(headingRef, {
    targets: '.reveal-word',
    yPercent: 115,
    fade: 1,
    start: 'top bottom-=60',
    end: 'top 65%',
    scrub: 0.6,
    stagger: 0.05,
  });
  useScrubRise(detailsRef, {
    targets: '.contact-detail',
    distance: 40,
    start: 'top bottom',
    end: 'top 78%',
    scrub: 0.6,
    stagger: 0.08,
  });

  return (
    <footer id="contact" className="relative z-20 pb-6 sm:pb-8 md:pb-10">
      <div className="mx-auto w-full max-w-[1250px] px-3 sm:px-4 md:px-10">
        <div ref={panelRef}>
          <GlassSurface
            className="w-full"
            panelClassName="rounded-2xl sm:rounded-3xl px-5 sm:px-8 md:px-14 py-14 sm:py-18 md:py-24 text-center"
            tilt={8}
            lift={14}
            glareSize={800}
          >
            {/* Brand mark */}
            <div className="flex items-center justify-center gap-3">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="#ffffff" aria-hidden="true">
                <path d="m50,50c0,18.2,14.77,32.98,32.97,32.98,0-18.2-14.77-32.98-32.97-32.98Z" />
                <path d="m17.02,82.98c18.2,0,32.98-14.77,32.98-32.98-18.2,0-32.98,14.77-32.98,32.98Z" />
                <path d="m82.98,17.02c-18.2,0-32.97,14.77-32.97,32.97,18.2,0,32.97-14.77,32.97-32.97Z" />
                <path d="m17.02,17.02c0,18.2,14.77,32.97,32.98,32.97,0-18.2-14.77-32.97-32.98-32.97Z" />
              </svg>
              <span className="font-sans text-white text-xl font-semibold tracking-tight">
                Farruggia Facility
              </span>
            </div>

            <h2
              ref={headingRef}
              className="mt-8 sm:mt-10 font-sans text-white text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight max-w-[20ch] mx-auto leading-[1.15] text-balance"
            >
              <RevealText>{dict.contact.title}</RevealText>
            </h2>
            <p className="mt-4 sm:mt-5 font-sans text-white/60 text-sm sm:text-base md:text-lg max-w-[52ch] mx-auto">
              {dict.contact.lead}
            </p>

            <div className="mt-8 sm:mt-10 flex justify-center">
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-3 rounded-full border border-white/35 px-6 sm:px-8 py-3.5 sm:py-4 font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] text-white transition-[background-color,color,border-color,box-shadow] duration-300 ease-out hover:bg-white hover:border-white hover:text-black hover:shadow-[0_16px_50px_-12px_rgba(255,255,255,0.4)]"
              >
                {t('cta')}
              </a>
            </div>

            {/* Contact details */}
            <dl
              ref={detailsRef}
              className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-left sm:text-center"
            >
              <div className="contact-detail">
                <dt className="flex items-center sm:justify-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-white/40">
                  <Mail size={14} strokeWidth={1.75} aria-hidden="true" />
                  {dict.contact.emailLabel}
                </dt>
                <dd className="mt-3">
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="font-sans text-white/85 hover:text-white transition-colors duration-300 break-all"
                  >
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
              <div className="contact-detail">
                <dt className="flex items-center sm:justify-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-white/40">
                  <Phone size={14} strokeWidth={1.75} aria-hidden="true" />
                  {dict.contact.phoneLabel}
                </dt>
                <dd className="mt-3">
                  <a
                    href={`tel:${CONTACT.phoneHref}`}
                    className="font-sans text-white/85 hover:text-white transition-colors duration-300"
                  >
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
              <div className="contact-detail">
                <dt className="flex items-center sm:justify-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-white/40">
                  <MapPin size={14} strokeWidth={1.75} aria-hidden="true" />
                  {dict.contact.addressLabel}
                </dt>
                <dd className="mt-3 font-sans text-white/85">{dict.contact.address}</dd>
              </div>
            </dl>

            {/* Bottom bar */}
            <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
              <p className="font-sans text-xs text-white/35 order-3 md:order-1">
                © {year} Farruggia Facility. {t('footer.rights')}
              </p>

              <p className="font-sans text-xs text-white/35 order-1 md:order-2">
                {dict.footer.tagline}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 order-2 md:order-3">
                <a
                  href="#impressum"
                  className="font-sans text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors duration-300"
                >
                  {t('footer.impressum')}
                </a>
                <a
                  href="#datenschutz"
                  className="font-sans text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors duration-300"
                >
                  {t('footer.datenschutz')}
                </a>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  aria-label={dict.language.label}
                  className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors duration-300 cursor-pointer"
                >
                  <Globe size={13} strokeWidth={1.75} aria-hidden="true" />
                  {language === 'en' ? 'DE' : 'EN'}
                </button>
              </div>
            </div>
          </GlassSurface>
        </div>
      </div>
    </footer>
  );
}
