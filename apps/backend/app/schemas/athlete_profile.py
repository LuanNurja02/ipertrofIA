
from pydantic import BaseModel, ConfigDict, Field, field_validator



class AthleteProfileBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    age: int | None = Field(default=None, ge=1, le=120)
    body_weight: float | None = Field(default=None, gt=0)
    height: float | None = Field(default=None, gt=0)
    training_experience: str | None = Field(default=None, max_length=50)
    training_goal: str | None = Field(default=None, max_length=100)


class AthleteProfileCreate(AthleteProfileBase):
    """Schema per creare un profilo atleta."""
    pass


class AthleteProfileRead(AthleteProfileBase):
    """Schema per restituire un profilo atleta."""

    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class AthleteProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    age: int | None = Field(default=None, ge=1, le=120)
    body_weight: float | None = Field(default=None, gt=0)
    height: float | None = Field(default=None, gt=0)
    training_experience: str | None = Field(default=None, max_length=50)
    training_goal: str | None = Field(default=None, max_length=100)

    @field_validator("first_name")
    @classmethod
    def first_name_must_not_be_null(cls, value):
        if value is None:
            raise ValueError("first_name cannot be null")
        return value