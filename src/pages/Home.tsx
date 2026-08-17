import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BackgroundVideo from '../components/BackgroundVideo';
import ScrollFloat from '../components/ScrollFloat';
import GlassPanel from '../components/GlassPanel';
import PillNav from '../components/PillNav';
import ServicesSection from '../components/ServicesSection';
import Footer from '../components/Footer';
import { useLanguage } from '../components/LanguageContext';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const { dict, language } = useLanguage();
  const subRef = useRef<HTMLParagraphElement>(null);

  useSmoothScroll();

  // The headline dissolves character by character; the subline fades with it so
  // nothing from the hero lingers behind the glass panel.
  useEffect(() => {
    const sub = subRef.current;
    if (!sub) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sub,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: 40,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: () => `+=${window.innerHeight * 0.6}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Layer 1 — looping background video (z-0, fixed) */}
      <BackgroundVideo src="/videos/video1.mp4" />

      {/* Layer 4 — navigation (z-100, fixed) */}
      <PillNav />

      {/* Layer 2 — hero type (z-10, fixed overlay) */}
      <div className="fixed inset-0 z-10 flex flex-col justify-end p-5 sm:p-6 md:p-8 pointer-events-none">
        <ScrollFloat key={language}>{dict.hero.headline}</ScrollFloat>
        <p
          ref={subRef}
          className="font-sans text-white/70 text-base sm:text-lg md:text-2xl mt-3 mb-6 md:mb-8"
        >
          {dict.hero.sub}
        </p>
      </div>

      {/* Scroll track for the hero type and the glass panel.

          Sized to exactly what the two animations need, with nothing spare:
            0 → 1vh   the headline dissolves
            1vh → 2vh the glass panel rises (its container is the last vh of
                      the track, so its trigger spans precisely one viewport)
          That totals 3vh. At 500vh, 1880px of this track — over half of it —
          was scrolling past with nothing happening at all. */}
      <div id="hero-scroll" className="relative h-[300vh]">
        {/* Layer 3 — glass panel, parked at the bottom of the track */}
        <GlassPanel />
      </div>

      {/* Layer 5 — normal document flow from here down */}
      <ServicesSection />
      <Footer />
    </>
  );
}
