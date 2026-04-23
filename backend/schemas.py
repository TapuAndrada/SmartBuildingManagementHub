from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

# --- AUTH ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- ENERGY & SENSORS ---
class EnergySchema(BaseModel):
    consumption_kwh: float
    timestamp: datetime
    class Config:
        from_attributes = True

class SensorDataSchema(BaseModel):
    temperature: float
    humidity: float
    timestamp: datetime
    class Config:
        from_attributes = True

# --- DEVICES ---
class DeviceBase(BaseModel):
    name: str
    device_type: str
    room_id: int

class DeviceCreate(DeviceBase):
    settings: Optional[Dict[str, Any]] = {}

class DeviceUpdate(BaseModel):
    is_on: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None

class DeviceResponse(DeviceBase):
    id: int
    is_on: bool
    settings: Optional[Dict[str, Any]]
    class Config:
        from_attributes = True

# --- ROOMS ---
class RoomBase(BaseModel):
    name: str
    # room_type: str # Adăugat aici pentru consistență
    floor: int
    target_temperature: Optional[float] = 22.0

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    devices: List[DeviceResponse] = [] 
    class Config:
        from_attributes = True

class RoomDashboardResponse(BaseModel):
    id: int
    name: str
    floor: int
    target_temperature: Optional[float]
    last_reading: Optional[SensorDataSchema] 
    devices: List[DeviceResponse] 
    class Config:
        from_attributes = True

class SensorDataCreate(BaseModel):
    room_id: int
    temperature: float
    humidity: float

class SensorDataResponse(SensorDataCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- ENERGY CONSUMPTION ADDITIONS ---

class EnergyCreate(BaseModel):
    device_id: int
    consumption_kwh: float

class EnergyResponse(EnergyCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True