# Admin Setup

Admin status is stored in the D1 database (`is_admin` column in the `users` table). To make a user an admin, they must first add their profile details, then update their status using SQL.

**Development (Local D1):**
```bash
pnpm wrangler d1 execute sailing-club-dev-db --local --command "UPDATE users SET is_admin = 1 WHERE did = 'did:key:z...';"
```

**Production (Remote D1):**
```bash
pnpm wrangler d1 execute sailing-club-prod-db --remote --command "UPDATE users SET is_admin = 1 WHERE did = 'did:key:z...';"
```

## Finding the right DID

Since `local-first-auth` v3, JWTs are signed with a **per-origin key** derived from the profile's root key, so the DID the server stores is **different on every origin**. The DID in the user's profile backup (their root DID) is *not* the one in the `users` table.

This means:

- Admin must be granted **separately per environment** — the DID you get on `http://localhost:5173` is not the DID you get on the production URL.
- Don't copy the DID out of an exported profile file. Read it from the database (or from the JWT's `iss` claim) after the user has signed in on that origin:

```bash
pnpm wrangler d1 execute sailing-club-dev-db --local --command "SELECT did, name FROM users;"
```
