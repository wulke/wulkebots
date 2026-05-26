# Dashboard

## Context and Design Philosophy

The dashboard is the parent's home screen after login. It lists all their wulkebots, gives them the share link for each bot, and lets them delete bots they no longer want. No other management actions exist in v1.

The dashboard is intentionally minimal — its job is to surface the share link quickly and get out of the way. Parents arrive here after creating a bot and want the link immediately.

## Bot List

The dashboard displays all bots owned by the authenticated parent, ordered by `created_at` descending (newest first).

Each bot card shows:
- The bot's drawing photo (thumbnail)
- The bot's name
- The full share URL (e.g., `https://wulkebots.com/b/{shareToken}`)
- A "Copy link" button
- A "Delete" button

If the parent has no bots, the dashboard shows an empty state with a prompt to create the first bot.

### Mobile-first layout

```
┌─────────────────────────────────────┐
│  My wulkebots              [+ New]  │
├─────────────────────────────────────┤
│  ┌──────┐  Robo Rex                 │
│  │ img  │  wulkebots.com/b/abc123   │
│  │      │  [Copy link]  [Delete]    │
│  └──────┘                           │
├─────────────────────────────────────┤
│  ┌──────┐  Space Cat                │
│  │ img  │  wulkebots.com/b/def456   │
│  │      │  [Copy link]  [Delete]    │
│  └──────┘                           │
└─────────────────────────────────────┘
```

## Copy Link

Tapping "Copy link" copies the full share URL to the device clipboard using the browser's `navigator.clipboard.writeText` API. After a successful copy, the button label changes to "Copied!" for 2 seconds, then reverts to "Copy link". No server request is made — the URL is constructed client-side from the share token already present in the page data.

If `navigator.clipboard` is unavailable or the write call throws (non-secure context, older browser, or permission denied), the button falls back to selecting the URL text in a temporary input element so the parent can copy it manually. The "Copied!" confirmation is only shown on a successful `navigator.clipboard.writeText` — it is not shown on the fallback path.

## Delete Bot

Tapping "Delete" on a bot card:

1. Shows an inline confirmation prompt — "Delete [bot name]? This cannot be undone." with "Cancel" and "Delete" options — replacing the button area
2. On confirmation, sends `DELETE /api/bots/[id]`
3. The server deletes the bot record and all associated quote records in a single transaction, then deletes the image file from the filesystem
4. On success, removes the bot card from the list without a full page reload
5. On server error or HTTP 401 (session expired), shows an inline error on the card and restores the delete button; a 401 additionally redirects the parent to `/login`

If the image file deletion fails (e.g., already missing), the bot record and quotes are still deleted. Missing image files are not treated as a hard error.

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/bots` | GET | Required | Returns all bots for the authenticated parent |
| `/api/bots/[id]` | DELETE | Required | Deletes a bot and its quotes and image |

### `GET /api/bots` response shape

```json
{
  "bots": [
    {
      "id": 42,
      "name": "Robo Rex",
      "shareToken": "550e8400-e29b-41d4-a716-446655440000",
      "imagePath": "42/drawing.jpg",
      "createdAt": "2026-05-26T10:00:00Z"
    }
  ]
}
```

The API returns only bots owned by the authenticated user — the `user_id` filter is applied server-side. A parent cannot retrieve another parent's bots.

### `DELETE /api/bots/[id]`

Returns HTTP 204 on success. If the bot does not exist or belongs to a different parent, returns HTTP 404. No response body.

## Decisions & Alternatives

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Delete confirmation | Inline confirmation replacing button area | Modal dialog, browser `confirm()` | Inline confirmation is mobile-friendly and avoids a modal for a simple destructive action. `confirm()` blocks the main thread and is not styleable. |
| Delete image on bot delete | Always attempt; missing file is not a hard error | Require file exists; transaction rollback if delete fails | A missing image file is an already-degraded state — the bot record is the authoritative source. Blocking deletion on a missing file would leave parents unable to clean up degraded bots. |
| Bot ordering | Newest first (`created_at` DESC) | Alphabetical, manual reorder | Newest first surfaces the most recently created bot immediately — typically what a parent wants after creating a new bot. |
| Share URL construction | Client-side, from share token in page data | Server-rendered full URL | The share token is already in the page data. Constructing the URL client-side avoids an extra server field and makes the base URL configurable via environment variable without server changes. |
| Pagination | None in v1 | Infinite scroll, page numbers | A parent is unlikely to have more than a handful of bots at MVP scale. Load all bots in a single request. |

## Open Questions & Future Decisions

### Resolved
1. ✅ Delete confirmation UX — inline confirmation chosen over modal.
2. ✅ Image deletion on bot delete — attempt deletion; missing file is not a hard error.
3. ✅ No pagination in v1.

### Deferred
1. **Bot editing.** No edit flow in v1 (see bot-creation LLD). A future edit flow would reuse the creation form.
2. **Sort/filter controls.** Once a parent has many bots, sorting alphabetically or filtering by date could help. Not needed at MVP scale.
3. **Bulk delete.** Not in scope for v1.

## References

- Auth LLD: `docs/llds/auth.md` (route protection for `/dashboard` and `/api/bots/*`)
- Bot Creation LLD: `docs/llds/bot-creation.md` (bot data model, share token)
- Infrastructure LLD: `docs/llds/infrastructure.md` (image serving, filesystem)
- HLD: `docs/high-level-design.md`
