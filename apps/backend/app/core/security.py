
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings


# Gestione hashing delle password
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Genera l'hash sicuro di una password."""
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """Verifica una password rispetto al suo hash."""
    return password_hash.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
) -> str:
    """Genera un JWT firmato."""

    to_encode = data.copy()

    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.access_token_expire_minutes
        )

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """Verifica un JWT e ne restituisce il payload."""

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload

    except jwt.InvalidTokenError:
        return None
