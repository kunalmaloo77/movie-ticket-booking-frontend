# 🎬 Movie Ticket Booking — Frontend

React 19 + Vite + Tailwind frontend for the movie booking platform. The API lives in [movie-booking-backend](https://github.com/kunalmaloo77/movie-booking-backend).

## Setup

```bash
npm install
cp .env.example .env     # set VITE_RAZORPAY_KEY_ID
npm run dev              # http://localhost:5173
```

Start the backend on `http://localhost:3000` first. The Vite dev server proxies `/api` to it (override with `VITE_API_PROXY_TARGET`), so **open the app at `http://localhost:5173`**: auth cookies are only sent to the app's own origin.

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with the `/api` proxy |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Authentication

Sign-in happens in a modal: **Continue with Google**, or an email followed by **Continue with password** / **Email me a code**. It also covers sign-up with email verification, forgot/reset password, and an **Account settings** page (`/account`) for login methods and logging out everywhere.

- Sessions are `httpOnly` cookies set by the backend. The app never sees or stores a token. `src/api.js` sends cookies, adds the `X-CSRF-Token` header on writes, and on `AUTH_TOKEN_EXPIRED` refreshes the session once and retries.
- `src/context/AuthContext.jsx` loads the current user from `/api/auth/me` and exposes every flow through `useAuth()`. `ProtectedRoute` waits for that check before deciding.
- Google sign-in is a full-page redirect to `/api/auth/google/start`. The backend runs the OAuth code flow and redirects back with `?auth=` or `?auth_error=`, which the app shows as a toast.

Google OAuth and email settings live on the backend; see its README.

## Deployment (Vercel)

`vercel.json` rewrites `/api/*` to the backend (currently `https://movie-booking-backend-pibk.onrender.com`) before the SPA fallback. Keeping the API on the same origin is what lets the `SameSite=Lax` session cookies work. If the backend moves, update that URL, and set the backend's `APP_ORIGIN` / `CORS_ORIGINS` to the Vercel domain.
