from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import schemas, models, database, dependencies
from security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if user.role == "admin":
        if db.query(models.User).filter(models.User.role == "admin").first():
            raise HTTPException(status_code=400, detail="An administrator already exists.")

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        room_id=user.room_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# NEW: User swaps to a different room
@router.patch("/me/room", response_model=schemas.UserResponse)
def swap_my_room(
    payload: schemas.RoomSwap,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    """Lets a user move themselves into a different room."""
    target_room = db.query(models.Room).filter(models.Room.id == payload.room_id).first()
    if not target_room:
        raise HTTPException(status_code=404, detail="Room not found")

    current_user.room_id = payload.room_id
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted"}