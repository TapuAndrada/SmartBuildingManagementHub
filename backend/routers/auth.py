from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import models, schemas, database
from security import verify_password, create_access_token,get_password_hash
from sqlalchemy import or_

router = APIRouter(tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(
        or_(
            models.User.email == form_data.username,
            models.User.username == form_data.username
        )
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "is_admin": user.is_admin}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_role": user.role,
        "is_approved": user.is_approved
    }

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        is_approved=False, 
        is_admin=False,     
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user