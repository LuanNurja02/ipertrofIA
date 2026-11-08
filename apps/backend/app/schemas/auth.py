
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    """Dati necessari per registrare un nuovo utente."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    """Dati pubblici dell'utente."""

    id: int
    email: EmailStr
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Risposta contenente il JWT."""

    access_token: str
    token_type: str = "bearer"



class UserLogin(BaseModel):
    """Credenziali necessarie per effettuare il login."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
