
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import UserRegister, UserRead
from app.repositories.user import get_user_by_email, create_user
from app.schemas.auth import UserRegister, UserRead, UserLogin, Token
from app.core.security import verify_password, create_access_token

from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Registra un nuovo utente."""

    existing_user = get_user_by_email(
        db=db,
        email=user_data.email
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    user = create_user(
        db=db,
        user_data=user_data
    )

    return user

@router.post("/login", response_model=Token)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # Cerchiamo l'utente tramite email
    user = get_user_by_email(
        db=db,
        email=form_data.username,
    )

    # Verifichiamo le credenziali
    if user is None or not verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verifichiamo che l'account sia attivo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    # Generiamo il JWT
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return Token(access_token=access_token)