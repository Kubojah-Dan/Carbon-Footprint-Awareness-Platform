# EarthPrint Security Architecture & Policy

This document details the security protocols, policies, and defenses configured across the EarthPrint platform.

---

## 1. Environment & API Secrets Boundaries

To safeguard sensitive API integrations (Gemini, Groq, Firebase Admin certificates), EarthPrint operates on a strict server-client boundary:
1. **Server-Only Variables:** Credentials like `FIREBASE_ADMIN_PRIVATE_KEY` and `GROQ_API_KEY` are not prefixed with `NEXT_PUBLIC_` and are completely ignored during bundle build. They remain strictly in the Node.js runtime environment.
2. **REST API Broker:** Clients cannot directly query third-party AI APIs. Instead, the client issues request calls to internal Next.js route handlers (`/api/v1/*`), which validate parameters, check rate limits, and make secure requests using the server-only variables.

---

## 2. API Abuse Defenses: Sliding-Window Rate Limiting

To prevent denial-of-service, API spamming, and budget overruns on Groq/Gemini calls, sensitive routes integrate a rate limiter:
* **Storage Model:** Employs a sliding-window in-memory bucket tracker implemented in `web/lib/rate-limiter.ts`.
* **Rate Limits Table:**
  | Endpoint | Limit | Window | Identification Key |
  | :--- | :--- | :--- | :--- |
  | `/api/v1/ai/haiku` | 20 | 1 Hour | `haiku_{uid_or_ip}` |
  | `/api/v1/ai/journal` | 30 | 1 Hour | `journal_{ip}` |
* **Headers returned on limit breach:**
  * `HTTP 429 Too Many Requests`
  * `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, and `X-RateLimit-Reset` (epoch reset time).

---

## 3. Web Defenses: Content Security Policy (CSP)

Next.js is configured in `web/next.config.mjs` to return strict security headers on every response, safeguarding the application against Clickjacking and Cross-Site Scripting (XSS):

* **`X-Frame-Options: DENY`**: Prevents the platform from being rendered inside an iframe, blocking clickjacking attacks.
* **`X-Content-Type-Options: nosniff`**: Prevents browsers from MIME-sniffing responses.
* **`Referrer-Policy: strict-origin-when-cross-origin`**: Ensures referral paths are stripped down when querying external networks.
* **`Permissions-Policy`**: Restricts browser features, allowing camera inputs for Planetary Mirror while completely disabling microphone access:
  ```
  camera=(self), microphone=(), geolocation=(self)
  ```
* **Content-Security-Policy (CSP):**
  * `default-src 'self'`: Restricts resource loads to the origin by default.
  * `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io`: Restricts execution of script payloads.
  * `connect-src 'self' https://api.groq.com ... https://*.sentry.io`: Permits Fetch/WebSocket channels only to safe APIs.
  * `img-src 'self' data: blob: https://lh3.googleusercontent.com ...`: Permits images to load from Google OAuth and Open Food Facts.

---

## 4. Database Security: Firestore Rules

All data reads and writes originating from client SDKs are strictly governed by [firestore.rules](file:///d:/EarthPrint/Carbon-Footprint-Awareness-Platform/firestore/firestore.rules):
1. **Ownership Constraint:** Users can only view or edit logs `/users/{uid}/logs/{id}` where the database path matches their authenticated user token: `request.auth.uid == uid`.
2. **Seeded Documents:** Collections like `/challenges` and `/marketplace-actions` are marked read-only on the client side, preventing users from tampering with rewards.
3. **Write Constraints:** User badges and AI recommendations are configured with `allow write: if false`, preventing clients from creating badges for themselves. They can only be written by Cloud Functions.
