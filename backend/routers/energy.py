from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

router = APIRouter(prefix="/energy", tags=["Energy"])

# 1. ÎNREGISTREAZĂ CONSUM (Trimis de device)
@router.post("/log", response_model=schemas.EnergyResponse)
def log_energy_usage(data: schemas.EnergyCreate, db: Session = Depends(database.get_db)):
    # Verificăm dacă dispozitivul există
    device = db.query(models.Device).filter(models.Device.id == data.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    new_log = models.EnergyConsumption(
        device_id=data.device_id,
        consumption_kwh=data.consumption_kwh
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

# 2. VEZI CONSUMUL TOTAL PE UN DISPOZITIV
@router.get("/device/{device_id}/total")
def get_device_total_energy(device_id: int, db: Session = Depends(database.get_db)):
    logs = db.query(models.EnergyConsumption).filter(models.EnergyConsumption.device_id == device_id).all()
    total = sum(log.consumption_kwh for log in logs)
    return {"device_id": device_id, "total_kwh": round(total, 2)}

# 3. CONSUM TOTAL PE CAMERĂ (Sumă de dispozitive)
@router.get("/room/{room_id}/total")
def get_room_total_energy(room_id: int, db: Session = Depends(database.get_db)):
    # Luăm toate dispozitivele din camera respectivă
    devices = db.query(models.Device).filter(models.Device.room_id == room_id).all()
    device_ids = [d.id for d in devices]
    
    # Adunăm consumul doar pentru acele dispozitive
    logs = db.query(models.EnergyConsumption).filter(models.EnergyConsumption.device_id.in_(device_ids)).all()
    total = sum(log.consumption_kwh for log in logs)
    
    return {
        "room_id": room_id, 
        "total_devices": len(devices),
        "total_kwh": round(total, 2)
    }