#!/usr/bin/env python3
"""Load a fully fictional sample fleet into a running FleetCheck backend.

Everything in scripts/sample_data.json is invented: unit numbers (SMP-xxx),
plates, driver names and repair descriptions. The data covers every stage of
the inspection workflow, so each dashboard has something to show:

    satisfactory | repair requested | repair order drafted |
    repair completed (awaiting driver review) | reviewed and closed

FleetCheck holds only roles; people sign in through identity-service. Each
write is restricted to one role, so the script acts as four people:

  * you (an existing ADMIN) create the sample accounts,
  * a sample FLEET_MANAGER creates vehicles and drivers,
  * a sample DRIVER submits reports and reviews finished repairs,
  * a sample MECHANIC writes repair orders and completes repairs.

The three sample people are registered in identity-service with the
SEED_PERSONA_PASSWORD you provide (use a long throwaway value; 12+ chars) and
email addresses sample.manager@ / sample.driver@ / sample.mechanic@ the
domain in SEED_EMAIL_DOMAIN (default demo.invalid).

    export FLEETCHECK_URL=https://fleetcheck-j4y2.onrender.com
    export IDENTITY_URL=https://identity-service-c5ab.onrender.com
    export SEED_ADMIN_EMAIL=you@example.com     # an active ADMIN account
    export SEED_ADMIN_PASSWORD=...              # or be prompted
    export SEED_PERSONA_PASSWORD=...            # or be prompted
    python3 scripts/seed_sample.py                # add (safe to re-run)
    python3 scripts/seed_sample.py --remove       # delete the sample data

Standard library only. Re-running skips anything that exists. --remove deletes
the sample vehicles, drivers, reports, repair orders and damage markings, and
sets the three sample accounts inactive (accounts cannot be deleted).
"""
import getpass
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path

DATA_FILE = Path(__file__).with_name("sample_data.json")
UNIT_PREFIX = "SMP-"
DRIVER_PREFIX = "SMP-D"


class ApiError(RuntimeError):
    def __init__(self, msg, status=None):
        super().__init__(msg)
        self.status = status


class Client:
    def __init__(self, base_url, token=None):
        self.base = base_url.rstrip("/")
        self.token = token

    def request(self, method, path, body=None):
        hdrs = {"Accept": "application/json"}
        data = None
        if self.token:
            hdrs["Authorization"] = f"Bearer {self.token}"
        if body is not None:
            data = json.dumps(body).encode()
            hdrs["Content-Type"] = "application/json"
        req = urllib.request.Request(self.base + path, data=data, method=method, headers=hdrs)
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                text = resp.read().decode()
                return json.loads(text) if text else None
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            raise ApiError(f"{method} {path} -> {e.code}: {detail}", e.code) from None
        except urllib.error.URLError as e:
            raise ApiError(f"{method} {path} failed: {e.reason}") from None


def login(identity_url, email, password):
    resp = Client(identity_url).request("POST", "/auth/login", {"email": email, "password": password})
    return resp["accessToken"]


def register_if_needed(identity_url, email, password, first, last):
    """Create the identity account; an existing one (409) is fine."""
    try:
        Client(identity_url).request("POST", "/auth/register", {
            "email": email, "password": password, "firstName": first, "lastName": last})
    except ApiError as e:
        if e.status not in (409, 400):
            raise
        # 400/409 both mean "already registered" on the identity service; a wrong
        # password for an existing account surfaces at login, with a clear error.


class Personas:
    def __init__(self, cfg):
        self.cfg = cfg
        self.clients = {}

    def acting_as(self, key):
        if key not in self.clients:
            p = self.cfg["people"][key]
            register_if_needed(self.cfg["identity"], p["email"], self.cfg["persona_password"],
                               p["first"], p["last"])
            try:
                token = login(self.cfg["identity"], p["email"], self.cfg["persona_password"])
            except ApiError as e:
                raise ApiError(f"Could not sign in the sample {key} ({p['email']}). If it already "
                               f"exists, SEED_PERSONA_PASSWORD must match. {e}") from None
            self.clients[key] = Client(self.cfg["backend"], token)
        return self.clients[key]


