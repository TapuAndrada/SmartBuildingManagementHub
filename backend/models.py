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
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)  # NEW

    room = relationship("Room", back_populates="users")  # NEW


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    floor = Column(Integer, nullable=False)
    target_temperature = Column(Float, nullable=True)

    devices = relationship("Device", back_populates="room")
    sensor_data = relationship("SensorData", back_populates="room")
    users = relationship("User", back_populates="room")  # NEW


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)
    is_on = Column(Boolean, default=False)
    settings = Column(JSON, nullable=True)

    room = relationship("Room", back_populates="devices")
    energy_data = relationship("EnergyConsumption", back_populates="device")


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="sensor_data")


class EnergyConsumption(Base):
    __tablename__ = "energy_consumption"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    consumption_kwh = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    device = relationship("Device", back_populates="energy_data")