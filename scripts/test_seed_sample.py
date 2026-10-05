"""Tests for seed_sample.py against an in-memory stub of FleetCheck and identity-service.

Stdlib only:  python3 -m unittest scripts/test_seed_sample.py

The stub enforces the documented role rules, the report status machine and
unique unit/employee/email constraints, so the seeder is checked for acting as
the right person at each step. It does not exercise the real Spring backend.
"""
import json
import re
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import seed_sample as ss  # noqa: E402

ADMIN = ("admin@example.com", "adminpw")
PW = "persona-password-123"


def fresh():
    return {"identity": {ADMIN[0]: ADMIN[1]}, "tokens": {}, "accounts": [
        {"id": 1, "username": "admin", "email": ADMIN[0], "role": "ADMIN", "driverId": None, "active": True}],
        "vehicles": [], "drivers": [], "reports": [], "orders": [], "markings": [], "seq": 10}


class Stub(BaseHTTPRequestHandler):
    st = None

    def log_message(self, *a):
        pass

    def send(self, code, obj=None):
        b = json.dumps(obj).encode() if obj is not None else b""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def nid(self):
        Stub.st["seq"] += 1
        return Stub.st["seq"]

    def handle_any(self, method):
        st = Stub.st
        path = self.path.split("?")[0]
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n)) if n else None

        if path == "/auth/register":
            if body["email"] in st["identity"]:
                return self.send(409, {"message": "taken"})
            st["identity"][body["email"]] = body["password"]
            return self.send(201, {})
        if path == "/auth/login":
            if st["identity"].get(body["email"]) != body["password"]:
                return self.send(401, {"message": "bad credentials"})
            tok = f"t-{body['email']}"
            st["tokens"][tok] = body["email"]
            return self.send(200, {"accessToken": tok})

        email = st["tokens"].get((self.headers.get("Authorization") or "").replace("Bearer ", ""))
        acct = next((a for a in st["accounts"] if a["email"] == email and a["active"]), None)
        if not acct:
            return self.send(403, {"message": "no active account"})
        role = acct["role"]

        def need(*roles):
            if role not in roles:
                self.send(403, {"message": f"{role} may not {method} {path}"})
                return False
            return True

        if path == "/api/accounts":
            if not need("ADMIN"):
                return
            if method == "GET":
                return self.send(200, st["accounts"])
            if any(a["email"] == body["email"] or a["username"] == body["username"] for a in st["accounts"]):
                return self.send(409, {})
            a = dict(body, id=self.nid())
            st["accounts"].append(a)
            return self.send(201, a)
        m = re.fullmatch(r"/api/accounts/(\d+)", path)
        if m and method == "PUT":
            if not need("ADMIN"):
                return
            a = next(x for x in st["accounts"] if x["id"] == int(m.group(1)))
            a.update(body)
            return self.send(200, a)

        if path == "/api/vehicles":
            if method == "GET":
                return self.send(200, st["vehicles"])
            if not need("FLEET_MANAGER"):
                return
            if any(v["unitNumber"] == body["unitNumber"] for v in st["vehicles"]):
                return self.send(409, {})
            v = dict(body, id=self.nid())
            st["vehicles"].append(v)
            return self.send(201, v)
        m = re.fullmatch(r"/api/vehicles/(\d+)", path)
        if m and method == "DELETE":
            if not need("FLEET_MANAGER"):
                return
            st["vehicles"] = [v for v in st["vehicles"] if v["id"] != int(m.group(1))]
            return self.send(204)
        if path == "/api/drivers":
            if method == "GET":
                return self.send(200, st["drivers"])
            if not need("FLEET_MANAGER"):
                return
            if any(d["employeeId"] == body["employeeId"] for d in st["drivers"]):
                return self.send(409, {})
            d = dict(body, id=self.nid())
            st["drivers"].append(d)
            return self.send(201, d)
        m = re.fullmatch(r"/api/drivers/(\d+)", path)
        if m and method == "DELETE":
            if not need("FLEET_MANAGER"):
                return
            st["drivers"] = [d for d in st["drivers"] if d["id"] != int(m.group(1))]
            return self.send(204)

        if path == "/api/inspection-reports" and method == "POST":
            if not need("DRIVER"):
                return
            if body["requiresRepair"] and not (body.get("repairType") and body.get("repairDescription")):
                return self.send(400, {"message": "repair details required"})
            r = dict(body, id=self.nid(),
                     status="REPAIR_REQUESTED" if body["requiresRepair"] else "SATISFACTORY")
            st["reports"].append(r)
            return self.send(201, r)
        m = re.fullmatch(r"/api/inspection-reports/by-vehicle/(\d+)", path)
        if m:
            if not need("MECHANIC", "FLEET_MANAGER", "ADMIN"):
                return
            return self.send(200, [r for r in st["reports"] if r["vehicleId"] == int(m.group(1))])
        m = re.fullmatch(r"/api/inspection-reports/(\d+)/(complete-repair|review)", path)
        if m:
            r = next(x for x in st["reports"] if x["id"] == int(m.group(1)))
            if m.group(2) == "complete-repair":
                if not need("MECHANIC"):
                    return
                order = next((o for o in st["orders"] if o["inspectionReportId"] == r["id"]), None)
                if r["status"] != "REPAIR_REQUESTED":
                    return self.send(409, {})
                if not order or not order["workPerformedDescription"].strip():
                    return self.send(400, {})
                r["status"] = "REPAIR_COMPLETED"
            else:
                if not need("DRIVER"):
                    return
                if r["status"] != "REPAIR_COMPLETED":
                    return self.send(409, {})
                r["status"] = "REVIEWED_CLOSED"
            return self.send(200, r)
        m = re.fullmatch(r"/api/inspection-reports/(\d+)", path)
        if m and method == "DELETE":
            if not need("FLEET_MANAGER", "ADMIN"):
                return
            st["reports"] = [r for r in st["reports"] if r["id"] != int(m.group(1))]
            return self.send(204)

        if path == "/api/repair-orders":
            if method == "GET":
                return self.send(200, st["orders"])
            if not need("MECHANIC"):
                return
            if any(o["inspectionReportId"] == body["inspectionReportId"] for o in st["orders"]):
                return self.send(409, {})
            o = dict(body, id=self.nid(), completedByName=acct["username"])
            st["orders"].append(o)
            return self.send(201, o)
        m = re.fullmatch(r"/api/repair-orders/(\d+)", path)
        if m and method == "DELETE":
            if not need("FLEET_MANAGER"):
                return
            st["orders"] = [o for o in st["orders"] if o["id"] != int(m.group(1))]
            return self.send(204)
        if path == "/api/damage-markings":
            if method == "GET":
                return self.send(200, st["markings"])
            if not need("DRIVER"):
                return
            mk = dict(body, id=self.nid())
            st["markings"].append(mk)
            return self.send(201, mk)
        m = re.fullmatch(r"/api/damage-markings/(\d+)", path)
        if m and method == "DELETE":
            if not need("FLEET_MANAGER"):
                return
            st["markings"] = [x for x in st["markings"] if x["id"] != int(m.group(1))]
            return self.send(204)
        self.send(404, {"message": f"{method} {path}"})

    def do_GET(self): self.handle_any("GET")
    def do_POST(self): self.handle_any("POST")
    def do_PUT(self): self.handle_any("PUT")
    def do_DELETE(self): self.handle_any("DELETE")


class SeedSampleTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), Stub)
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.data = json.loads(ss.DATA_FILE.read_text())

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        Stub.st = fresh()
        self.cfg = ss.make_cfg(ADMIN[0], ADMIN[1], PW)
        self.cfg["backend"] = self.cfg["identity"] = self.url

    def statuses(self):
        return {r["status"] for r in Stub.st["reports"]}

    def test_seed_builds_the_whole_fleet(self):
        out = ss.seed(self.cfg, self.data)
        self.assertEqual(out["accounts"], 3)
        self.assertEqual((out["vehicles"], out["drivers"], out["reports"]), (5, 4, 10))
        self.assertEqual(out["repair_orders"], 4)
        self.assertEqual(out["damage_markings"], 6)

    def test_every_workflow_stage_is_represented(self):
        ss.seed(self.cfg, self.data)
        self.assertEqual(self.statuses(), {"SATISFACTORY", "REPAIR_REQUESTED", "REPAIR_COMPLETED", "REVIEWED_CLOSED"})
        by_id = {r["id"]: r for r in Stub.st["reports"]}
        drafted = [o for o in Stub.st["orders"] if by_id[o["inspectionReportId"]]["status"] == "REPAIR_REQUESTED"]
        self.assertEqual(len(drafted), 1, "one report should sit at 'order drafted, ready to complete'")
        self.assertEqual(sum(r["status"] == "REVIEWED_CLOSED" for r in Stub.st["reports"]), 2)

    def test_there_is_an_open_safety_repair_blocking_dispatch(self):
        ss.seed(self.cfg, self.data)
        open_safety = [r for r in Stub.st["reports"]
                       if r["status"] != "REVIEWED_CLOSED" and r.get("repairType") in ("SAFETY", "BOTH")]
        self.assertTrue(open_safety)

    def test_is_idempotent(self):
        ss.seed(self.cfg, self.data)
        snapshot = json.dumps({k: v for k, v in Stub.st.items() if k != "tokens"}, sort_keys=True)
        again = ss.seed(self.cfg, self.data)
        self.assertEqual(sum(again.values()), 0, again)
        self.assertEqual(snapshot, json.dumps({k: v for k, v in Stub.st.items() if k != "tokens"}, sort_keys=True))

    def test_driver_account_is_linked_to_a_roster_driver(self):
        ss.seed(self.cfg, self.data)
        acct = next(a for a in Stub.st["accounts"] if a["role"] == "DRIVER")
        self.assertIn(acct["driverId"], {d["id"] for d in Stub.st["drivers"]})

    def test_repair_orders_are_written_by_the_mechanic(self):
        ss.seed(self.cfg, self.data)
        self.assertTrue(all(o["completedByName"] == "sample-mechanic" for o in Stub.st["orders"]))

    def test_wrong_persona_password_gives_a_clear_error(self):
        ss.seed(self.cfg, self.data)
        Stub.st["tokens"].clear()
        bad = dict(self.cfg, persona_password="a-different-password")
        with self.assertRaises(ss.ApiError) as ctx:
            ss.seed(bad, self.data)
        self.assertIn("SEED_PERSONA_PASSWORD", str(ctx.exception))

    def test_non_admin_cannot_seed(self):
        Stub.st["accounts"][0]["role"] = "DRIVER"
        with self.assertRaises(ss.ApiError):
            ss.seed(self.cfg, self.data)

    def test_remove_deletes_sample_data_and_deactivates_accounts(self):
        Stub.st["vehicles"].append({"id": 5, "unitNumber": "REAL-1"})
        ss.seed(self.cfg, self.data)
        out = ss.remove(self.cfg, self.data)
        self.assertEqual((out["reports"], out["vehicles"], out["drivers"]), (10, 5, 4))
        self.assertEqual(out["accounts_deactivated"], 3)
        self.assertEqual([v["unitNumber"] for v in Stub.st["vehicles"]], ["REAL-1"])
        for key in ("reports", "orders", "markings", "drivers"):
            self.assertEqual(Stub.st[key], [], key)
        self.assertTrue(Stub.st["accounts"][0]["active"])

    def test_reseed_after_remove_reactivates_accounts(self):
        ss.seed(self.cfg, self.data)
        ss.remove(self.cfg, self.data)
        ss.seed(self.cfg, self.data)
        self.assertEqual(sum(a["active"] for a in Stub.st["accounts"]), 4)
        self.assertEqual(len(Stub.st["reports"]), 10)

    def test_sample_data_is_clearly_fictional(self):
        text = json.dumps(self.data)
        for real in ("Cintas", "Kokomo", "Frankfort"):
            self.assertNotIn(real, text)
        for v in self.data["vehicles"]:
            self.assertTrue(v["unitNumber"].startswith("SMP-") and v["licensePlate"].startswith("SAMPLE-"))


if __name__ == "__main__":
    unittest.main()
