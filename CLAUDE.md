# Farruggia Facility — working notes

Marketing site for a Swiss facility management company in Frauenfeld. Single
page, static, no backend.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · GSAP (ScrollTrigger,
ScrollToPlugin) · react-router-dom. `lucide-react` for icons. No other UI
libraries.

## Commands

```bash
npm run dev        # dev server on :5173
npm run build      # tsc --noEmit && vite build
npm run typecheck  # types only
```

Always run `npm run build` before committing — it typechecks and is the only
gate in the project.

## Deploying

`git push` to `main` is the deploy. Netlify is connected to
`Smiti21/farruggia-facility` and rebuilds automatically; `netlify.toml` holds the
build command, publish dir, SPA fallback and cache headers. Nothing to run by
hand.

## Decisions that should not be quietly reversed

These were each deliberate, and several were arrived at after measuring. Changing
them is fine — reversing them by accident is not.

- **The palette is strictly monochrome.** Black, white, and white at varying
  opacity. There is no accent hue. A gold `#C9A96E` was removed on request;
  don't reintroduce a colour accent. Emphasis comes from contrast and scale.
- **Outfit is the only typeface.** `--font-serif` is aliased to it on purpose.
- **Device-orientation tilt is off** (`ENABLED = false` in `src/lib/deviceTilt.ts`)
  because iOS raised a motion-permission prompt on first tap. Leave it off unless
  asked.
- **The background video loops via a two-element cross-dissolve**, not the `loop`
  attribute. The supplied clip is a hard cut — its last frame differs from its
  first about as much as its middle does — so `loop` showed a visible jump.
- **Don't upscale the video.** `OVERSCALE` is 1.04 so the layer stays inside the
  1920×1080 source on any display up to 1920. The source is only ~2.4 Mbps and
  shows compression artefacts when enlarged.
- **`GAP = 36` in the services carousel is a balance point**, not a rounded
  guess. Lower and the neighbour card collides with the centre card (perspective
  magnifies it 1.4×); higher and it collides with the card leaving the frame.
  Measured: 12 gave a 35px overlap, 36 gives zero.
- **`EXIT_EASE = 1.5`** for the same reason: 1.0 leaves the stage sparse, 2.2
  lets the neighbour catch the departing card (15px overlap).

## Motion policy

`src/lib/motion.ts` is the single switch. `prefers-reduced-motion` is treated as
disabling **ambient** motion only — currently just the marquee — while
**input-driven** motion (glass tilt, cursor glare, parallax, scrubbed reveals,
weighted scrolling) stays on, because none of it moves unless the visitor moves
first. This is deliberate: on Windows that media query follows an OS-wide
animation toggle many people switch off for performance, and honouring it
strictly stripped the site of its character. For the strict reading, make
`allowInputMotion()` return `!prefersReducedMotion()`.

## Performance rules of thumb

Several large `backdrop-filter` panes over a *playing* video is the most
demanding combination in browser rendering. What keeps it smooth:

- `will-change` is applied **only during interaction**, never as a standing
  style. Six permanent GPU layers was the single biggest source of scroll
  stutter.
- Gradients are **translated, never re-positioned**. Moving a gradient's stops
  repaints; translating a pre-rendered one composites. Applies to both the pane
  glare and the card sheen.
- Off-screen panes drop their `backdrop-filter` via `IntersectionObserver`.
- Every observer defaults to the **safe** state, so a browser that never
  delivers a callback degrades to "no optimisation" rather than "invisible".
- Pointer listeners are per-element, so only the hovered one does work.

## Verifying

There are no automated tests. Verification is done by measuring in the browser —
bounding boxes, computed transforms, ScrollTrigger progress — not by eye.

`src/main.tsx` exposes `window.gsap` and `window.ScrollTrigger` under
`import.meta.env.DEV` (statically dropped from production). This matters because
scrub and pin state are driven by the GSAP ticker: in a headless or
non-compositing browser no frames are produced, so animations look frozen and
`IntersectionObserver` never fires. Drive them by hand with `ScrollTrigger.update()`
and by stepping `requestAnimationFrame` callbacks from a queue.

Two traps when stepping rAF manually:

- Capture callbacks into an **array**, not a single slot — several components
  register per frame and a single slot loses the chain.
- A **synchronous** rAF stub breaks guards of the form
  `if (!frame) frame = requestAnimationFrame(cb)`, because `cb` resets `frame`
  before the assignment lands. Defer instead.

Check viewports at 375, 768, 1024 and 1440 in **both languages** — German copy is
noticeably longer and is what tightens the nav.

## Known placeholders

- `Impressum` and `Datenschutz` are placeholder anchors. A Swiss commercial site
  legally needs both (revDSG).
- The phone number `+41 52 123 45 67` in `src/translations.ts` is from the brief.
- `public/images/service-<key>.jpg` are optional; cards fall back to a tinted
  gradient when absent.

## Content

All copy for both languages lives in `src/translations.ts`, typed against a
shared `Translation` interface so a key missing from either language fails the
build.
