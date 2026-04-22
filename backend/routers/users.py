from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import schemas, models, database, dependencies
from security import get_password_hash

router = APIRouter(
    prefix="/users",     
    tags=["Users"] 
)

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    """Returns the currently authenticated user's data."""
    return current_user

@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    """Returns a list of all users."""
    users = db.query(models.User).all()
    return users

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    """Returns a specific user by ID."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    return user

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Creates a new user in the system."""

    if user.role == "admin":
        admin_exists = db.query(models.User).filter(models.User.role == "admin").first()
        if admin_exists:
            raise HTTPException(
                status_code=400, 
                detail="An administrator already exists. There can be only one."
            )

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password, 
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    """Deletes a user from the database."""
    user_query = db.query(models.User).filter(models.User.id == user_id)
    user = user_query.first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User with ID {user_id} not found"
        )

    user_query.delete(synchronize_session=False)
    db.commit()

    return {"message": f"User with ID {user_id} has been successfully deleted"}