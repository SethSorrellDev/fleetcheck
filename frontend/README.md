# FleetCheck frontend

React + TypeScript SPA for [FleetCheck](../README.md) — the driver/mechanic/fleet-manager/admin client for the DVIR workflow. See the root [README](../README.md) for the problem this solves and [../ARCHITECTURE.md](../ARCHITECTURE.md) / [../API_REFERENCE.md](../API_REFERENCE.md) for the backend this talks to.

## Tech stack

React 18, TypeScript, Vite, React Router, Tailwind CSS v4. Tests with Vitest + React Testing Library.

## Structure

```
src/
├── api/          # Typed fetch client (client.ts) — adds the Bearer token header, throws ApiError on non-2xx
├── auth/         # AuthContext (session-storage tokens, current-user state), tokens.ts (identity-service sign-in and refresh), ProtectedRoute (role gate)
├── components/   # Shared UI — AppShell (nav/layout), DamageMarkerEditor (click-to-place damage diagram)
└── pages/        # One component per route (see Routes, below)
```

## Routes

Routing is role-gated per route via `ProtectedRoute`'s `allowedRoles` prop — a logged-in user who isn't allowed on a route is redirected to `/`, not just hidden a nav link:

| Route | Page | Allowed roles |
|---|---|---|
| `/login` | `LoginPage` | anyone |
| `/` | `DashboardPage` | any authenticated user |
| `/inspections/new` | `NewInspectionPage` | DRIVER |
| `/reports` | `ReportsListPage` | MECHANIC, FLEET_MANAGER, ADMIN |
| `/queue` | `MechanicQueuePage` | MECHANIC |
| `/vehicles` | `FleetOverviewPage` | MECHANIC, FLEET_MANAGER, ADMIN |
| `/vehicles/new` | `NewVehiclePage` | FLEET_MANAGER |
| `/vehicles/:id` | `VehicleHistoryPage` | MECHANIC, FLEET_MANAGER, ADMIN |
| `/drivers/new` | `NewDriverPage` | FLEET_MANAGER |
| `/accounts` | `AccountsPage` | ADMIN |

These match the backend's own role enforcement (see `SecurityConfig` in the backend) — the frontend gate is for navigation UX, the backend is the actual authorization boundary.

## Auth

Sign-in goes through the shared identity service, not FleetCheck's backend. `tokens.ts` posts the email and password to the identity service's `/auth/login`, keeps the access and refresh tokens in `sessionStorage` (cleared when the tab closes, never `localStorage`), and API requests carry the access token as a Bearer header. When the access token expires the app refreshes it; if that fails, the session is cleared and the user is sent back to the login page. `AuthContext` confirms who is signed in by calling `GET /api/me`, which also returns the user's FleetCheck role (the identity service holds no roles). On reload, it re-validates whatever tokens are in `sessionStorage` before rendering any protected route, rather than trusting stale local state. The identity service runs on a paid instance that stays awake, so sign-in should be quick.

## Getting started

**Prerequisites:** Node 18+, and the backend running locally (see the [root README](../README.md)).

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. Vite's dev server proxies `/api/*` to `http://localhost:8080` (see `vite.config.ts`), so no `.env` is needed for local development — just have the backend running.

## Testing

```bash
npm test        # single run
npm run test:watch
```

Vitest + React Testing Library, `jsdom` environment. Covers the API client's error handling, `AuthContext`'s login/logout/session-restore flow, `ProtectedRoute`'s role gating, and the damage marker editor.

## Building & deploying

```bash
npm run build
```

Type-checks (`tsc -b`) then builds a static bundle to `dist/`. The only runtime configuration is where the API lives:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API. Falls back to `/api` (the dev proxy target) if unset. |
| `VITE_IDENTITY_URL` | Base URL of the identity service used for sign-in. Falls back to `http://localhost:8081` if unset. |

In production this is deployed as a Render static site pointed at the FleetCheck backend — see the [root README](../README.md#deployment) for the full env var reference.

## Linting

```bash
npm run lint
```