def make_cfg(admin_email=None, admin_password=None, persona_password=None):
    domain = os.environ.get("SEED_EMAIL_DOMAIN", "demo.invalid")
    return {
        "backend": os.environ.get("FLEETCHECK_URL", "http://localhost:8080"),
        "identity": os.environ.get("IDENTITY_URL", "http://localhost:8081"),
        "admin_email": admin_email, "admin_password": admin_password,
        "persona_password": persona_password,
        "people": {
            "manager": {"email": f"sample.manager@{domain}", "first": "Sam", "last": "Manager",
                        "username": "sample-manager", "role": "FLEET_MANAGER"},
            "driver": {"email": f"sample.driver@{domain}", "first": "Dee", "last": "Driver",
                       "username": "sample-driver", "role": "DRIVER"},
            "mechanic": {"email": f"sample.mechanic@{domain}", "first": "Max", "last": "Mechanic",
                         "username": "sample-mechanic", "role": "MECHANIC"},
        },
    }


def admin_client(cfg):
    return Client(cfg["backend"], login(cfg["identity"], cfg["admin_email"], cfg["admin_password"]))


def ensure_account(admin, person, driver_id=None):
    accounts = admin.request("GET", "/api/accounts") or []
    existing = next((a for a in accounts if a["email"].lower() == person["email"].lower()), None)
    body = {"username": person["username"], "email": person["email"], "role": person["role"],
            "driverId": driver_id, "active": True}
    if existing is None:
        return admin.request("POST", "/api/accounts", body), True
    changed = (not existing.get("active")) or (driver_id is not None and existing.get("driverId") != driver_id)
    if changed:
        body["driverId"] = driver_id if driver_id is not None else existing.get("driverId")
        return admin.request("PUT", f"/api/accounts/{existing['id']}", body), False
    return existing, False


def seed(cfg, data):
    report = {"accounts": 0, "vehicles": 0, "drivers": 0, "reports": 0,
              "repair_orders": 0, "damage_markings": 0, "completed": 0, "reviewed": 0}
    admin = admin_client(cfg)
    personas = Personas(cfg)

    # Manager first: it creates the roster the driver account links to.
    _, made = ensure_account(admin, cfg["people"]["manager"])
    report["accounts"] += int(made)
    manager = personas.acting_as("manager")

    vehicles = {v["unitNumber"]: v for v in manager.request("GET", "/api/vehicles") or []}
    for spec in data["vehicles"]:
        if spec["unitNumber"] not in vehicles:
            vehicles[spec["unitNumber"]] = manager.request(
                "POST", "/api/vehicles", dict(spec, active=True))
            report["vehicles"] += 1

    drivers = {d["employeeId"]: d for d in manager.request("GET", "/api/drivers") or []}
    for spec in data["drivers"]:
        if spec["employeeId"] not in drivers:
            drivers[spec["employeeId"]] = manager.request("POST", "/api/drivers", dict(spec, active=True))
            report["drivers"] += 1

    first_driver = drivers[data["drivers"][0]["employeeId"]]["id"]
    _, made = ensure_account(admin, cfg["people"]["driver"], first_driver)
    report["accounts"] += int(made)
    _, made = ensure_account(admin, cfg["people"]["mechanic"])
    report["accounts"] += int(made)
    driver = personas.acting_as("driver")
    mechanic = personas.acting_as("mechanic")

    today = date.today()
    orders = {o["inspectionReportId"]: o for o in mechanic.request("GET", "/api/repair-orders") or []}
    markings = driver.request("GET", "/api/damage-markings") or []

    for spec in data["reports"]:
        vehicle = vehicles[spec["unit"]]
        when = (today - timedelta(days=spec["daysAgo"])).isoformat()
        history = manager.request("GET", f"/api/inspection-reports/by-vehicle/{vehicle['id']}") or []
        rep = next((r for r in history if r["inspectionDate"] == when
                    and r["odometerReading"] == spec["odometer"]), None)
        if rep is None:
            payload = {"vehicleId": vehicle["id"], "driverId": drivers[spec["driver"]]["id"],
                       "inspectionDate": when, "odometerReading": spec["odometer"],
                       "conditionSatisfactory": spec["satisfactory"],
                       "requiresRepair": spec["requiresRepair"]}
            if spec["requiresRepair"]:
                payload["repairType"] = spec["repairType"]
                payload["repairDescription"] = spec["repairDescription"]
            rep = driver.request("POST", "/api/inspection-reports", payload)
            report["reports"] += 1

        for m in spec.get("damage", []):
            if not any(x["inspectionReportId"] == rep["id"] and x["xCoordinate"] == m["x"]
                       and x["yCoordinate"] == m["y"] for x in markings):
                markings.append(driver.request("POST", "/api/damage-markings", {
                    "inspectionReportId": rep["id"], "damageType": m["damageType"],
                    "viewAngle": m["viewAngle"], "xCoordinate": m["x"], "yCoordinate": m["y"],
                    "notes": m["notes"]}))
                report["damage_markings"] += 1

        outcome = spec["outcome"]
        if outcome in ("ORDER_DRAFTED", "REPAIR_COMPLETED", "REVIEWED_CLOSED") and rep["id"] not in orders:
            orders[rep["id"]] = mechanic.request("POST", "/api/repair-orders", {
                "inspectionReportId": rep["id"], "workPerformedDescription": spec["repairWork"]})
            report["repair_orders"] += 1
        status = rep["status"]
        if outcome in ("REPAIR_COMPLETED", "REVIEWED_CLOSED") and status == "REPAIR_REQUESTED":
            rep = mechanic.request("POST", f"/api/inspection-reports/{rep['id']}/complete-repair")
            report["completed"] += 1
            status = rep["status"]
        if outcome == "REVIEWED_CLOSED" and status == "REPAIR_COMPLETED":
            driver.request("POST", f"/api/inspection-reports/{rep['id']}/review")
            report["reviewed"] += 1
    return report


