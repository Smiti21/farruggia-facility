import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import './PillNav.css';

gsap.registerPlugin(ScrollToPlugin);

type NavKey = 'home' | 'about' | 'services' | 'contact';

const NAV_KEYS: NavKey[] = ['home', 'about', 'services', 'contact'];

/** Scroll position that parks the glass panel fully in view. */
function aboutScrollTarget(): number {
  const hero = document.getElementById('hero-scroll');
  if (!hero) return document.body.scrollHeight;
  return hero.offsetTop + hero.offsetHeight - window.innerHeight;
}

function targetFor(key: NavKey): number | string {
  switch (key) {
    case 'home':
      return 0;
    case 'about':
      return aboutScrollTarget();
    case 'services':
      return '#services';
    case 'contact':
      return '#contact';
  }
}

export default function PillNav() {
  const { t, language, toggleLanguage, dict } = useLanguage();

  const logoRef = useRef<HTMLButtonElement>(null);
  const logoIconRef = useRef<HTMLSpanElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timelines = useRef<gsap.core.Timeline[]>([]);

  const [active, setActive] = useState<NavKey>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  /* ---- Liquid-fill hover geometry -------------------------------------- */
  useEffect(() => {
    const build = () => {
      timelines.current.forEach((tl) => tl.kill());
      timelines.current = [];

      pillRefs.current.forEach((pill) => {
        if (!pill) return;
        const circle = pill.querySelector<HTMLElement>('.hover-circle');
        const label = pill.querySelector<HTMLElement>('.pill-label');
        const hover = pill.querySelector<HTMLElement>('.pill-label-hover');
        if (!circle || !label || !hover) return;

        const { width: w, height: h } = pill.getBoundingClientRect();
        if (!w || !h) return;

        // Radius of the circle whose arc, rising from below, exactly clears the
        // pill's top edge across its full width.
        const R = (w * w) / 4 / (2 * h) + h / 2;
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;

        Object.assign(circle.style, {
          width: `${D}px`,
          height: `${D}px`,
          left: '50%',
          bottom: `${-delta}px`,
        });
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${D - delta}px` });
        gsap.set(label, { yPercent: 0 });
        gsap.set(hover, { yPercent: 100 });

        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 3, xPercent: -50, duration: 2, ease: 'power3.out' }, 0)
          .to(label, { yPercent: -100, duration: 2, ease: 'power3.out' }, 0)
          .to(hover, { yPercent: 0, duration: 2, ease: 'power3.out' }, 0);

        timelines.current.push(tl);
      });
    };

    build();
    window.addEventListener('resize', build);
    return () => {
      window.removeEventListener('resize', build);
      timelines.current.forEach((tl) => tl.kill());
      timelines.current = [];
    };
  }, [language]);

  /* ---- Entrance animation ---------------------------------------------- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { scale: 0 },
          { scale: 1, duration: 0.6, ease: 'power3.out', clearProps: 'scale' },
        );
      }
      if (navItemsRef.current) {
        // clearProps hands the width back to CSS when the intro finishes. Without
        // it an inline `width` lingers, and any interruption before completion
        // would leave the nav stuck at zero width.
        gsap.fromTo(
          navItemsRef.current,
          { width: 0 },
          { width: 'auto', duration: 0.6, ease: 'power3.out', clearProps: 'width' },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  /* ---- Mobile popover --------------------------------------------------- */
  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    if (menuOpen) {
      gsap.set(el, { visibility: 'visible' });
      gsap.fromTo(
        el,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' },
      );
    } else {
      gsap.to(el, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power3.in',
        onComplete: () => gsap.set(el, { visibility: 'hidden' }),
      });
    }
  }, [menuOpen]);

  const go = (key: NavKey) => {
    setActive(key);
    setMenuOpen(false);
    // Distance-aware duration: a jump to the footer should not take the same
    // three seconds as a nudge to the section just below.
    const to = targetFor(key);
    const destination =
      typeof to === 'number'
        ? to
        : (document.querySelector(to) as HTMLElement | null)?.offsetTop ?? 0;
    const distance = Math.abs(destination - window.scrollY);
    const duration = gsap.utils.clamp(0.9, 2.1, distance / 2200);

    gsap.to(window, {
      duration,
      // autoKill stays off: the smooth-scroll hook already cancels this tween
      // the moment the visitor touches the wheel.
      scrollTo: { y: to, autoKill: false },
      ease: 'power2.inOut',
      overwrite: true,
    });
  };

  const hoverIn = (i: number) => {
    const tl = timelines.current[i];
    if (tl) gsap.to(tl, { time: tl.duration(), duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
  };

  const hoverOut = (i: number) => {
    const tl = timelines.current[i];
    if (tl) gsap.to(tl, { time: 0, duration: 0.2, ease: 'power3.out', overwrite: 'auto' });
  };

  return (
    <div className="pill-nav-container">
      <nav className="pill-nav" aria-label="Main">
        {/* Logo */}
        <button
          ref={logoRef}
          type="button"
          className="pill-logo"
          aria-label="Farruggia Facility — back to top"
          onClick={() => go('home')}
          onMouseEnter={() =>
            gsap.to(logoIconRef.current, { rotate: 360, duration: 0.2, ease: 'power2.out' })
          }
          onMouseLeave={() => gsap.set(logoIconRef.current, { rotate: 0 })}
        >
          <span ref={logoIconRef} className="logo-svg-container">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="#fff" aria-hidden="true">
              <path d="m50,50c0,18.2,14.77,32.98,32.97,32.98,0-18.2-14.77-32.98-32.97-32.98Z" />
              <path d="m17.02,82.98c18.2,0,32.98-14.77,32.98-32.98-18.2,0-32.98,14.77-32.98,32.98Z" />
              <path d="m82.98,17.02c-18.2,0-32.97,14.77-32.97,32.97,18.2,0,32.97-14.77,32.97-32.97Z" />
              <path d="m17.02,17.02c0,18.2,14.77,32.97,32.98,32.97,0-18.2-14.77-32.97-32.98-32.97Z" />
            </svg>
          </span>
        </button>

        {/* Desktop pills */}
        <div ref={navItemsRef} className="pill-nav-items desktop-only">
          <ul className="pill-list">
            {NAV_KEYS.map((key, i) => (
              <li key={key}>
                <button
                  type="button"
                  ref={(el) => {
                    pillRefs.current[i] = el;
                  }}
                  className={`pill${active === key ? ' is-active' : ''}`}
                  aria-current={active === key ? 'page' : undefined}
                  onMouseEnter={() => hoverIn(i)}
                  onMouseLeave={() => hoverOut(i)}
                  onFocus={() => hoverIn(i)}
                  onBlur={() => hoverOut(i)}
                  onClick={() => go(key)}
                >
                  <span className="hover-circle" aria-hidden="true" />
                  <span className="label-stack">
                    <span className="pill-label">{t(`nav.${key}`)}</span>
                    <span className="pill-label-hover" aria-hidden="true">
                      {t(`nav.${key}`)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Language toggle */}
        <button
          type="button"
          className="pill-lang"
          onClick={toggleLanguage}
          aria-label={`${dict.language.label} (${language === 'en' ? 'Deutsch' : 'English'})`}
          title={dict.language.label}
        >
          <Globe size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className={language === 'en' ? 'lang-active' : undefined}>EN</span>
          <span aria-hidden="true" style={{ opacity: 0.35 }}>/</span>
          <span className={language === 'de' ? 'lang-active' : undefined}>DE</span>
        </button>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="mobile-menu-button mobile-only"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span
            className="hamburger-line"
            style={
              menuOpen
                ? { transform: 'rotate(45deg) translateY(3px)' }
                : { transform: 'none' }
            }
          />
          <span
            className="hamburger-line"
            style={
              menuOpen
                ? { transform: 'rotate(-45deg) translateY(-3px)' }
                : { transform: 'none' }
            }
          />
        </button>
      </nav>

      {/* Mobile popover */}
      <div ref={popoverRef} className="mobile-menu-popover mobile-only">
        <ul className="mobile-menu-list">
          {NAV_KEYS.map((key) => (
            <li key={key}>
              <button type="button" className="mobile-menu-link" onClick={() => go(key)}>
                {t(`nav.${key}`)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
