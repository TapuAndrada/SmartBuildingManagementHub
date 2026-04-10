from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # 'admin' or 'user'
    is_active = Column(Boolean, default=True)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    floor = Column(Integer, nullable=False)
    target_temperature = Column(Float, nullable=True)

    # Relationships
    devices = relationship("Device", back_populates="room")
    sensor_data = relationship("SensorData", back_populates="room")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False) # e.g., 'light', 'hvac'
    is_on = Column(Boolean, default=False)
    settings = Column(JSON, nullable=True) # Great for storing {"brightness": 80} etc.

    # Relationships
    room = relationship("Room", back_populates="devices")
    energy_data = relationship("EnergyConsumption", back_populates="device")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    room = relationship("Room", back_populates="sensor_data")

class EnergyConsumption(Base):
    __tablename__ = "energy_consumption"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    consumption_kwh = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    device = relationship("Device", back_populates="energy_data")