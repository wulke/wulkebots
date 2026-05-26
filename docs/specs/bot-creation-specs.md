# Bot Creation Specs

## Creation Form

- [ ] **BOT-FORM-001**: The system shall display a creation form at `/create` with three sections: photo upload, bot name, and quotes list.
- [ ] **BOT-FORM-002**: The system shall prevent form submission until a photo has been selected, a bot name has been entered, and at least one quote has been added.
- [ ] **BOT-FORM-003**: The photo upload area shall accept JPEG, PNG, and WEBP files only; file type and size constraints are enforced per INFRA-IMG-001 and INFRA-IMG-002.
- [ ] **BOT-FORM-004**: The bot name field shall accept a maximum of 40 characters; the system shall reject names exceeding this limit with an inline error.
- [ ] **BOT-FORM-005**: The quotes section shall allow a minimum of 1 and a maximum of 5 quotes.
- [ ] **BOT-FORM-006**: Each quote shall accept a maximum of 200 characters; the system shall reject quotes exceeding this limit with an inline error.
- [ ] **BOT-FORM-007**: When a parent attempts to add an empty or whitespace-only quote, the system shall reject it client-side without adding it to the list.
- [ ] **BOT-FORM-008**: When a parent taps "Add" with a valid quote, the system shall append the quote to the list with a delete button and clear the quote input field.
- [ ] **BOT-FORM-009**: When a parent taps the delete button on a quote, the system shall remove that quote from the list; if it was the only quote, the system shall disable the submit button.
- [ ] **BOT-FORM-010**: When a parent taps the delete button on a quote, the system shall not re-order the displayed list in a way that is disorienting; the remaining quotes shift up to fill the gap.

## Save Flow

- [ ] **BOT-SAVE-001**: When the creation form is submitted with valid data, the system shall first upload the image via `POST /api/bots/upload`, then submit the bot record via `POST /api/bots`.
- [ ] **BOT-SAVE-002**: When submitting a bot record, the system shall send quotes with `displayOrder` values as contiguous integers starting at 0, reflecting the order shown in the form at submission time.
- [ ] **BOT-SAVE-003**: When the image upload succeeds but the bot insert request fails due to a network error, the system shall display an inline error and allow the parent to retry the bot insert without re-uploading the image.
- [ ] **BOT-SAVE-004**: When the bot record is successfully created, the system shall redirect the parent to `/dashboard`.
- [ ] **BOT-SAVE-005**: When the server returns validation errors on `POST /api/bots`, the system shall display them as inline field-level errors on the form.

## API — Image Upload

- [ ] **BOT-API-001**: `POST /api/bots/upload` shall require authentication (per AUTH-MID-001).
- [ ] **BOT-API-002**: When a valid image is uploaded to `POST /api/bots/upload`, the system shall store it per INFRA-IMG-003 and return `{ "imagePath": "<relative path>" }`.

## API — Bot Creation

- [ ] **BOT-API-003**: `POST /api/bots` shall require authentication (per AUTH-MID-001).
- [ ] **BOT-API-004**: When `POST /api/bots` receives a valid request, the system shall insert the bot record and all quotes in a single database transaction and return `{ "shareToken": "<uuid>" }`.
- [ ] **BOT-API-005**: If any part of the bot-and-quotes transaction fails, the system shall roll back the entire transaction and return HTTP 500; no partial bot record shall be persisted.
- [ ] **BOT-API-006**: When `POST /api/bots` receives invalid data, the system shall return HTTP 400 with a JSON body of the shape `{ "errors": { "<fieldName>": "<message>" } }`, reporting all invalid fields in a single response.
- [ ] **BOT-API-007**: The system shall generate a UUID share token for each new bot at insert time and store it in `bots.share_token`; this token is globally unique and not reused.
- [ ] **BOT-API-008**: The system shall not enforce uniqueness on bot names; a parent may create multiple bots with the same name.
