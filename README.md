# FleetCheck

![CI](https://github.com/SethSorrellDev/fleetcheck/actions/workflows/ci.yml/badge.svg)

A digital Driver Vehicle Inspection Report (DVIR) system built to replace a paper-and-carbon-copy process at a Cintas route-service operation.

## The problem

Drivers currently fill out a paper DVIR booklet at the start and end of every shift — a white original that stays in the book, a pink copy turned in daily. In practice this means illegible handwriting, delays getting reported defects to a mechanic, sheets that get lost, and drivers losing time on a process that should take under a minute. FleetCheck moves that workflow online: fast structured entry for drivers, a real repair workflow for mechanics, and a live dispatch-status view for fleet managers — with paper explicitly treated as a fallback, not the default.

## Features

- **Role-based workflow** — Driver, Mechanic, Fleet Manager, and Admin roles, each with a distinct view and distinct permissions enforced server-side (Spring Security), not just hidden in the UI
- **Status workflow engine** — inspection reports move through `SATISFACTORY` / `REPAIR_REQUESTED` / `REPAIR_COMPLETED` / `REVIEWED_CLOSED`, with every transition validated server-side
- **Live dispatch-status derivation** — a vehicle's dispatchability is computed on demand from its open safety-critical repairs, never cached or manually toggled
- **Interactive damage diagram** — click-to-place damage markers on front/side/rear truck silhouettes, using the same damage-type legend (Chip/Hole/Dent/Broken/Missing/Scratch/Rust/Other) as the physical paper form
- **Mechanic repair queue** — an actionable, three-stage queue (needs repair order → ready to complete → awaiting driver review), not just a filtered list
- **Fleet & vehicle history views** — a fleet-wide dispatch-status table and a full per-vehicle inspection/repair/damage timeline
- **Test coverage** — unit tests (Mockito) on the workflow engine, integration tests (MockMvc + Spring Security Test) exercising the full DVIR lifecycle through real HTTP and real authorization rules
- **CI** — GitHub Actions runs the full test suite on every push and pull request

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Security, H2 (dev) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Testing | JUnit 5, Mockito, MockMvc, Spring Security Test |
| CI | GitHub Actions |

## Project structure
fleetcheck/
├── src/ # Spring Boot backend
│ ├── main/java/com/fleetcheck/
│ │ ├── domain/ # JPA entities and enums
│ │ ├── dto/ # Flat request/response DTOs
│ │ ├── repository/ # Spring Data repositories
│ │ ├── service/ # Business logic, workflow rules
│ │ ├── controller/ # REST endpoints
│ │ ├── security/ # Spring Security config, auth
│ │ ├── exception/ # Custom exceptions, global handler
│ │ └── seed/ # Dev/demo seed data
│ └── test/ # Unit + integration tests
└── frontend/ # React + TypeScript SPA
└── src/
├── api/ # Typed API client
├── auth/ # Auth context, protected routes
├── components/ # Shared UI (app shell, damage editor)
└── pages/ # Route-level views
## Getting started

**Prerequisites:** JDK 21+, Maven, Node 18+

**Backend**
```bash
mvn spring-boot:run
```
Runs on `http://localhost:8080`. Seed data and dev accounts load automatically on first boot.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`, proxying `/api` requests to the backend.

**Dev accounts** (password: `password123` for all)

| Username | Role |
|---|---|
| `driver1`, `driver2` | Driver |
| `mechanic1` | Mechanic |
| `manager1` | Fleet Manager |
| `admin1` | Admin |

**API docs:** interactive Swagger UI at `http://localhost:8080/swagger-ui.html` once the backend is running.

## Running tests

```bash
mvn test
```

## Roadmap

- [ ] PostgreSQL migration + live deployment (Render)
- [ ] PDF export of a completed DVIR (paper as fallback, not default)
- [ ] Photo attachments for damage markings

## License

MIT
