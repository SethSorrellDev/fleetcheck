# API Reference

Base URL: `http://localhost:8080` locally, `https://fleetcheck-j4y2.onrender.com` in production. Every endpoint below is prefixed with that base. Interactive docs (Swagger UI) are available at `/swagger-ui.html` once the backend is running.

For the reasoning behind the workflow states and the role rules, see [ARCHITECTURE.md](ARCHITECTURE.md). This document is the endpoint-by-endpoint reference.

## Authentication

Every route except `/`, `/swagger-ui/**`, `/v3/api-docs/**`, and `/h2-console/**` (local only) requires **HTTP Basic** auth. Send credentials on every request:

```
Authorization: Basic base64(username:password)
```

An unauthenticated request to a protected route returns **401**:

```json
{ "timestamp": "2026-09-19T10:00:00", "status": 401, "error": "Unauthorized", "message": "Authentication required.", "path": "/api/vehicles", "validationErrors": null }
```

An authenticated request from a role without permission for that route returns **403** (handled by Spring Security directly, not the app's own exception handler).

## Roles

`DRIVER`, `MECHANIC`, `FLEET_MANAGER`, `ADMIN` — one per `Account`. The table for each resource below lists which role(s) each method requires. **"any"** means any authenticated account, regardless of role.

## Errors

All errors raised by the application (as opposed to Spring Security's own 401/403) share one shape:

```json
{
  "timestamp": "2026-09-19T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Vehicle 42 not found",
  "path": "/api/vehicles/42",
  "validationErrors": null
}
```

| Status | Cause |
|---|---|
| 400 | Bean-validation failure (`validationErrors` is a populated list of `"field: message"` strings) or a business-rule violation, e.g. missing `repairType` when `requiresRepair` is true |
| 404 | Referenced resource doesn't exist |
| 409 | Duplicate unique field (unit number, employee ID, username) or an out-of-order status transition |
| 500 | Unexpected server error |

## Current user

### `GET /api/me` — any

Resolves the authenticated principal's role and, if it's a `DRIVER` account linked to a roster driver, that driver's ID — lets the frontend pre-fill the driver field on a new inspection.

```json
{ "username": "driver1", "role": "DRIVER", "driverId": 3 }
```

`driverId` is `null` for non-driver roles or an unlinked driver account.

## Health

### `GET /` — public

Plaintext liveness check, used by Render and by anyone confirming the API is up.

```
FleetCheck API is running.
```

## Vehicles — `/api/vehicles`

| Method | Path | Role |
|---|---|---|
| GET | `/api/vehicles` | any |
| GET | `/api/vehicles/{id}` | any |
| GET | `/api/vehicles/{id}/dispatch-status` | any |
| POST | `/api/vehicles` | FLEET_MANAGER |
| PUT | `/api/vehicles/{id}` | FLEET_MANAGER |
| DELETE | `/api/vehicles/{id}` | FLEET_MANAGER |

**VehicleDTO**

```json
{
  "id": 1,
  "unitNumber": "FC-104",
  "vehicleType": "STEP_VAN",
  "make": "Freightliner",
  "model": "MT45",
  "year": 2021,
  "licensePlate": "IN-4B2109",
  "assignedRoute": "Route 12",
  "currentOdometer": 58230,
  "active": true
}
```

`vehicleType` is one of `STEP_VAN`, `BOX_TRUCK`. `unitNumber` is unique — a duplicate on create/update returns 409.

**`GET /{id}/dispatch-status`** — computed live from open reports (see ARCHITECTURE.md), never cached:

```json
{ "vehicleId": 1, "unitNumber": "FC-104", "dispatchable": false, "blockingReportIds": [17] }
```

## Drivers — `/api/drivers`

| Method | Path | Role |
|---|---|---|
| GET | `/api/drivers` | any |
| GET | `/api/drivers/{id}` | any |
| POST | `/api/drivers` | FLEET_MANAGER |
| PUT | `/api/drivers/{id}` | FLEET_MANAGER |
| DELETE | `/api/drivers/{id}` | FLEET_MANAGER |

**DriverDTO**

```json
{ "id": 3, "firstName": "Alex", "lastName": "Rivera", "employeeId": "EMP-2201", "active": true }
```

`employeeId` is unique — a duplicate returns 409. This is the roster record; the login (username/password/role) is a separate `Account` resource, see below.

## Inspection reports — `/api/inspection-reports`

| Method | Path | Role |
|---|---|---|
| GET | `/api/inspection-reports` | MECHANIC, FLEET_MANAGER, ADMIN |
| GET | `/api/inspection-reports/queue` | MECHANIC, FLEET_MANAGER, ADMIN |
| GET | `/api/inspection-reports/by-vehicle/{vehicleId}` | MECHANIC, FLEET_MANAGER, ADMIN |
| GET | `/api/inspection-reports/{id}` | MECHANIC, FLEET_MANAGER, ADMIN |
| POST | `/api/inspection-reports` | DRIVER |
| PUT | `/api/inspection-reports/{id}` | FLEET_MANAGER |
| POST | `/api/inspection-reports/{id}/complete-repair` | MECHANIC |
| POST | `/api/inspection-reports/{id}/review` | DRIVER |
| DELETE | `/api/inspection-reports/{id}` | FLEET_MANAGER, ADMIN |

Note: a `DRIVER` account can create a report and later review one it already has the ID for, but cannot list or browse report history — see the RBAC note in ARCHITECTURE.md.

**InspectionReportDTO**

```json
{
  "id": 17,
  "vehicleId": 1,
  "driverId": 3,
  "inspectionDate": "2026-09-19",
  "odometerReading": 58230,
  "conditionSatisfactory": false,
  "requiresRepair": true,
  "repairType": "SAFETY",
  "repairDescription": "Left brake light out",
  "status": "REPAIR_REQUESTED",
  "driverSignedAt": "2026-09-19T06:41:12",
  "createdAt": "2026-09-19T06:41:12"
}
```

`repairType` (`SAFETY` | `NON_SAFETY` | `BOTH`) and `repairDescription` are required by the service layer — not just bean validation — whenever `requiresRepair` is `true` (400 if missing). `status` and `driverSignedAt`/`createdAt` are server-assigned on create and ignored if sent by the client.

**`GET /queue`** — reports currently `REPAIR_REQUESTED` or `REPAIR_COMPLETED` (the mechanic's actionable queue), unpaginated by design.

**`GET /by-vehicle/{vehicleId}`** — one vehicle's full report history, unpaginated by design.

**`GET /` (list)** — paginated:

```
GET /api/inspection-reports?page=0&size=20
```

```json
{
  "content": [ { "...": "InspectionReportDTO" } ],
  "page": 0,
  "size": 20,
  "totalElements": 143,
  "totalPages": 8,
  "hasNext": true,
  "hasPrevious": false
}
```

**`POST /{id}/complete-repair`** — `REPAIR_REQUESTED → REPAIR_COMPLETED`. Requires a `RepairOrder` already exists for the report with a non-blank `workPerformedDescription`; otherwise 400. Called from any other status: 409.

**`POST /{id}/review`** — `REPAIR_COMPLETED → REVIEWED_CLOSED`. Called from any other status: 409.

## Repair orders — `/api/repair-orders`

| Method | Path | Role |
|---|---|---|
| GET | `/api/repair-orders` | any |
| GET | `/api/repair-orders/{id}` | any |
| POST | `/api/repair-orders` | MECHANIC |
| PUT | `/api/repair-orders/{id}` | MECHANIC |
| DELETE | `/api/repair-orders/{id}` | FLEET_MANAGER |

**RepairOrderDTO**

```json
{
  "id": 9,
  "inspectionReportId": 17,
  "workPerformedDescription": "Replaced left brake light bulb and socket.",
  "completedByName": "mechanic1",
  "completedAt": null,
  "driverReviewedAt": null
}
```

One repair order per inspection report — creating a second for a report that already has one returns 409. `completedByName` is set server-side from the authenticated mechanic's username on create/update; any value sent in the request body for it is ignored.

## Damage markings — `/api/damage-markings`

| Method | Path | Role |
|---|---|---|
| GET | `/api/damage-markings` | any |
| GET | `/api/damage-markings/{id}` | any |
| POST | `/api/damage-markings` | DRIVER |
| PUT | `/api/damage-markings/{id}` | DRIVER |
| DELETE | `/api/damage-markings/{id}` | FLEET_MANAGER |

**DamageMarkingDTO**

```json
{
  "id": 4,
  "inspectionReportId": 17,
  "damageType": "DENT",
  "viewAngle": "SIDE",
  "xCoordinate": 132.5,
  "yCoordinate": 87.0,
  "notes": "Rear quarter panel, driver side"
}
```

`damageType`: `CHIP` | `HOLE` | `DENT` | `BROKEN` | `MISSING` | `SCRATCH` | `RUST` | `OTHER`. `viewAngle`: `FRONT` | `SIDE` | `REAR`. Coordinates are positions on that view's silhouette image, as placed in the frontend's damage diagram editor — there's no server-side bound on their range.

## Accounts — `/api/accounts`

| Method | Path | Role |
|---|---|---|
| GET | `/api/accounts` | ADMIN |
| GET | `/api/accounts/{id}` | ADMIN |
| POST | `/api/accounts` | ADMIN |
| PUT | `/api/accounts/{id}` | ADMIN |

No `DELETE` — accounts are disabled via `active: false`, not removed (see ARCHITECTURE.md).

**AccountDTO**

```json
{ "id": 5, "username": "driver2", "password": null, "role": "DRIVER", "driverId": 3, "active": true }
```

`password` is **write-only**: required (non-blank) on create, optional on update (omit or leave blank to keep the existing password), and always `null` on every response — the server never sends a password or its hash back, under any circumstance. `driverId` is optional and only meaningful for `DRIVER`-role accounts; a duplicate `username` returns 409.
