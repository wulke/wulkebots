# Bot Creation

## Context and Design Philosophy

This LLD covers the flow by which a parent creates a wulkebot: uploading a photo of their child's drawing, adding quotes the bot will say, naming the bot, and saving it to receive a shareable link. This is the core creator-side interaction — everything before this point (auth, infrastructure) exists to support it.

The guiding principle is **minimal friction from photo to share link**. The form should be completable in under two minutes on a mobile phone. Every field that is not essential to the viewer experience is omitted.

## Bot Data

A bot record holds:

- `id` — internal primary key
- `user_id` — the parent who owns it
- `name` — a short display name for the bot (shown on the viewer page and in the dashboard)
- `image_path` — relative path to the drawing photo (see infrastructure LLD)
- `share_token` — UUID generated at insert time, used in the viewer URL
- `created_at` — timestamp

A bot must have at least one quote to be saved. Quotes are stored in a separate `quotes` table with `display_order` controlling the cycling sequence on the viewer page.

## Creation Form

The creation page (`/create`) presents a single-page form with three sections:

1. **Photo upload** — a tap-to-upload area that opens the device camera or file picker. On mobile, the camera is offered as the default source. Accepted types and size limits are enforced per the infrastructure LLD (JPEG/PNG/WEBP, max 10 MB).

2. **Bot name** — a short text field. Required. Maximum 40 characters.

3. **Quotes** — a dynamic list. The parent types a quote and taps "Add". Each added quote appears in the list with a delete button. Minimum 1 quote, maximum 5 quotes. Maximum 200 characters per quote. Empty or whitespace-only quotes are rejected client-side and not added to the list.

The form cannot be submitted until all three sections are complete: a photo is selected, a name is entered, and at least one quote has been added.

### Mobile-first layout

```
┌─────────────────────────────────────┐
│  Create your wulkebot               │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │   Tap to add drawing photo    │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  Bot name                           │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  Quotes  (1–5)                      │
│  ┌───────────────────────────────┐  │
│  │ Type a quote...           [+] │  │
│  └───────────────────────────────┘  │
│  • "Hello!" [×]                     │
│  • "I'm a robot!" [×]               │
│                                     │
│  [       Create wulkebot       ]    │
└─────────────────────────────────────┘
```

## Save Flow

On form submission:

1. Validate all fields client-side; surface errors inline if invalid
2. Upload the image via `POST /api/bots/upload` (returns the stored image path)
3. Submit the bot record via `POST /api/bots` with name, image path, and quotes array
4. Server generates a UUID share token, inserts the bot and quotes in a single database transaction
5. Server returns the new bot's share token
6. Client redirects to `/dashboard` with the new bot highlighted, share link visible and ready to copy

If the image upload succeeds but the bot record insert fails, the orphaned image file is left on disk. A cleanup mechanism for orphaned images is deferred.

### Error handling

- Network error during image upload: display inline error, allow retry without re-selecting the photo
- Network error during bot insert: display inline error, allow retry (image is already uploaded; do not re-upload)
- Server validation error: display field-level errors returned by the API

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/bots/upload` | POST | Required | Upload bot image; returns `{ imagePath }` |
| `/api/bots` | POST | Required | Create bot record with quotes; returns `{ shareToken }` |

Bot names are not required to be unique — a parent may have multiple bots with the same name. Name uniqueness is not enforced at the database level.

### `POST /api/bots` request shape

```json
{
  "name": "Robo Rex",
  "imagePath": "42/drawing.jpg",
  "quotes": [
    { "text": "Hello!", "displayOrder": 0 },
    { "text": "I'm a robot!", "displayOrder": 1 }
  ]
}
```

The client assigns `displayOrder` values as 0-based integers matching the current list order at submission time. If a quote is deleted before submission, the client renumbers remaining quotes to maintain a contiguous 0–N sequence before sending.

### `POST /api/bots` response shape (success)

```json
{
  "shareToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

### `POST /api/bots` response shape (validation error)

```json
{
  "errors": {
    "name": "Bot name is required",
    "quotes": "At least one quote is required"
  }
}
```

Field keys match the request body keys. Quote-level errors (e.g., a single quote exceeding 200 characters) use `"quotes"` as the key with a descriptive message. The server validates all fields and returns all errors in a single response — not one at a time.

The bot and all its quotes are inserted in a single SQLite transaction. If any part of the insert fails, the entire transaction is rolled back and the client receives a 500 error. No partial bot (with fewer quotes than submitted) is ever persisted.

## Decisions & Alternatives

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Two-step upload (image first, then bot record) | Separate image upload and bot insert | Single multipart request | Separating the upload allows the client to retry the bot insert without re-uploading the image. A single multipart request is simpler but makes retry harder to implement correctly. |
| Quote limit | 1 minimum, 5 maximum | No limit, higher limit | A minimum of 1 ensures the viewer experience is never empty. A maximum of 5 keeps the creation form manageable on mobile and prevents content sprawl. |
| Bot name character limit | 40 characters | No limit, other limits | 40 characters fits comfortably in the dashboard list and viewer page header on a mobile screen without truncation. |
| Quote character limit | 200 characters per quote | No limit, other limits | 200 characters is enough for a funny sentence and still fits in a speech bubble without wrapping badly on small screens. |
| Client-side validation first | Validate on client, then server | Server-only validation | Client-side validation gives immediate feedback on mobile without a network round-trip. Server-side validation is also enforced as the authoritative check. |
| Orphaned image cleanup | Deferred | Delete on bot insert failure | Cleanup logic adds complexity for a failure mode that is rare at MVP scale. Orphaned files can be identified and removed manually or by a future cleanup job. |
| Single-page form | All fields on one page | Multi-step wizard | A single page is faster to complete and easier to implement. A wizard makes sense if the form grows significantly. |

## Open Questions & Future Decisions

### Resolved
1. ✅ One image per bot — confirmed; the image path is deterministic per bot.
2. ✅ Quote limits — 1 minimum, 5 maximum, 200 chars each.
3. ✅ Bot name limit — 40 characters.

### Deferred
1. **Bot editing.** No edit flow in v1 — a bot's name, image, and quotes are set at creation and cannot be changed. Add an edit flow post-MVP if parents request it.
2. **Orphaned image cleanup.** If image upload succeeds but bot insert fails, the image file is left on disk. A scheduled cleanup job can identify and remove images with no corresponding bot record.
3. **Draft saving.** The form has no draft/auto-save behavior in v1. If the parent navigates away, their progress is lost.

## References

- Infrastructure LLD: `docs/llds/infrastructure.md` (image upload constraints, API route handler)
- Auth LLD: `docs/llds/auth.md` (route protection for `/create` and `/api/bots/*`)
- HLD: `docs/high-level-design.md`
