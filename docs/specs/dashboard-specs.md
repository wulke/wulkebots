# Dashboard Specs

## Bot List

- [ ] **DASH-LIST-001**: The system shall display all wulkebots owned by the authenticated parent at `/dashboard`, ordered newest first by `created_at`.
- [ ] **DASH-LIST-002**: Each bot card shall display the bot's thumbnail image, name, full share URL, a "Copy link" button, and a "Delete" button.
- [ ] **DASH-LIST-003**: While the authenticated parent has no bots, the system shall display an empty state with a prompt to create the first bot.
- [ ] **DASH-LIST-004**: The `GET /api/bots` endpoint shall return only bots belonging to the authenticated parent; bots owned by other parents shall never appear in the response.

## Copy Link

- [ ] **DASH-COPY-001**: When a parent taps "Copy link", the system shall copy the full share URL to the device clipboard using `navigator.clipboard.writeText`.
- [ ] **DASH-COPY-002**: When the clipboard write succeeds, the button label shall change to "Copied!" for 2 seconds, then revert to "Copy link".
- [ ] **DASH-COPY-003**: If `navigator.clipboard` is unavailable or the write call throws, the system shall fall back to selecting the share URL in a temporary input element; the "Copied!" confirmation shall not be shown on the fallback path.
- [ ] **DASH-COPY-004**: The share URL shall be constructed client-side as `{baseUrl}/b/{shareToken}`; no additional server request is made to retrieve it.

## Delete Bot

- [ ] **DASH-DEL-001**: When a parent taps "Delete" on a bot card, the system shall display an inline confirmation prompt showing "Delete [bot name]? This cannot be undone." with "Cancel" and "Delete" options, replacing the button area.
- [ ] **DASH-DEL-002**: When a parent taps "Cancel" on the confirmation prompt, the system shall restore the original button area without taking any action.
- [ ] **DASH-DEL-003**: When a parent confirms deletion, the system shall send `DELETE /api/bots/[id]` and remove the bot card from the list on HTTP 204, without a full page reload.
- [ ] **DASH-DEL-004**: If the delete request returns a server error, the system shall display an inline error on the bot card and restore the delete button.
- [ ] **DASH-DEL-005**: If the delete request returns HTTP 401 (session expired), the system shall redirect the parent to `/login`.

## API — Bot List

- [ ] **DASH-API-001**: `GET /api/bots` shall require authentication (per AUTH-MID-001).
- [ ] **DASH-API-002**: `GET /api/bots` shall return a JSON body of the shape `{ "bots": [ { "id", "name", "shareToken", "imagePath", "createdAt" } ] }`, containing only the authenticated parent's bots.

## API — Delete Bot

- [ ] **DASH-API-003**: `DELETE /api/bots/[id]` shall require authentication (per AUTH-MID-001).
- [ ] **DASH-API-004**: When `DELETE /api/bots/[id]` is called by the bot's owner, the system shall delete the bot record, all associated quote records, and attempt to delete the image file — all within a single database transaction for the records; the image file deletion follows the transaction.
- [ ] **DASH-API-005**: If the image file does not exist during deletion, the system shall proceed and return HTTP 204 without error.
- [ ] **DASH-API-006**: If the bot does not exist or belongs to a different parent, `DELETE /api/bots/[id]` shall return HTTP 404.
- [ ] **DASH-API-007**: `DELETE /api/bots/[id]` shall return HTTP 204 with no response body on success.
