from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class CheckInRequest(BaseModel):
    employee_id: str = Field(min_length=3, max_length=64)


class LeaveCreateRequest(BaseModel):
    employee_id: str = Field(min_length=3, max_length=64)
    leave_type: Literal["Congé annuel", "Congé maladie", "Congé sans solde", "RTT", "Télétravail", "Maternité/Paternité"]
    start_date: date
    end_date: date
    days: int = Field(gt=0, le=366)
    reason: str = Field(min_length=3, max_length=2000)

    @field_validator("end_date")
    @classmethod
    def end_must_not_precede_start(cls, value: date, info):
        start = info.data.get("start_date")
        if start and value < start:
            raise ValueError("La date de fin doit être égale ou postérieure à la date de début.")
        return value


class AttendanceCorrectionRequest(BaseModel):
    employee_id: str = Field(min_length=3, max_length=64)
    date: date
    check_in: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    check_out: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    reason: str = Field(min_length=3, max_length=1000)


class HolidayCreateRequest(BaseModel):
    date: date
    name: str = Field(min_length=2, max_length=120)


class EmployeeCreateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=3, max_length=40)
    department_id: str = Field(min_length=2, max_length=64)
    position: str = Field(min_length=2, max_length=120)
    manager_name: str = Field(min_length=2, max_length=120)
    contract_type: str = Field(min_length=2, max_length=40)
    allocated_leave: int = Field(default=25, ge=0, le=366)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1500)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    history: list[ChatMessage] = Field(default_factory=list, max_length=10)
