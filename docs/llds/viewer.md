# Viewer

## Context and Design Philosophy

The viewer is the public-facing experience: the page a family member or friend opens when they receive a share link. No authentication is required. This is the product — everything else in the system exists to produce this page.

The guiding principle comes directly from the HLD tenet: **the drawing is the star**. The drawing fills the screen. Interaction controls are present but unobtrusive. The page must be immediately legible with zero instructions — a viewer tapping the bot within 10 seconds without prompting is the success criterion.

All interaction is local state. After the initial page load, no server calls are made. The page must feel instant.

## URL Structure

Each wulkebot is accessible at `/b/[shareToken]` where `shareToken` is the UUID generated at bot creation. This route is publicly accessible — no session cookie or authentication of any kind is required.

If the `shareToken` does not match any bot in the database, the page returns HTTP 404 with a simple "Bot not found" message.

## Page Layout

The viewer is a full-screen, full-bleed layout. The drawing photo is positioned as the central interactive element. Direction arrows occupy the four edges of the screen. The speech bubble appears above the drawing when a quote is active.

```
┌─────────────────────────────────────┐
│                                     │
│          ┌─────────────┐            │
│          │             │            │
│   [←]    │  drawing    │   [→]      │
│          │    .jpg     │            │
│   [↓]    └─────────────┘   [↑]     │
│                                     │
│  (speech bubble appears above       │
│   the drawing when tapped)          │
└─────────────────────────────────────┘
```

The page has no navigation bar, no header, and no footer. The bot's name may optionally appear as a small label below the drawing, but it is not the focus.

## Tap to Cycle Quotes

Tapping or clicking anywhere on the drawing photo triggers the quote display. Behavior:

1. On first tap: show the first quote in `display_order` sequence in a speech bubble above the drawing; apply a brief "bounce" CSS animation to the drawing
2. On subsequent taps: advance to the next quote in sequence; wrap around to the first quote after the last
3. The speech bubble remains visible until the next tap; it does not auto-dismiss
4. Each tap advances the quote immediately — there is no debounce, throttle, or animation lock; rapid taps cycle through quotes in sequence without queuing

A bot with zero quotes is a data-integrity violation (bot creation requires at least one quote). If encountered, the tap area is rendered but tapping produces no speech bubble and no animation. No error message is shown to the viewer — the drawing is still interactive via directional arrows.

### Speech bubble sizing

The speech bubble has a `max-width` of 80% of the viewport width and wraps text. Text is not truncated — all quote content is displayed regardless of length. If a quote is very long, the bubble grows vertically. The bubble is always positioned above the drawing's current translated position.

Quote cycling state is maintained in React component state — it is not persisted to the server or to `localStorage`. Refreshing the page resets to the initial state (no quote shown).

## Directional Movement

Four arrow buttons (↑ ↓ ← →) move the drawing around the screen. Each tap translates the drawing's position by a fixed step (32px) using CSS `transform: translate(x, y)`. The position accumulates — tapping ← three times moves the drawing 96px to the left.

There is no boundary enforcement in v1 — the drawing can be moved off-screen. No physics, no snapping, no momentum.

Movement position is maintained in React component state and resets on page refresh.

## Drawing Display

The drawing image is rendered with `max-width: 100%` and `max-height: 70vh` so that it always fits within the viewport regardless of its original dimensions. `object-fit: contain` preserves the aspect ratio. The drawing never overflows the viewport on initial load.

If the drawing image fails to load (404, network error), a neutral placeholder (grey rectangle of the same constrained dimensions) is shown in its place. Tap and movement interactions remain fully functional on the placeholder — the interaction target is the container, not the image itself.

## Data Loading

The viewer page is a Next.js Server Component that fetches bot data (name, imagePath, quotes ordered by `display_order`) from the database at request time. The page is server-rendered; the initial HTML contains all bot data.

The client component layer (for tap and movement interaction) is hydrated after the initial render. During hydration, the drawing is visible and static — no interaction is lost because the interactivity layer loads quickly.

Bot data is not re-fetched after the initial load. If the bot's quotes change after the page is loaded, the viewer does not see the updates until they refresh.

## Decisions & Alternatives

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Quote cycling trigger | Tap/click anywhere on the drawing | Dedicated "speak" button, swipe | Tapping the character is the most intuitive interaction — no instruction needed. A dedicated button requires the viewer to find it first. |
| Quote display | Speech bubble above the drawing | Toast notification, overlay panel, text below | A speech bubble directly associates the quote with the character. It is the universal convention for "this character is talking." |
| Quote auto-dismiss | None — bubble stays until next tap | Timed auto-dismiss (3s, 5s) | Auto-dismiss requires the viewer to read fast enough. Staying visible until the next tap lets the viewer share the screen with someone else at their own pace. |
| Movement step size | 32px per tap | Continuous hold-to-move, drag | Discrete steps work well on mobile (no drag precision needed). 32px is enough to produce visible movement without feeling too slow. |
| Boundary enforcement | None in v1 | Clamp to viewport, elastic bounce-back | Boundary enforcement requires knowing the viewport size and the drawing dimensions at render time — adds complexity for a behavior that is easily understood as "you moved it off screen." |
| Page rendering | Server Component + client hydration | Full client-side render, static generation | Server rendering ensures fast first paint and SEO-readability of bot metadata. Static generation would require cache invalidation on bot changes. Full client-side render delays the first meaningful paint. |

## Open Questions & Future Decisions

### Resolved
1. ✅ No auth required on viewer route.
2. ✅ Quote auto-dismiss — none; bubble stays until next tap.
3. ✅ No boundary enforcement in v1.
4. ✅ All interaction is local state — no server calls after page load.

### Deferred
1. **Sound effects.** A tap sound or "boing" effect on quote display would increase delight. Deferred — requires audio assets and browser autoplay policy handling.
2. **Animation variety.** Currently a single bounce animation on tap. A set of random animations (spin, wiggle, jump) would increase replayability. Deferred until the core loop is validated.
3. **Share button on viewer page.** A button that copies or shares the page URL would let viewers forward the link. Deferred — the URL bar is always available and serves this purpose adequately in v1.
4. **Bot name display.** Whether to show the bot's name on the viewer page is left to implementation — it should not compete with the drawing.

## References

- Infrastructure LLD: `docs/llds/infrastructure.md` (image serving route, filesystem)
- Bot Creation LLD: `docs/llds/bot-creation.md` (share token, quote data model)
- HLD: `docs/high-level-design.md`
