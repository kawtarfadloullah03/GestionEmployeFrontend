import os
from datetime import datetime, date
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from database import connect_to_mongo, close_mongo_connection, get_db
from seed_data import INITIAL_DATA

app = FastAPI()
#python -m uvicorn main:app --reload --port 8000
#FRONT : npm run dev
# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory fallback store if MongoDB atlas is unreachable during local testing/dev
memory_store = dict(INITIAL_DATA)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    db = get_db()
    if db is not None:
        try:
            # Seed initial collections if empty
            collections = await db.list_collection_names()
            if "users" not in collections or await db.users.count_documents({}) == 0:
                for key, val in INITIAL_DATA.items():
                    if isinstance(val, list) and len(val) > 0:
                        await db[key].insert_many(val)
                    elif isinstance(val, dict):
                        await db[key].insert_one({"_id": "config", **val})
                print("Database initialized with sample seed data!")
        except Exception as e:
            print(f"Seed error or read-only connection: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# --- Helper Utilities ---
async def fetch_collection(coll_name: str) -> List[dict]:
    db = get_db()
    if db is not None:
        try:
            cursor = db[coll_name].find({}, {"_id": 0})
            return await cursor.to_list(length=1000)
        except Exception as e:
            print(f"Mongo fetch error for {coll_name}: {e}")
    return memory_store.get(coll_name, [])

async def update_item_in_collection(coll_name: str, query: dict, update: dict):
    db = get_db()
    if db is not None:
        try:
            await db[coll_name].update_one(query, {"$set": update})
        except Exception as e:
            print(f"Mongo update error: {e}")
    # Update memory store as well for sync guarantee
    if coll_name in memory_store and isinstance(memory_store[coll_name], list):
        for idx, item in enumerate(memory_store[coll_name]):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                memory_store[coll_name][idx].update(update)

async def insert_item_in_collection(coll_name: str, item: dict):
    db = get_db()
    if db is not None:
        try:
            await db[coll_name].insert_one(item.copy())
        except Exception as e:
            print(f"Mongo insert error: {e}")
    if coll_name not in memory_store:
        memory_store[coll_name] = []
    memory_store[coll_name].append(item)

# --- Pydantic Request Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class CheckInRequest(BaseModel):
    employee_id: str

class LeaveCreateRequest(BaseModel):
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    days: int
    reason: str

class AttendanceCorrectionRequest(BaseModel):
    employee_id: str
    date: str
    check_in: str
    check_out: Optional[str] = None
    reason: str
    by_user: str

class HolidayCreateRequest(BaseModel):
    date: str
    name: str

class EmployeeCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    department_id: str
    position: str
    manager_name: str
    contract_type: str
    allocated_leave: int = 25

# --- API ROUTES ---

@app.get("/api/health")
async def health_check():
    db = get_db()
    return {
        "status": "online",
        "mongodb_connected": db is not None,
        "app": "WorkFlow HR Backend",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/seed/reset")
async def reset_seed():
    """Reset database to default initial state"""
    db = get_db()
    if db is not None:
        try:
            for coll in INITIAL_DATA.keys():
                await db[coll].delete_many({})
                val = INITIAL_DATA[coll]
                if isinstance(val, list) and len(val) > 0:
                    await db[coll].insert_many(val)
                elif isinstance(val, dict):
                    await db[coll].insert_one({"_id": "config", **val})
        except Exception as e:
            print(f"Reset database failed: {e}")
    global memory_store
    memory_store = dict(INITIAL_DATA)
    return {"message": "Database reset to clean seed state successfully"}

# 1. Authentication & Users
@app.post("/api/auth/login")
async def login(req: LoginRequest):
    users = await fetch_collection("users")
    user = next((u for u in users if u["email"].lower() == req.email.lower()), None)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    # Attach employee details
    employees = await fetch_collection("employees")
    employee = next((e for e in employees if e["id"] == user.get("employee_id")), None)
    
    return {
        "token": f"mock_token_{user['id']}",
        "user": user,
        "employee": employee
    }

@app.get("/api/auth/users")
async def get_users():
    return await fetch_collection("users")

# 2. Employees & Departments
@app.get("/api/employees")
async def get_employees(department: Optional[str] = None):
    employees = await fetch_collection("employees")
    if department:
        return [e for e in employees if e.get("department_id") == department or e.get("department_name") == department]
    return employees

@app.get("/api/employees/{emp_id}")
async def get_employee_by_id(emp_id: str):
    employees = await fetch_collection("employees")
    emp = next((e for e in employees if e["id"] == emp_id), None)
    if not emp:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    return emp

@app.post("/api/employees")
async def create_employee(req: EmployeeCreateRequest):
    employees = await fetch_collection("employees")
    new_num = len(employees) + 101
    emp_id = f"EMP-00{new_num}"
    
    # find department name
    departments = await fetch_collection("departments")
    dept = next((d for d in departments if d["id"] == req.department_id or d["name"] == req.department_id), None)
    dept_name = dept["name"] if dept else "Général"
    
    new_emp = {
        "id": emp_id,
        "first_name": req.first_name,
        "last_name": req.last_name,
        "email": req.email,
        "phone": req.phone,
        "address": "Paris, France",
        "birth_date": "1996-01-01",
        "department_id": req.department_id,
        "department_name": dept_name,
        "position": req.position,
        "manager_name": req.manager_name,
        "hire_date": date.today().isoformat(),
        "contract_type": req.contract_type,
        "status": "ACTIVE",
        "leave_balance": req.allocated_leave,
        "allocated_leave": req.allocated_leave,
        "used_leave": 0,
        "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={req.first_name}"
    }
    await insert_item_in_collection("employees", new_emp)
    
    # Audit log entry
    audit_entry = {
        "id": f"audit_{datetime.now().timestamp()}",
        "action": "EMPLOYEE_CREATED",
        "by_user": "Marie Laurent (HR)",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "entity": f"{req.first_name} {req.last_name}",
        "old_value": "N/A",
        "new_value": f"Nouveau salarié créé ({emp_id})",
        "reason": "Embauche nouveau salarié"
    }
    await insert_item_in_collection("audit_logs", audit_entry)
    return new_emp

@app.get("/api/departments")
async def get_departments():
    departments = await fetch_collection("departments")
    employees = await fetch_collection("employees")
    
    # Attach members to departments for Org Chart
    for d in departments:
        d["members"] = [e for e in employees if e.get("department_id") == d["id"] or e.get("department_name") == d["name"]]
    return departments

# 3. Attendance & Pointage
@app.get("/api/attendance")
async def get_attendance(date_str: Optional[str] = None):
    records = await fetch_collection("attendance_records")
    target_date = date_str or date.today().isoformat()
    return [r for r in records if r.get("date") == target_date or not date_str]

@app.post("/api/attendance/clock")
async def clock_action(req: CheckInRequest):
    records = await fetch_collection("attendance_records")
    employees = await fetch_collection("employees")
    emp = next((e for e in employees if e["id"] == req.employee_id), None)
    emp_name = f"{emp['first_name']} {emp['last_name']}" if emp else "Employé"
    
    today_str = date.today().isoformat()
    now_time = datetime.now().strftime("%H:%M")
    
    record = next((r for r in records if r["employee_id"] == req.employee_id and r["date"] == today_str), None)
    
    if not record:
        # First check-in of the day
        new_record = {
            "employee_id": req.employee_id,
            "employee_name": emp_name,
            "date": today_str,
            "status": "PRESENT",
            "sessions": [{"check_in": now_time, "check_out": None}],
            "total_worked_minutes": 0
        }
        await insert_item_in_collection("attendance_records", new_record)
        return {"message": f"Journée commencée à {now_time}", "record": new_record, "status": "IN_SESSION"}
    else:
        # Check current active session
        sessions = record.get("sessions", [])
        active_session = next((s for s in sessions if s.get("check_out") is None), None)
        
        if active_session:
            # Check out current session
            active_session["check_out"] = now_time
            # Calculate duration in mins
            try:
                t1 = datetime.strptime(active_session["check_in"], "%H:%M")
                t2 = datetime.strptime(now_time, "%H:%M")
                diff = int((t2 - t1).total_seconds() / 60)
                record["total_worked_minutes"] = record.get("total_worked_minutes", 0) + max(0, diff)
            except Exception:
                pass
            
            await update_item_in_collection("attendance_records", {"employee_id": req.employee_id, "date": today_str}, record)
            return {"message": f"Badgeage enregistré (départ/pause) à {now_time}", "record": record, "status": "PAUSED"}
        else:
            # Start new session (resuming from break)
            sessions.append({"check_in": now_time, "check_out": None})
            record["sessions"] = sessions
            await update_item_in_collection("attendance_records", {"employee_id": req.employee_id, "date": today_str}, record)
            return {"message": f"Reprise de service à {now_time}", "record": record, "status": "IN_SESSION"}

@app.post("/api/attendance/correct")
async def correct_attendance(req: AttendanceCorrectionRequest):
    records = await fetch_collection("attendance_records")
    employees = await fetch_collection("employees")
    emp = next((e for e in employees if e["id"] == req.employee_id), None)
    emp_name = f"{emp['first_name']} {emp['last_name']}" if emp else req.employee_id
    
    record = next((r for r in records if r["employee_id"] == req.employee_id and r["date"] == req.date), None)
    
    old_str = f"Arrivée: {record['sessions'][0]['check_in']}" if record and record.get('sessions') else "Absence"
    new_str = f"Arrivée: {req.check_in}" + (f", Départ: {req.check_out}" if req.check_out else "")
    
    new_sessions = [{"check_in": req.check_in, "check_out": req.check_out}]
    
    if record:
        record["sessions"] = new_sessions
        record["status"] = "PRESENT"
        await update_item_in_collection("attendance_records", {"employee_id": req.employee_id, "date": req.date}, record)
    else:
        new_record = {
            "employee_id": req.employee_id,
            "employee_name": emp_name,
            "date": req.date,
            "status": "PRESENT",
            "sessions": new_sessions,
            "total_worked_minutes": 480
        }
        await insert_item_in_collection("attendance_records", new_record)
        
    # Mandatory Audit Log
    audit_entry = {
        "id": f"audit_{datetime.now().timestamp()}",
        "action": "ATTENDANCE_CORRECTION",
        "by_user": req.by_user,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "entity": emp_name,
        "old_value": old_str,
        "new_value": new_str,
        "reason": req.reason
    }
    await insert_item_in_collection("audit_logs", audit_entry)
    
    return {"message": "Pointage corrigé avec succès et enregistré dans l'Audit Log", "audit": audit_entry}

# 4. Leave Management (Congés)
@app.get("/api/leaves")
async def get_leaves(employee_id: Optional[str] = None, status: Optional[str] = None):
    requests = await fetch_collection("leave_requests")
    if employee_id:
        requests = [r for r in requests if r.get("employee_id") == employee_id]
    if status:
        requests = [r for r in requests if r.get("status") == status]
    return requests

@app.get("/api/leaves/types")
async def get_leave_types():
    return [
        {"id": "annual", "name": "Congé annuel", "color": "#3B82F6", "requires_proof": False},
        {"id": "sick", "name": "Congé maladie", "color": "#EF4444", "requires_proof": True},
        {"id": "unpaid", "name": "Congé sans solde", "color": "#6B7280", "requires_proof": False},
        {"id": "rtt", "name": "RTT", "color": "#10B981", "requires_proof": False},
        {"id": "remote", "name": "Télétravail", "color": "#8B5CF6", "requires_proof": False},
        {"id": "maternity", "name": "Maternité / Paternité", "color": "#EC4899", "requires_proof": True}
    ]

@app.post("/api/leaves/request")
async def submit_leave(req: LeaveCreateRequest):
    employees = await fetch_collection("employees")
    emp = next((e for e in employees if e["id"] == req.employee_id), None)
    if not emp:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    
    # Check leave balance
    if req.leave_type in ["Congé annuel", "RTT"] and emp.get("leave_balance", 0) < req.days:
        raise HTTPException(status_code=400, detail=f"Solde insuffisant ({emp.get('leave_balance', 0)} jours disponibles)")
    
    new_req = {
        "id": f"req_{int(datetime.now().timestamp())}",
        "employee_id": req.employee_id,
        "employee_name": f"{emp['first_name']} {emp['last_name']}",
        "leave_type": req.leave_type,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "days": req.days,
        "reason": req.reason,
        "status": "PENDING",
        "created_at": datetime.now().isoformat()
    }
    await insert_item_in_collection("leave_requests", new_req)
    
    # Create notification for Manager & HR
    notif = {
        "id": f"notif_{datetime.now().timestamp()}",
        "user_id": "usr_sarah",
        "title": "Nouvelle demande de congé",
        "message": f"{emp['first_name']} {emp['last_name']} a demandé {req.days} jour(s) de {req.leave_type}.",
        "read": False,
        "created_at": datetime.now().isoformat(),
        "type": "ACTION_REQUIRED"
    }
    await insert_item_in_collection("notifications", notif)
    return new_req

@app.post("/api/leaves/{leave_id}/approve")
async def approve_leave(leave_id: str, approver_name: str = "Sarah Martin"):
    requests = await fetch_collection("leave_requests")
    req = next((r for r in requests if r["id"] == leave_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    req["status"] = "APPROVED"
    req["approved_by"] = approver_name
    req["approved_at"] = datetime.now().isoformat()
    await update_item_in_collection("leave_requests", {"id": leave_id}, req)
    
    # Deduct from employee leave balance
    employees = await fetch_collection("employees")
    emp = next((e for e in employees if e["id"] == req["employee_id"]), None)
    if emp and req["leave_type"] in ["Congé annuel", "RTT"]:
        emp["leave_balance"] = max(0, emp.get("leave_balance", 25) - req["days"])
        emp["used_leave"] = emp.get("used_leave", 0) + req["days"]
        await update_item_in_collection("employees", {"id": emp["id"]}, emp)
    
    # User Notification
    notif = {
        "id": f"notif_{datetime.now().timestamp()}",
        "user_id": "usr_ahmed",
        "title": "Demande de congé approuvée",
        "message": f"Votre demande du {req['start_date']} au {req['end_date']} a été approuvée par {approver_name}.",
        "read": False,
        "created_at": datetime.now().isoformat(),
        "type": "SUCCESS"
    }
    await insert_item_in_collection("notifications", notif)
    return req

@app.post("/api/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, approver_name: str = "Sarah Martin"):
    requests = await fetch_collection("leave_requests")
    req = next((r for r in requests if r["id"] == leave_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    req["status"] = "REJECTED"
    req["approved_by"] = approver_name
    req["approved_at"] = datetime.now().isoformat()
    await update_item_in_collection("leave_requests", {"id": leave_id}, req)
    
    notif = {
        "id": f"notif_{datetime.now().timestamp()}",
        "user_id": "usr_ahmed",
        "title": "Demande de congé refusée",
        "message": f"Votre demande du {req['start_date']} au {req['end_date']} n'a pas pu être validée.",
        "read": False,
        "created_at": datetime.now().isoformat(),
        "type": "WARNING"
    }
    await insert_item_in_collection("notifications", notif)
    return req

# 5. Calendar & Holidays
@app.get("/api/holidays")
async def get_holidays():
    return await fetch_collection("holidays")

@app.post("/api/holidays")
async def add_holiday(req: HolidayCreateRequest):
    new_h = {"date": req.date, "name": req.name}
    await insert_item_in_collection("holidays", new_h)
    return new_h

@app.get("/api/calendar/events")
async def get_calendar_events():
    holidays = await fetch_collection("holidays")
    leaves = await fetch_collection("leave_requests")
    attendance = await fetch_collection("attendance_records")
    
    events = []
    for h in holidays:
        events.append({"date": h["date"], "title": h["name"], "type": "HOLIDAY", "badge": "⚪ Férié"})
    for l in leaves:
        if l.get("status") == "APPROVED":
            events.append({
                "date": l["start_date"],
                "title": f"{l['employee_name']} — {l['leave_type']}",
                "type": "LEAVE",
                "badge": "🟡 Congé"
            })
    for a in attendance:
        if a.get("status") == "PRESENT":
            events.append({
                "date": a["date"],
                "title": f"{a['employee_name']} — Présent",
                "type": "PRESENT",
                "badge": "🟢 Présent"
            })
        elif a.get("status") == "REMOTE":
            events.append({
                "date": a["date"],
                "title": f"{a['employee_name']} — Télétravail",
                "type": "REMOTE",
                "badge": "🔵 Télétravail"
            })
    return events

# 6. Reports & Schedules
@app.get("/api/schedules")
async def get_schedules():
    store = await fetch_collection("work_schedules")
    if store and len(store) > 0:
        return store[0]
    return INITIAL_DATA["work_schedules"]

@app.get("/api/reports/summary")
async def get_reports_summary():
    employees = await fetch_collection("employees")
    attendance = await fetch_collection("attendance_records")
    leaves = await fetch_collection("leave_requests")
    
    # Calculate attendance vs expected stats
    report_data = []
    for emp in employees:
        worked_mins = sum(a.get("total_worked_minutes", 0) for a in attendance if a.get("employee_id") == emp["id"])
        worked_hours = round(worked_mins / 60, 1)
        expected_hours = 160.0 # standard month
        diff = round(worked_hours - expected_hours, 1)
        diff_str = f"+{diff}h" if diff >= 0 else f"{diff}h"
        
        report_data.append({
            "employee_id": emp["id"],
            "name": f"{emp['first_name']} {emp['last_name']}",
            "department": emp.get("department_name", "N/A"),
            "worked_hours": f"{worked_hours}h",
            "expected_hours": f"{expected_hours}h",
            "difference": diff_str,
            "allocated_leave": emp.get("allocated_leave", 25),
            "used_leave": emp.get("used_leave", 0),
            "remaining_leave": emp.get("leave_balance", 25)
        })
    
    chart_absence_by_month = [
        {"month": "Jan", "absences": 4},
        {"month": "Fév", "absences": 2},
        {"month": "Mar", "absences": 5},
        {"month": "Avr", "absences": 3},
        {"month": "Mai", "absences": 6},
        {"month": "Juin", "absences": 2},
        {"month": "Juil", "absences": 8},
        {"month": "Août", "absences": 12},
        {"month": "Sep", "absences": 3}
    ]
    
    chart_leave_types = [
        {"name": "Congé annuel", "value": 45, "color": "#3B82F6"},
        {"name": "Congé maladie", "value": 15, "color": "#EF4444"},
        {"name": "RTT", "value": 25, "color": "#10B981"},
        {"name": "Télétravail", "value": 15, "color": "#8B5CF6"}
    ]
    
    return {
        "summary": report_data,
        "charts": {
            "absences": chart_absence_by_month,
            "leave_distribution": chart_leave_types
        }
    }

# 7. Notifications & Audit Logs
@app.get("/api/notifications")
async def get_notifications(user_id: Optional[str] = None):
    notifs = await fetch_collection("notifications")
    if user_id:
        return [n for n in notifs if n.get("user_id") == user_id]
    return notifs

@app.post("/api/notifications/read-all")
async def mark_notifications_read(user_id: str):
    notifs = await fetch_collection("notifications")
    for n in notifs:
        if n.get("user_id") == user_id:
            n["read"] = True
            await update_item_in_collection("notifications", {"id": n["id"]}, n)
    return {"message": "Notifications marquées comme lues"}

@app.get("/api/audit-logs")
async def get_audit_logs():
    return await fetch_collection("audit_logs")
