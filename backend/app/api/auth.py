import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import bcrypt
from jose import jwt
from app.models.schema import User
from app.models.db import get_db
from app.schemas.auth_schemas import UserCreate, UserLogin, UserResponse
from app.core.config import get_settings
from app.core.rate_limit import limiter

router = APIRouter(tags=["auth"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(user: User) -> str:
    settings = get_settings()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode = {
        "sub": str(user.id),
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.nextauth_secret, algorithm="HS256")
    return encoded_jwt

@router.post("/auth/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        name=user.name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(new_user)
    return UserResponse(id=str(new_user.id), email=new_user.email, name=new_user.name, access_token=access_token)

@router.post("/auth/login", response_model=UserResponse)
@limiter.limit("5/minute")
async def login(request: Request, user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_credentials.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
        
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
        
    access_token = create_access_token(user)
    return UserResponse(id=str(user.id), email=user.email, name=user.name, access_token=access_token)
