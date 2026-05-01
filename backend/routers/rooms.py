from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("/", response_model=List[schemas.RoomResponse])
def get_rooms(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    return db.query(models.Room).all()


@router.get("/status/dashboard", response_model=List[schemas.RoomDashboardResponse])
def get_room_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    rooms = db.query(models.Room).all()
    results = []
    for room in rooms:
        latest = (db.query(models.SensorData)
                    .filter(models.SensorData.room_id == room.id)
                    .order_by(models.SensorData.timestamp.desc())
                    .first())
        results.append({
            "id": room.id,
            "name": room.name,
            "floor": room.floor,
            "target_temperature": room.target_temperature,
            "devices": room.devices,
            "last_reading": latest,
        })
    return results


@router.get("/{room_id}", response_model=schemas.RoomResponse)
def get_room(room_id: int, db: Session = Depends(database.get_db),
             current_user: models.User = Depends(dependencies.get_current_user)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.post("/", response_model=schemas.RoomResponse)
def create_room(
    room: schemas.RoomCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add new rooms")
    new_room = models.Room(name=room.name, floor=room.floor,
                           target_temperature=room.target_temperature)
    db.add(new_room); db.commit(); db.refresh(new_room)
    return new_room


@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(database.get_db),
                current_user: models.User = Depends(dependencies.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete rooms")
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room); db.commit()
    return {"message": f"Room '{room.name}' deleted"}


# NEW: admin can switch off every device in a room
@router.post("/{room_id}/turn-off-all")
def turn_off_all_devices_in_room(
    room_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    """Admin power: instantly turns off every device in a given room."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can perform this action")

    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    devices = db.query(models.Device).filter(
        models.Device.room_id == room_id,
        models.Device.is_on == True,
    ).all()

    for d in devices:
        d.is_on = False
    db.commit()

    return {
        "room_id": room_id,
        "devices_turned_off": [d.id for d in devices],
        "count": len(devices),
    }