from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, dependencies

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)

# 1. VEZI TOATE CAMERELE
@router.get("/", response_model=List[schemas.RoomResponse])
def get_rooms(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Returns all rooms in the smart home. Accessible by any logged-in family member."""
    rooms = db.query(models.Room).all()
    return rooms

# Partea asta este special pentru frontend ca contine tot ce avem nevoie intr-un singur loc
@router.get("/status/dashboard", response_model=List[schemas.RoomDashboardResponse])
def get_room_dashboard(
    db: Session = Depends(database.get_db),
    # ADAUGĂ ACEASTĂ LINIE:
    current_user: models.User = Depends(dependencies.get_current_user)
):
    rooms = db.query(models.Room).all()
    results = []

    for room in rooms:
        latest_reading = db.query(models.SensorData)\
            .filter(models.SensorData.room_id == room.id)\
            .order_by(models.SensorData.timestamp.desc())\
            .first()

        results.append({
            "id": room.id,
            "name": room.name,
            "floor": room.floor,
            "target_temperature": room.target_temperature,
            "devices": room.devices,
            "last_reading": latest_reading
        })

    return results


# 2. VEZI O CAMERĂ SPECIFICĂ
@router.get("/{room_id}", response_model=schemas.RoomResponse)
def get_room(
    room_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Returns details for a specific room."""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Room not found"
        )
    return room

# 3. CREEAZĂ O CAMERĂ NOUĂ (Doar ADMIN)
@router.post("/", response_model=schemas.RoomResponse)
def create_room(
    room: schemas.RoomCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Allows only the House Admin to add a new room."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only admins can add new rooms to the house"
        )
    
    new_room = models.Room(
        name=room.name,
        floor=room.floor,
        target_temperature=room.target_temperature
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

# 4. ȘTERGE O CAMERĂ (Doar ADMIN)
@router.delete("/{room_id}")
def delete_room(
    room_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Allows only the House Admin to delete a room."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only admins can delete rooms"
        )
    
    room_query = db.query(models.Room).filter(models.Room.id == room_id)
    room = room_query.first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Room not found"
        )
    
    room_query.delete(synchronize_session=False)
    db.commit()
    
    return {"message": f"Room '{room.name}' has been successfully deleted"}

