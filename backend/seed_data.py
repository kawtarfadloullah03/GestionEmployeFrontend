from datetime import datetime, date, timedelta

INITIAL_DATA = {
    "users": [
        {
            "id": "usr_ahmed",
            "email": "ahmed@company.com",
            "password": "password123",
            "role": "EMPLOYEE",
            "employee_id": "EMP-00124",
            "first_name": "Ahmed",
            "last_name": "Ben Ali",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "usr_sarah",
            "email": "sarah@company.com",
            "password": "password123",
            "role": "MANAGER",
            "employee_id": "EMP-00101",
            "first_name": "Sarah",
            "last_name": "Martin",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "usr_marie",
            "email": "marie@company.com",
            "password": "password123",
            "role": "HR",
            "employee_id": "EMP-00100",
            "first_name": "Marie",
            "last_name": "Laurent",
            "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
        }
    ],
    "departments": [
        {"id": "dept_it", "name": "IT & Engineering", "code": "IT", "manager_id": "EMP-00101", "color": "#3B82F6"},
        {"id": "dept_rh", "name": "Ressources Humaines", "code": "RH", "manager_id": "EMP-00100", "color": "#EC4899"},
        {"id": "dept_finance", "name": "Finance & Comptabilité", "code": "FIN", "manager_id": "EMP-00130", "color": "#10B981"}
    ],
    "employees": [
        {
            "id": "EMP-00124",
            "first_name": "Ahmed",
            "last_name": "Ben Ali",
            "email": "ahmed@company.com",
            "phone": "+33 6 12 34 56 78",
            "address": "14 Rue de la Paix, Paris",
            "birth_date": "1995-06-15",
            "department_id": "dept_it",
            "department_name": "IT & Engineering",
            "position": "Software Engineer",
            "manager_name": "Sarah Martin",
            "hire_date": "2024-03-12",
            "contract_type": "CDI",
            "status": "ACTIVE",
            "leave_balance": 18,
            "allocated_leave": 25,
            "used_leave": 7,
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "EMP-00101",
            "first_name": "Sarah",
            "last_name": "Martin",
            "email": "sarah@company.com",
            "phone": "+33 6 98 76 54 32",
            "address": "8 Avenue des Champs-Élysées, Paris",
            "birth_date": "1988-11-20",
            "department_id": "dept_it",
            "department_name": "IT & Engineering",
            "position": "Engineering Lead",
            "manager_name": "Direction Générale",
            "hire_date": "2021-01-15",
            "contract_type": "CDI",
            "status": "ACTIVE",
            "leave_balance": 17,
            "allocated_leave": 25,
            "used_leave": 8,
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "EMP-00100",
            "first_name": "Marie",
            "last_name": "Laurent",
            "email": "marie@company.com",
            "phone": "+33 6 45 67 89 01",
            "address": "22 Boulevard Haussmann, Paris",
            "birth_date": "1985-04-10",
            "department_id": "dept_rh",
            "department_name": "Ressources Humaines",
            "position": "Directrice RH",
            "manager_name": "Direction Générale",
            "hire_date": "2019-09-01",
            "contract_type": "CDI",
            "status": "ACTIVE",
            "leave_balance": 20,
            "allocated_leave": 25,
            "used_leave": 5,
            "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "EMP-00125",
            "first_name": "Thomas",
            "last_name": "Dupont",
            "email": "thomas@company.com",
            "phone": "+33 6 11 22 33 44",
            "address": "5 Rue Lafayette, Paris",
            "birth_date": "1997-02-28",
            "department_id": "dept_it",
            "department_name": "IT & Engineering",
            "position": "Frontend Developer",
            "manager_name": "Sarah Martin",
            "hire_date": "2023-05-10",
            "contract_type": "CDI",
            "status": "ACTIVE",
            "leave_balance": 10,
            "allocated_leave": 25,
            "used_leave": 15,
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "EMP-00126",
            "first_name": "Lina",
            "last_name": "Garcia",
            "email": "lina@company.com",
            "phone": "+33 6 55 44 33 22",
            "address": "12 Rue de Rivoli, Paris",
            "birth_date": "1994-08-14",
            "department_id": "dept_it",
            "department_name": "IT & Engineering",
            "position": "UX/UI Designer",
            "manager_name": "Sarah Martin",
            "hire_date": "2022-10-01",
            "contract_type": "CDI",
            "status": "ACTIVE",
            "leave_balance": 14,
            "allocated_leave": 25,
            "used_leave": 11,
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "EMP-00130",
            "first_name": "Pierre",
            "last_name": "Bernard",
            "email": "pierre@company.com",
            "phone": "+33 6 66 77 88 99",
            "address": "30 Rue de la République, Lyon",
            "birth_date": "1990-12-05",
            "department_id": "dept_finance",
            "department_name": "Finance & Comptabilité",
            "position": "Analyste Financier",
            "manager_name": "Direction Générale",
            "hire_date": "2021-06-15",
            "contract_type": "CDI",
            "status": "ACTIVE",
            "leave_balance": 19,
            "allocated_leave": 25,
            "used_leave": 6,
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
        }
    ],
    "holidays": [
        {"date": "2026-01-01", "name": "Nouvel An"},
        {"date": "2026-04-05", "name": "Lundi de Pâques"},
        {"date": "2026-05-01", "name": "Fête du Travail"},
        {"date": "2026-05-08", "name": "Victoire 1945"},
        {"date": "2026-07-14", "name": "Fête Nationale"},
        {"date": "2026-08-15", "name": "Assomption"},
        {"date": "2026-11-01", "name": "Toussaint"},
        {"date": "2026-11-11", "name": "Armistice"},
        {"date": "2026-12-25", "name": "Noël"}
    ],
    "work_schedules": {
        "standard": {
            "monday": {"start": "08:30", "end": "17:30", "pause_start": "12:30", "pause_end": "13:30", "expected_hours": 8.0},
            "tuesday": {"start": "08:30", "end": "17:30", "pause_start": "12:30", "pause_end": "13:30", "expected_hours": 8.0},
            "wednesday": {"start": "08:30", "end": "17:30", "pause_start": "12:30", "pause_end": "13:30", "expected_hours": 8.0},
            "thursday": {"start": "08:30", "end": "17:30", "pause_start": "12:30", "pause_end": "13:30", "expected_hours": 8.0},
            "friday": {"start": "08:30", "end": "16:30", "pause_start": "12:30", "pause_end": "13:30", "expected_hours": 7.0}
        }
    },
    "leave_requests": [
        {
            "id": "req_001",
            "employee_id": "EMP-00124",
            "employee_name": "Ahmed Ben Ali",
            "leave_type": "Congé annuel",
            "start_date": "2026-09-23",
            "end_date": "2026-09-25",
            "days": 3,
            "reason": "Congé personnel et vacances familiales",
            "status": "PENDING",
            "created_at": "2026-09-18T10:15:00"
        },
        {
            "id": "req_002",
            "employee_id": "EMP-00125",
            "employee_name": "Thomas Dupont",
            "leave_type": "Congé maladie",
            "start_date": "2026-09-16",
            "end_date": "2026-09-16",
            "days": 1,
            "reason": "Consultation médicale obligatoire",
            "status": "APPROVED",
            "approved_by": "Sarah Martin",
            "approved_at": "2026-09-16T08:30:00",
            "created_at": "2026-09-15T16:00:00"
        },
        {
            "id": "req_003",
            "employee_id": "EMP-00126",
            "employee_name": "Lina Garcia",
            "leave_type": "RTT",
            "start_date": "2026-09-28",
            "end_date": "2026-09-28",
            "days": 1,
            "reason": "Récupération temps de travail",
            "status": "APPROVED",
            "approved_by": "Sarah Martin",
            "approved_at": "2026-09-17T11:20:00",
            "created_at": "2026-09-17T09:00:00"
        }
    ],
    "attendance_records": [
        {
            "employee_id": "EMP-00124",
            "employee_name": "Ahmed Ben Ali",
            "date": "2026-09-19",
            "status": "PRESENT",
            "sessions": [
                {"check_in": "08:42", "check_out": "12:15"},
                {"check_in": "13:10", "check_out": None}
            ],
            "total_worked_minutes": 278
        },
        {
            "employee_id": "EMP-00101",
            "employee_name": "Sarah Martin",
            "date": "2026-09-19",
            "status": "PRESENT",
            "sessions": [
                {"check_in": "08:30", "check_out": "12:30"},
                {"check_in": "13:30", "check_out": None}
            ],
            "total_worked_minutes": 310
        },
        {
            "employee_id": "EMP-00125",
            "employee_name": "Thomas Dupont",
            "date": "2026-09-19",
            "status": "REMOTE",
            "sessions": [
                {"check_in": "08:55", "check_out": "12:10"},
                {"check_in": "13:15", "check_out": None}
            ],
            "total_worked_minutes": 260
        },
        {
            "employee_id": "EMP-00126",
            "employee_name": "Lina Garcia",
            "date": "2026-09-19",
            "status": "ON_LEAVE",
            "sessions": [],
            "total_worked_minutes": 0
        },
        {
            "employee_id": "EMP-00130",
            "employee_name": "Pierre Bernard",
            "date": "2026-09-19",
            "status": "REMOTE",
            "sessions": [
                {"check_in": "08:30", "check_out": "17:30"}
            ],
            "total_worked_minutes": 480
        }
    ],
    "notifications": [
        {
            "id": "notif_001",
            "user_id": "usr_ahmed",
            "title": "Bienvenue sur WorkFlow HR",
            "message": "Votre profil et vos compteurs de congés sont désormais configurés.",
            "read": True,
            "created_at": "2026-09-19T08:00:00",
            "type": "INFO"
        },
        {
            "id": "notif_002",
            "user_id": "usr_sarah",
            "title": "Nouvelle demande de congé",
            "message": "Ahmed Ben Ali a soumis une demande de congé annuel (3 jours).",
            "read": False,
            "created_at": "2026-09-18T10:15:00",
            "type": "ACTION_REQUIRED"
        }
    ],
    "audit_logs": [
        {
            "id": "audit_001",
            "action": "ATTENDANCE_CORRECTION",
            "by_user": "Sarah Martin",
            "date": "2026-09-18 14:32",
            "entity": "Ahmed Ben Ali",
            "old_value": "Check-in: 09:15",
            "new_value": "Check-in: 08:45",
            "reason": "Oubli de badgeage à l'arrivée"
        }
    ]
}
