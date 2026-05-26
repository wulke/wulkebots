# Auth

## Context and Design Philosophy

This LLD covers parent account creation, login, session management, and route protection. Only parents (creators) need accounts — viewers access bots via share link with no authentication.

The guiding constraint is **no third-party auth provider**. All credential storage, password hashing, and token issuance are implemented in the application. The implementation is intentionally small: two forms (register, login), one JWT issued per session, one middleware function protecting creator routes.

## Account Model

A parent account is identified by email address. Passwords are hashed with bcrypt (cost factor 12) before storage. No username, display name, or profile data is stored in v1 — the account exists solely to associate bots with an owner.

Email addresses are stored lowercase and trimmed. Uniqueness is enforced at the database level via a unique index on `users.email`.

## Registration

The registration flow collects email and password. Validation rules:

- Email must be a valid email format
- Password must be at least 8 characters
- Email must not already exist in the database (checked before insert; returns a field-level error if taken)

On successful registration, the user record is created and the user is immediately logged in — a JWT is issued and the session cookie is set. No email verification in v1.

## Login

The login flow collects email and password. On submission:

1. Look up the user by email (case-insensitive)
2. If the user is not found, run bcrypt comparison against a static dummy hash — this ensures the response time is indistinguishable from a failed password match, preventing timing-based user enumeration
3. If the user is found, compare the submitted password against the stored bcrypt hash
4. If credentials are valid, issue a JWT and set the session cookie
5. If credentials are invalid (user not found, or password mismatch), return a generic error message — "Invalid email or password" — without indicating which field is wrong

The combination of generic error message and constant-time bcrypt comparison prevents user enumeration via both error text and response timing.

## Session Management

Sessions are represented as JWTs stored in an `httpOnly`, `Secure`, `SameSite=Lax` cookie named `session`.

JWT payload:

```json
{
  "sub": "<userId>",
  "iat": <issued-at timestamp>,
  "exp": <expiry timestamp>
}
```

Token lifetime is 30 days. No refresh token mechanism in v1 — when the token expires the user must log in again. Changing `JWT_SECRET` invalidates all active sessions immediately (see infrastructure LLD).

The JWT is verified using the `JWT_SECRET` environment variable. The verification step checks signature validity and expiry. A tampered or expired token is treated identically to an absent token — the request is redirected to `/login`.

## Route Protection

A Next.js middleware function (`src/middleware.ts`) runs on all requests matching creator routes:

- `/dashboard`
- `/dashboard/*`
- `/create`
- `/create/*`
- `/api/bots/*`

The middleware:
1. Reads the `session` cookie
2. Verifies the JWT
3. If valid: attaches `userId` to the request context and passes through
4. If invalid or absent: redirects to `/login` (for page routes) or returns HTTP 401 (for API routes)

The viewer route (`/b/[token]`) is explicitly excluded from middleware — it must remain publicly accessible.

Public routes that redirect already-authenticated users (register, login) are also handled: if a valid session cookie is present on `/register` or `/login`, the user is redirected to `/dashboard`. This redirect only activates when the cookie is present and the JWT is valid — an absent or invalid cookie leaves the user on the login/register page, preventing redirect loops.

## Logout

Logout clears the `session` cookie by setting it to an empty value with an immediate expiry. No server-side token revocation — the JWT is stateless. After logout, the cookie is gone and subsequent requests are treated as unauthenticated.

## Decisions & Alternatives

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Auth approach | Custom JWT + bcrypt | Clerk, Auth.js, Supabase Auth | No vendor dependency. The implementation is small enough that a custom solution is not a liability; adding a third-party provider introduces account management, webhook handling, and external failure modes. |
| Token storage | `httpOnly` cookie | `localStorage`, memory | `httpOnly` cookies are not accessible to JavaScript, preventing XSS-based token theft. `localStorage` is vulnerable to XSS. Memory storage does not survive page reload. |
| Token lifetime | 30 days | Shorter (1h, 24h), longer | 30 days balances convenience (parents do not need to re-login often) against exposure (a stolen token is valid for at most 30 days). |
| Refresh tokens | None in v1 | Sliding sessions, refresh token rotation | Adds implementation complexity and a server-side token store. Not warranted at MVP scale. |
| Error message on login failure | Generic ("Invalid email or password") | Field-specific errors | Field-specific errors enable user enumeration — an attacker can determine whether an email is registered. Generic errors prevent this without meaningful UX cost. |
| Email verification | None in v1 | Verification email on register | Reduces friction for the MVP. The audience is parents sharing with family; the risk of fake accounts is low at this scale. |
| Password hashing | bcrypt (cost 12) | argon2, scrypt, bcrypt at other costs | bcrypt is well-supported in Node.js via `bcrypt` or `bcryptjs`. Cost factor 12 is the current reasonable default — slow enough to resist brute force, fast enough to not degrade login UX. |

## Open Questions & Future Decisions

### Resolved
1. ✅ Third-party auth provider vs. custom — custom chosen; no vendor dependency.
2. ✅ Cookie vs. localStorage — `httpOnly` cookie chosen for XSS protection.
3. ✅ Email verification — deferred for MVP.

### Deferred
1. **Account deletion.** No self-serve account deletion in v1. If a parent wants their account removed, it is a manual operator action. Add a self-serve flow if user demand arises.
2. **Password reset.** No "forgot password" flow in v1 — requires email sending infrastructure. Deferred until email is set up.
3. **Rate limiting on login.** No brute-force protection on the login endpoint in v1. Add if abuse is observed post-launch.

## References

- Infrastructure LLD: `docs/llds/infrastructure.md` (JWT_SECRET, cookie config)
- HLD: `docs/high-level-design.md`
