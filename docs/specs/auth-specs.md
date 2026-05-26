# Auth Specs

## Registration

- [ ] **AUTH-REG-001**: The system shall provide a registration form collecting email and password.
- [ ] **AUTH-REG-002**: When a registration form is submitted, the system shall reject email addresses that are not valid email format with a field-level error.
- [ ] **AUTH-REG-003**: When a registration form is submitted, the system shall reject passwords shorter than 8 characters with a field-level error.
- [ ] **AUTH-REG-004**: When a registration form is submitted with an email already registered (compared case-insensitively), the system shall reject the submission with a field-level error indicating the email is taken.
- [ ] **AUTH-REG-005**: When a registration form is submitted with valid, unique credentials, the system shall create the user record (storing email in lowercase, trimmed), issue a session JWT, set the session cookie, and redirect the parent to `/dashboard`.
- [ ] **AUTH-REG-006**: When a valid session cookie is present on `/register`, the system shall redirect the user to `/dashboard` without rendering the registration form.

## Login

- [ ] **AUTH-LGN-001**: The system shall provide a login form collecting email and password.
- [ ] **AUTH-LGN-002**: When a login form is submitted with valid credentials, the system shall issue a session JWT, set the session cookie, and redirect the parent to `/dashboard`.
- [ ] **AUTH-LGN-003**: When a login form is submitted with an unrecognized email or incorrect password, the system shall display the message "Invalid email or password" without indicating which field is wrong.
- [ ] **AUTH-LGN-004**: When a login form is submitted with an email that does not exist in the database, the system shall run a bcrypt comparison against a static dummy hash before returning a response, so that the response time is indistinguishable from a failed password match.
- [ ] **AUTH-LGN-005**: When a valid session cookie is present on `/login`, the system shall redirect the user to `/dashboard` without rendering the login form.

## Session Cookie

- [ ] **AUTH-SSN-001**: The system shall store session tokens in an `httpOnly`, `Secure`, `SameSite=Lax` cookie named `session`.
- [ ] **AUTH-SSN-002**: The system shall issue session JWTs with a 30-day expiry from time of issuance.
- [ ] **AUTH-SSN-003**: The JWT payload shall contain `sub` (userId), `iat` (issued-at), and `exp` (expiry) fields and no other user data.

## Route Protection

- [ ] **AUTH-MID-001**: The system shall apply JWT verification middleware to all requests matching `/dashboard`, `/dashboard/*`, `/create`, `/create/*`, and `/api/bots/*`.
- [ ] **AUTH-MID-002**: When a request to a protected page route carries an absent or invalid session cookie, the system shall redirect the request to `/login`.
- [ ] **AUTH-MID-003**: When a request to a protected API route (`/api/bots/*`) carries an absent or invalid session cookie, the system shall return HTTP 401 with no response body distinguishing the failure reason.
- [ ] **AUTH-MID-004**: When a request to a protected route carries a valid session cookie, the system shall make the `userId` from the JWT payload available to the route handler.
- [ ] **AUTH-MID-005**: The system shall not apply JWT verification middleware to the viewer route `/b/[token]`; that route shall remain publicly accessible.
- [ ] **AUTH-MID-006**: The system shall treat an expired session JWT identically to an absent or tampered token — redirect to `/login` for page routes, HTTP 401 for API routes.

## Logout

- [ ] **AUTH-LGT-001**: When a parent logs out, the system shall clear the `session` cookie by overwriting it with an empty value and an immediate expiry.
- [ ] **AUTH-LGT-002**: After logout, subsequent requests to protected routes shall be treated as unauthenticated.
