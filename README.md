# Farruggia Facility

Marketing site for **Farruggia Facility**, a facility management company based in Frauenfeld, Switzerland.

Built with Vite + React 19 + TypeScript + Tailwind CSS v4 + GSAP (ScrollTrigger / ScrollToPlugin) + react-router-dom. English is the primary language with a full German (Swiss orthography — `ss`, never `ß`) translation behind a language switcher.

---

## Running the project

```bash
npm install
```

```bash
npm run dev
```

The dev server prints a local URL (default <http://localhost:5173>).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Typecheck (`tsc --noEmit`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Typecheck only |

---

## Deploying

The site is fully static — no server, no database, no environment variables.
`npm run build` produces a `dist/` folder (~4.5 MB, of which 3.6 MB is the
video) and **that folder is the entire website**.

### Quickest way to share a link

1. Run the build:

```bash
npm run build
```

2. Go to <https://app.netlify.com/drop> and drag the **`dist` folder** onto the
   page. You get a public URL within seconds — no CLI, no git, no config.

To update it later, rebuild and drag the new `dist` folder onto the same site.

### Repeat deploys from the command line

```bash
npx vercel --prod
```

or

```bash
npx netlify deploy --prod --dir=dist
```

Both open a browser once to sign in, then remember you. Cloudflare Pages works
equally well: point it at the repo with build command `npm run build` and output
directory `dist`.

### Just showing it on your own phone, same Wi-Fi

No deploy needed:

```bash
npm run dev -- --host
```

Vite prints a **Network:** URL (something like `http://192.168.1.42:5173`). Open
that on the phone. It only works on the same network, and your PC has to stay on.

### What's already configured

- **`public/_redirects`** and **`vercel.json`** both send every path to `index.html`. The app uses `BrowserRouter`, so without this a visitor hitting any URL other than `/` would get a 404 from the host.
- The **hls.js chunk ships but is never downloaded** for an `.mp4` source — confirmed against the production build. It costs 560 kB of storage and zero bandwidth, and means switching to an HLS stream is a one-prop change.

### Caveats

- **GitHub Pages under a project subpath** (`user.github.io/repo/`) needs `base: '/repo/'` in `vite.config.ts`, otherwise the asset URLs resolve wrongly. The hosts above all serve from a domain root, so nothing is needed there.
- **The video is 3.6 MB.** That is the bulk of a first visit on mobile data. If that matters, re-encode smaller — see the guidance below.
- **On phones the tilt, glare, parallax and weighted scrolling are all off** by design: there is no hovering cursor to drive them. Phone visitors get the glass panels and the scroll-scrubbed reveals, which is the intended mobile experience — not a bug.
- **iOS Low Power Mode blocks video autoplay.** The page stays on its first frame rather than breaking, but the background will not move for those visitors.

---

## Replacing the background video

The looping background lives at `public/videos/video1.mp4`.

**To swap it:** drop your file in as `public/videos/video1.mp4` and reload. Nothing else needs to change.

**To use a different filename or an HLS stream**, edit the `src` prop in [`src/pages/Home.tsx`](src/pages/Home.tsx):

```tsx
<BackgroundVideo src="/videos/video1.mp4" />
```

`BackgroundVideo` picks its loading strategy from the extension:

- **`.mp4` / `.webm`** — loaded directly by the browser.
- **`.m3u8`** — `hls.js` is dynamically imported (Safari uses native HLS).

Because hls.js sits behind a dynamic `import()`, its ~570 kB chunk is **never downloaded** when the source is an mp4.

The clip plays continuously, muted and inline, independent of scroll position. It
fades in once the first frames are decodable so there is no flash of an empty frame.

### How the loop actually works

**Not** with the `loop` attribute. `BackgroundVideo` renders **two** `<video>`
elements and cross-dissolves between them: when the playing clip is within
`CROSSFADE` (1.1s) of its end, the standby element starts from zero and the two
fade past each other over 1.1s, then swap roles.

This exists because `loop` only looks right if a clip's last frame matches its
first. The supplied `video1.mp4` does not — measured on a 160×90 downsample, its
last frame differs from its first by **23.9** mean levels per channel, where the
*middle* of the clip differs by 26.9. The end is nearly as different from the
start as it is possible to be, so `loop` produced a visible jump every 12s. A
cross-dissolve hides the seam for any footage.

The second decoder only runs during the dissolve — roughly 1.1s in every 12s —
so it costs far less than keeping two videos playing throughout. The driver is a
100ms `setInterval` (not rAF), which also self-heals: if the active clip is ever
found paused while the tab is visible, it restarts it.

HLS sources keep the plain `loop` attribute, because hls.js attaches to a single
element.

### Video guidance

If you can supply a better source file, both of these get better on their own:

- **Sharpness.** The current file is 1920×1080 at only **~2.4 Mbps**. Typical 1080p web video wants 5–8 Mbps. The blockiness is baked into the file — no amount of re-encoding adds detail back. The site now avoids upscaling it (see `OVERSCALE`), which is all that can be done from this side.
- **Looping.** If the first and last frames match, you can drop `CROSSFADE` and the dissolve becomes invisible. A locked-off shot or a slow drift loops far better than a pan.
- Keep it short — 10–20 seconds. It repeats forever, so file size matters more than length.
- Encode without audio (`-an`); the element is muted anyway.

```bash
ffmpeg -i source.mov -an -c:v libx264 -crf 20 -maxrate 8M -bufsize 16M -pix_fmt yuv420p -movflags +faststart public/videos/video1.mp4
```

`+faststart` moves the metadata to the front of the file so playback can begin
before the whole clip downloads.

---

## Service card images (optional)

Each card in the services grid looks for `public/images/service-<key>.jpg`, where `<key>` is one of:

`technical`, `security`, `landscaping`, `other`

If the file is missing, the card falls back to a tinted gradient with a lucide icon — no build error, no broken image. Drop JPGs in with those names to switch to photography.

---

## Editing content and translations

**All copy lives in one file:** [`src/translations.ts`](src/translations.ts). Both languages sit side by side, so nothing can drift out of sync unnoticed — the `Translation` interface makes TypeScript fail the build if a key exists in one language but not the other.

Contact details (email, phone) are exported from the same file as `CONTACT`.

Components read copy through the `useLanguage()` hook:

```tsx
const { t, tList, dict, language, toggleLanguage } = useLanguage();

t('nav.home')                        // → 'HOME' | 'START'
tList<ServiceItem>('services.items') // → typed array
dict.about.heading                   // → direct, fully typed access
```

The chosen language persists to `localStorage` and sets `<html lang>`. First-time visitors whose browser reports a German locale get German automatically.

---

## Structure

```
src/
  components/
    BackgroundVideo.tsx  Layer 1 — fixed looping video, pointer parallax, scrim
    ScrollFloat.tsx      Layer 2 — hero headline, split into chars, floats away
    GlassSurface.tsx     The reusable pane of glass — tilt + cursor glare
    GlassPanel.tsx       About panel: accordion + marquee, on a GlassSurface
    PillNav.tsx          Pill navigation, liquid hover, language toggle
    ServicesSection.tsx  Four independent glass cards
    Footer.tsx           Contact block on its own glass panel
    RevealText.tsx       Splits a line into per-word overflow masks
    LanguageContext.tsx  Language state, persistence, t() / tList()
  hooks/
    useSmoothScroll.ts   Weighted wheel scrolling on desktop
    useScrubRise.ts      Scroll-scrubbed rise-into-place for any element
  pages/
    Home.tsx             Composes all layers
  translations.ts        All copy, both languages
  index.css              Tailwind v4 theme (@theme), glass system, base styles
public/
  videos/video1.mp4      Background video
  images/                Optional service-<key>.jpg photography
```

### How the layers stack

| z-index | Layer | Positioning |
| --- | --- | --- |
| 100 | `PillNav` | fixed, top centre |
| 20 | `ServicesSection`, `Footer` | normal flow, fully transparent |
| 10 | Hero text / `GlassPanel` | fixed overlay / absolute at track bottom |
| 0 | `BackgroundVideo` | fixed, full-bleed, behind everything |

**No section has a background of its own.** The video runs behind the entire
document from hero to footer, and every section is a pane of glass floating over
it. A fixed scrim (a linear plus a radial gradient, inside `BackgroundVideo`)
holds text contrast without flattening the footage into a grey field.

The `#hero-scroll` element is a tall spacer with no visible content of its own —
it exists purely to give the fixed hero layers a scroll distance to animate
across.

---

## Liquid glass

Every pane on the page is a [`GlassSurface`](src/components/GlassSurface.tsx):

```tsx
<GlassSurface className="h-full" panelClassName="rounded-3xl" tilt={5} lift={10} glareSize={420}>
  …content…
</GlassSurface>
```

| Prop | Meaning |
| --- | --- |
| `tilt` | Maximum lean in degrees at the pane's edges |
| `lift` | Maximum pointer-follow translation in px |
| `glare` / `glareSize` | The specular highlight that tracks the cursor |

**Tilt is measured against each pane's own bounds**, not the window. A pane leans
toward the cursor while the pointer is over it and settles level when it leaves,
so the four service cards behave as four separate physical objects rather than
moving in unison. Verified: opposite corners produce ±5° and ±10px, the centre
reads zero, a pane returns to exactly zero on leave, and hovering one card leaves
its neighbour completely untouched.

The component renders two nested elements on purpose. The **wrapper** carries
scroll animation, the **pane** carries pointer animation. GSAP writes transforms
as a single `transform` string, so if both animations targeted one element they
would overwrite each other; splitting them lets the browser compose the two
matrices for free.

Glass styling lives in `index.css` under `.glass-surface`, driven by three
custom properties (`--glass-blur`, `--glass-tint`, `--glass-edge`) so the whole
system retunes from one place.

---

## Scrolling and motion

**Wheel scrolling is weighted.** [`useSmoothScroll`](src/hooks/useSmoothScroll.ts) intercepts wheel events and eases the page toward a target position on GSAP's ticker, so a notchy mouse wheel produces continuous motion rather than 100px jumps. It is deliberately narrow in scope:

- **Desktop only.** Touch devices keep their native momentum scrolling, which is already smooth and feels worse when overridden.
- **Nested scrollers are respected.** A wheel event that starts inside an element which can still scroll in that direction is left alone, so the page never traps the pointer.
- **The visitor always wins.** Touching the wheel cancels any in-flight navigation animation.
- **Ctrl+wheel passes through** so pinch-zoom still works.

GSAP's own `ScrollSmoother` would do this too, but it is a paid Club plugin; this is ~90 lines against the free ticker.

Nav clicks use a distance-aware duration (`clamp(0.9s, distance/2200, 2.1s)`) so a jump to the footer does not take the same time as a nudge to the section just below.

### Scroll choreography

Everything is **scrubbed to scroll position** rather than fired once, so scrolling
back up plays the page in reverse and the whole document keeps one rhythm.

- The about panel rises `yPercent: 100 → 0` across the last viewport of the hero track.
- Section headings slide up word by word from behind per-word overflow masks (`RevealText` + `useScrubRise` targeting `.reveal-word`).
- Service cards rise 90px with a 0.08s stagger; the contact panel rises 110px.

[`useScrubRise`](src/hooks/useScrubRise.ts) wraps that pattern — pass a container
ref, an optional child selector, a distance (px) or `yPercent`, and a stagger.

**The hero track is sized to exactly what its animations need**, and no more:

| Scroll | What happens |
| --- | --- |
| `0 → 1vh` | The headline dissolves character by character |
| `1vh → 2vh` | The glass panel rises into place |

That is 3vh in total (the panel's container occupies the final viewport of the
track, so its trigger spans precisely one more). Both fade distances are
functions of `window.innerHeight` with `invalidateOnRefresh`, so they stay in
step with the track at any screen height. Previously the track was 500vh with
fixed-pixel fades: **1880px of it — over half — scrolled past with nothing
happening at all.**

### The services carousel

[`ServicesCarousel`](src/components/ServicesCarousel.tsx) puts each service on a
vertical 3D cylinder. The section **pins**: when it reaches the top of the
viewport the stage sticks, and scrolling drives the cylinder through every card
before the page releases and carries on.

| | |
| --- | --- |
| Pin length | `0.75 × viewport height × card count` (~2700px on a 900px-tall window) |
| Progress mapping | `0 → 1` across the pin becomes card `0 → last`, so it releases exactly as the final card settles |
| Follow | The cylinder eases toward the scroll position (`FOLLOW = 0.12`) rather than being welded to it |
| Depth | Five stacked slices per card give real volumetric thickness; separate front and back faces |
| Geometry | Neighbours sit at `cardH + gap`; outer cards use a perspective-aware formula so their edge lands exactly on the stage boundary |

The render loop idles whenever the section is off screen, and is driven entirely
by scroll — there is no timer, which is also why it needs no reduced-motion
exemption.

### Performance notes

Several large `backdrop-filter` panes over a *playing* video is the most demanding
combination in browser rendering — the compositor re-samples the video behind
every pane, every frame. What keeps it smooth:

- **The cursor glare is translated, never repainted.** It is a fixed-size circle moved with `translate3d`, not a `radial-gradient` whose centre changes. Moving a gradient's centre re-rasterises the entire gradient on every pointer frame; translating a pre-rendered element is compositor-only work. Its `will-change` is also scoped to hover — six standing 900px layers would have cost more than the repaint did.
- **Off-screen panes drop their backdrop-filter.** An `IntersectionObserver` (60% root margin) adds `.is-offscreen`, which sets `backdrop-filter: none`. The filter is charged per pane even out of view, because it establishes a stacking context the compositor must still resolve against the moving video. Fail-safe by design: the default state is blurred, so if the observer never runs nothing renders wrongly — the optimisation is simply skipped.
- **No `saturate()` in the filter.** It was a second pass over the same pixels for an effect invisible against monochrome content.
- **Fonts are `<link>`ed, not `@import`ed**, with `preconnect`, and only the four weights actually used (400/500/600/700). An `@import` inside a stylesheet cannot be discovered until that stylesheet has downloaded and parsed, serialising two round trips before any text can paint; 800 and 900 were downloading and never being applied.
- **No standing composited layers.** `will-change: transform` is applied to a pane only while the pointer is on it, via an `.is-interacting` class. Declared permanently, it forced all six panes to hold their own GPU layer for the whole session — six large surfaces each re-sampling the video behind them whether or not anything moved. On a page like this that is the single biggest source of scroll stutter. `transform-style: preserve-3d` was dropped too: a pane's own rotation is projected by the perspective on its *parent*, so preserve-3d only mattered for 3D children, of which there are none.
- **Scrub values are low (0.6–0.8, not 1.1–1.5).** `useSmoothScroll` already eases the scroll position, so a long scrub smooths an already-smoothed signal — the two compound into lag that reads as mush rather than polish.
- **The video layer is only 1.04x the viewport, and never upscaled.** It used to be scaled 1.05 on the wrapper *and* 1.35 on the video — a 1.42x blow-up of a 1920x1080 source, re-composited on every parallax frame. At 1.04 the layer stays inside the source resolution on any display up to 1920, so the footage renders at or below 1:1.
- **One scrim element, not two.** Both gradients are background layers on a single node; two stacked full-screen overlays meant two extra composited layers over the video.
- **Parallax travel is derived from the overscale**, not hard-coded — `parallaxTravel()` keeps the drift inside the 4% margin so a narrow window can never expose the black edge behind the video.
- **Blur radius is modest: 36px desktop, 14px phones** (not 160px). Radius is the dominant cost, and over moving footage 36px is visually indistinguishable from 160px.
- **Pointer listeners are per-pane, not global.** Each `GlassSurface` listens on itself, so only the pane under the cursor does any work — the other five are idle.
- **One layout read per frame.** `getBoundingClientRect` runs inside a rAF-throttled callback, only for the hovered pane.
- **`gsap.quickTo` everywhere**, reusing one tween per property. The naive approach allocates a fresh tween on every `mousemove`.
- **The video pauses when the tab is hidden**, so a background tab stops decoding frames nobody can see.
- The background video **loops** rather than scrubbing. Seeking on every scroll frame forces the decoder to hunt keyframes; looping playback runs on the compositor and barely touches the main thread.

### Accessibility

- The split headline carries an `aria-label` with the clean string; the per-character spans are `aria-hidden`, so screen readers hear "Farruggia Facility" rather than spelling it out.
- The accordion uses real `<button>` elements with `aria-expanded` / `aria-controls`.
- Pill navigation responds to `focus`/`blur`, not just hover.
- Glass tilt re-enables itself if a pointer appears later (a 2-in-1 docking a mouse) rather than staying dead until reload.

### The reduced-motion policy

This is deliberately **not** the strict interpretation, and the reasoning lives
in [`src/lib/motion.ts`](src/lib/motion.ts).

On Windows, `prefers-reduced-motion` follows the OS-wide *Animation effects*
toggle, which many people switch off for perceived performance rather than
because motion makes them unwell. Treating it as "disable everything" silently
strips the site of its entire character for those visitors — which is exactly
what happened here: the tilt, glare, marquee, parallax and smooth scrolling
were all off on a machine with that setting disabled.

So the policy splits motion in two:

| Kind | Examples | Under reduced motion |
| --- | --- | --- |
| **Ambient** — plays with no input | The marquee | Disabled |
| **Input-driven** — only moves when the visitor does | Glass tilt, cursor glare, parallax, scrubbed reveals, smooth scrolling | Kept |

Nothing in the second group moves unless the visitor moves the pointer or the
scrollbar first. If you want the strict behaviour instead, make
`allowInputMotion()` return `!prefersReducedMotion()` — every effect on the site
routes through those three functions, so that one edit covers all of them.

---

## Responsive behaviour

Verified with no horizontal overflow and no clipped content at 375, 768, 800, 1024 and 1440 px, in both languages.

| Breakpoint | What changes |
| --- | --- |
| `< 360px` | Language toggle sheds its EN/DE labels, keeps the globe |
| `≤ 768px` | Hamburger menu replaces the pills; glass blur drops to 14px and the tint deepens; nav moves closer to the top edge |
| `≥ 768px` | Service cards and the panel accordion go to two columns |

Two sizing decisions worth knowing about:

- **The hero track is 300vh at every width.** It no longer needs a breakpoint: both fade distances are expressed in viewport heights, so the track scales with the screen automatically.
- **The about heading is fluid**, `clamp(1.375rem, 4.2vw, 3.5rem)`, rather than the originally specified fixed `96px`. At 96px that sentence ran to roughly nine lines and pushed the accordion out of the panel. Capping at 56px and moving the accordion to two columns keeps everything inside the glass at every width without an internal scrollbar.

---

## Deviations from the original template

1. **The background video loops instead of scrubbing with scroll** (requested change). `ScrollVideo.tsx` has been replaced by `BackgroundVideo.tsx`.
2. **Every section is glass over the video** (requested change). The template kept its glass treatment to a single about panel and put the rest of the page on opaque black. Here the services cards and the contact block are panes too, and no section has a background of its own.
3. **Tilt is per-pane rather than global.** The template tilted its one panel from the window cursor position. With six panes on screen that reads as everything sliding together, so each pane now tilts against its own bounds.
4. **Strictly monochrome palette** (requested change). The gold accent `#C9A96E` has been removed entirely — no hue anywhere. Emphasis comes from contrast, weight and scale: hover states run `text-white/50 → text-white`, the primary CTA is a solid white pill, the secondary a white hairline that inverts on hover.
5. **The hero track is 300vh, not 500vh** (requested change), with fades measured in viewport heights rather than fixed pixels. See the scroll-choreography table above.
6. **The `ABOUT` nav target.** The template scrolled to `document.body.scrollHeight`. That now lands in the footer, so `ABOUT` scrolls to the end of the hero track — the point where the glass panel is fully parked.
7. **Fluid about-panel heading** instead of a fixed 96px, for the reason above.

---

## Notes

- Legal pages (`Impressum`, `Datenschutz`) are placeholder anchors. Swiss sites need a real Impressum before launch.
- The phone number `+41 52 123 45 67` in `src/translations.ts` is a placeholder from the brief — replace it with the real line.
