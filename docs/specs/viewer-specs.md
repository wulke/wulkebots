# Viewer Specs

## Route & Access

- [ ] **VIEW-ROUTE-001**: The system shall serve a public viewer page at `/b/[shareToken]` requiring no authentication.
- [ ] **VIEW-ROUTE-002**: When a `shareToken` does not match any bot in the database, the system shall return HTTP 404 with a "Bot not found" message.

## Page Layout

- [ ] **VIEW-LAYOUT-001**: The viewer page shall render as a full-screen layout with no navigation bar, header, or footer.
- [ ] **VIEW-LAYOUT-002**: The drawing image shall be rendered with `max-width: 100%` and `max-height: 70vh` with `object-fit: contain` so it always fits within the viewport without overflow on initial load.
- [ ] **VIEW-LAYOUT-003**: If the drawing image fails to load, the system shall display a neutral placeholder of the same constrained dimensions; tap and movement interactions shall remain functional on the placeholder.

## Quote Display

- [ ] **VIEW-QUOTE-001**: When a viewer taps or clicks the drawing, the system shall display the current quote in a speech bubble positioned above the drawing and apply a brief bounce animation to the drawing.
- [ ] **VIEW-QUOTE-002**: When a viewer taps the drawing while a quote is already displayed, the system shall advance to the next quote in `display_order` sequence; after the last quote, the system shall wrap back to the first.
- [ ] **VIEW-QUOTE-003**: The speech bubble shall remain visible until the next tap; it shall not auto-dismiss.
- [ ] **VIEW-QUOTE-004**: Each tap shall advance the quote immediately with no debounce, throttle, or animation lock.
- [ ] **VIEW-QUOTE-005**: The speech bubble shall have a maximum width of 80% of the viewport width, shall wrap text, and shall not truncate quote content regardless of length.
- [ ] **VIEW-QUOTE-006**: While a bot has zero quotes (data-integrity violation), tapping the drawing shall produce no speech bubble and no animation; the drawing shall remain otherwise interactive.

## Directional Movement

- [ ] **VIEW-MOVE-001**: The viewer page shall display four directional arrow buttons (↑ ↓ ← →).
- [ ] **VIEW-MOVE-002**: When a viewer taps a directional arrow, the system shall translate the drawing's position by 32px in the corresponding direction using CSS `transform: translate(x, y)`.
- [ ] **VIEW-MOVE-003**: Movement shall accumulate — tapping the same arrow multiple times moves the drawing by 32px per tap in that direction.
- [ ] **VIEW-MOVE-004**: The system shall not enforce viewport boundaries on movement; the drawing may be moved off-screen.
- [ ] **VIEW-MOVE-005**: Drawing position shall reset to the initial centered position on page refresh.

## Data & Rendering

- [ ] **VIEW-DATA-001**: The viewer page shall be server-rendered using bot data (name, imagePath, quotes ordered by `display_order`) fetched from the database at request time; no client-side data fetching occurs after the initial load.
- [ ] **VIEW-DATA-002**: Quote cycling state and drawing position shall be maintained in client component state only; they shall not be persisted to the server or to `localStorage`.
