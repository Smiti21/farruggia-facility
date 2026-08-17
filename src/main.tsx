import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Dev-only: exposes GSAP so scroll-driven work can be stepped by hand from the
// console. Scrub and pin state are driven by the GSAP ticker, so without this
// there is no way to inspect them in a headless or non-compositing browser.
// `import.meta.env.DEV` is statically false in production, so this whole block
// is dropped from the bundle.
if (import.meta.env.DEV) {
  void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([{ default: gsap }, { ScrollTrigger }]) => {
      Object.assign(window as unknown as Record<string, unknown>, { gsap, ScrollTrigger });
    },
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