def remove(cfg, data):
    out = {"reports": 0, "repair_orders": 0, "damage_markings": 0, "vehicles": 0,
           "drivers": 0, "accounts_deactivated": 0}
    admin = admin_client(cfg)
    manager = Personas(cfg).acting_as("manager")

    vehicles = [v for v in manager.request("GET", "/api/vehicles") or []
                if v["unitNumber"].startswith(UNIT_PREFIX)]
    ids = {v["id"] for v in vehicles}
    reports = []
    for v in vehicles:
        reports += manager.request("GET", f"/api/inspection-reports/by-vehicle/{v['id']}") or []
    rids = {r["id"] for r in reports}

    for m in manager.request("GET", "/api/damage-markings") or []:
        if m["inspectionReportId"] in rids:
            manager.request("DELETE", f"/api/damage-markings/{m['id']}")
            out["damage_markings"] += 1
    for o in manager.request("GET", "/api/repair-orders") or []:
        if o["inspectionReportId"] in rids:
            manager.request("DELETE", f"/api/repair-orders/{o['id']}")
            out["repair_orders"] += 1
    for r in reports:
        manager.request("DELETE", f"/api/inspection-reports/{r['id']}")
        out["reports"] += 1
    for v in vehicles:
        manager.request("DELETE", f"/api/vehicles/{v['id']}")
        out["vehicles"] += 1
    for d in manager.request("GET", "/api/drivers") or []:
        if d["employeeId"].startswith(DRIVER_PREFIX):
            manager.request("DELETE", f"/api/drivers/{d['id']}")
            out["drivers"] += 1

    emails = {p["email"].lower() for p in cfg["people"].values()}
    for a in admin.request("GET", "/api/accounts") or []:
        if a["email"].lower() in emails and a.get("active"):
            admin.request("PUT", f"/api/accounts/{a['id']}", dict(a, active=False, driverId=None))
            out["accounts_deactivated"] += 1
    return out


def main(argv):
    data = json.loads(DATA_FILE.read_text())
    cfg = make_cfg(
        os.environ.get("SEED_ADMIN_EMAIL") or input("FleetCheck ADMIN email: "),
        os.environ.get("SEED_ADMIN_PASSWORD") or getpass.getpass("Admin password: "),
        os.environ.get("SEED_PERSONA_PASSWORD") or getpass.getpass("Password for the sample accounts (12+ chars): "),
    )
    try:
        if "--remove" in argv:
            print("Removed:", remove(cfg, data))
        else:
            print("Added:", seed(cfg, data))
    except ApiError as e:
        print(f"Failed: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
