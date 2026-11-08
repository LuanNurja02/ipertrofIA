
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.schemas.auth import UserRegister
from app.core.security import hash_password


def get_user_by_email(
    db: Session,
    email: str
) -> User | None:
    """Recupera un utente tramite email."""

    statement = select(User).where(User.email == email)

    return db.scalar(statement)


def create_user(
    db: Session,
    user_data: UserRegister
) -> User:
    """Crea un nuovo utente con password hashata."""

    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
