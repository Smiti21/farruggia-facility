import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: string;
  className?: string;
}

/**
 * Renders a headline split into lines → words → characters, then floats the
 * characters away as the page scrolls. The split is done in markup (not with
 * GSAP SplitText) so it stays free of the paid plugin.
 */
export default function ScrollFloat({ children, className = '' }: ScrollFloatProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  const lines = useMemo(() => children.split('\n'), [children]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const chars = root.querySelectorAll('.char');
      if (!chars.length) return;

      gsap.fromTo(
        chars,
        { opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1, transformOrigin: '50% 0%' },
        {
          opacity: 0,
          yPercent: 250,
          scaleY: 1.2,
          scaleX: 0.9,
          stagger: 0.05,
          ease: 'power2.inOut',
          duration: 1,
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            // Viewport-relative, so the track and the fade stay in step at any
            // screen height. Deliberately shorter than one viewport: the glass
            // panel starts rising at 0.25vh, and the two need to overlap or
            // there is a moment showing nothing but video.
            end: () => `+=${window.innerHeight * 0.8}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [children]);

  return (
    <h1
      ref={rootRef}
      className={`scroll-float-text font-sans text-white ${className}`}
      style={{
        // The lower bound has to clear small phones: "Farruggia" at 4rem
        // overflows a 375px viewport, so the floor drops to 2.75rem.
        fontSize: 'clamp(2.75rem, 14vw, 317px)',
        lineHeight: 0.85,
        letterSpacing: '0%',
        fontWeight: 700,
      }}
      // The visually split text is announced as one clean string.
      aria-label={children.replace(/\n/g, ' ')}
    >
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} style={{ display: 'block' }} aria-hidden="true">
          {line.split(' ').map((word, wordIndex, words) => (
            <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {[...word].map((char, charIndex) => (
                <span key={charIndex} className="char">
                  {char}
                </span>
              ))}
              {wordIndex < words.length - 1 && <span className="char">&nbsp;</span>}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
