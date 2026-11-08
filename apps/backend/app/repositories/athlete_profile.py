
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.athlete_profile import AthleteProfile

from app.schemas.athlete_profile import (
    AthleteProfileCreate,
    AthleteProfileUpdate,
)


def create_athlete_profile(
    db: Session,
    user_id: int,
    profile_data: AthleteProfileCreate
) -> AthleteProfile:

    profile = AthleteProfile(
        user_id=user_id,
        **profile_data.model_dump()
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def get_athlete_profile_by_user_id(
    db: Session,
    user_id: int
) -> AthleteProfile | None:

    statement = select(AthleteProfile).where(
        AthleteProfile.user_id == user_id
    )

    return db.scalar(statement)

def update_athlete_profile(
    db: Session,
    profile: AthleteProfile,
    update_data: AthleteProfileUpdate
) -> AthleteProfile:
    updated_fields = update_data.model_dump(exclude_unset=True)

    for field, value in updated_fields.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile

def delete_athlete_profile(
    db: Session,
    profile: AthleteProfile
) -> None:
    db.delete(profile)
    db.commit()
