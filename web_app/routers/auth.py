from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, Token, UserResponse
from security import get_password_hash, create_access_token, verify_password

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.email == user_data.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email уже зарегистрирован"
        )

    new_user = User(
        email=user_data.email, hashed_password=get_password_hash(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == user_data.email))

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
