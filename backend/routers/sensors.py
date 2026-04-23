from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

router = APIRouter(prefix="/sensors", tags=["Sensors"])

# 1. SIMULEAZĂ O CITIRE (Adaugă date noi)
@router.post("/record", response_model=schemas.SensorDataResponse)
def record_sensor_data(data: schemas.SensorDataCreate, db: Session = Depends(database.get_db)):
    # Verificăm dacă camera există
    room = db.query(models.Room).filter(models.Room.id == data.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    new_reading = models.SensorData(
        room_id=data.room_id,
        temperature=data.temperature,
        humidity=data.humidity
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return new_reading

# 2. VEZI ISTORICUL PENTRU O CAMERĂ
@router.get("/room/{room_id}", response_model=List[schemas.SensorDataResponse])
def get_room_history(room_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.SensorData).filter(models.SensorData.room_id == room_id).all()

# VEZI CEA MAI RECENTĂ CITIRE (Pentru Dashboard)
@router.get("/room/{room_id}/latest", response_model=schemas.SensorDataResponse)
def get_latest_sensor_data(room_id: int, db: Session = Depends(database.get_db)):
    latest = db.query(models.SensorData)\
               .filter(models.SensorData.room_id == room_id)\
               .order_by(models.SensorData.timestamp.desc())\
               .first()
    
    if not latest:
        raise HTTPException(status_code=404, detail="No data found for this room")
    return latest