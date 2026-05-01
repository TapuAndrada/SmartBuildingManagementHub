from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post("/", response_model=schemas.DeviceResponse)
def create_device(
    device: schemas.DeviceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add devices")

    room = db.query(models.Room).filter(models.Room.id == device.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    new_device = models.Device(
        name=device.name,
        device_type=device.device_type,
        room_id=device.room_id,
        is_on=False,
        settings=device.settings,
    )
    db.add(new_device); db.commit(); db.refresh(new_device)
    return new_device


@router.get("/", response_model=List[schemas.DeviceResponse])
def get_all_devices(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    return db.query(models.Device).all()


@router.patch("/{device_id}", response_model=schemas.DeviceResponse)
def update_device_status(
    device_id: int,
    device_update: schemas.DeviceUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    db_device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Authorization: admin OK, otherwise user must be assigned to the device's room
    if current_user.role != "admin" and current_user.room_id != db_device.room_id:
        raise HTTPException(
            status_code=403,
            detail="You can only control devices in your own room",
        )

    if device_update.is_on is not None:
        db_device.is_on = device_update.is_on
    if device_update.settings is not None:
        # Merge instead of replace so partial updates don't wipe other keys
        merged = dict(db_device.settings or {})
        merged.update(device_update.settings)
        db_device.settings = merged

    db.commit(); db.refresh(db_device)
    return db_device