
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.athlete_profile import AthleteProfile
from app.db.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.athlete_profile import (
    AthleteProfileCreate,
    AthleteProfileRead,
    AthleteProfileUpdate,
)
from app.repositories.athlete_profile import (
    create_athlete_profile,
    get_athlete_profile_by_user_id,
    update_athlete_profile,
)

router = APIRouter(
    prefix="/athlete-profiles",
    tags=["Athlete Profiles"],
)


@router.post("/", response_model=AthleteProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile_data: AthleteProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_profile = get_athlete_profile_by_user_id(
        db=db,
        user_id=current_user.id,
    )

    if existing_profile is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Athlete profile already exists",
        )

    return create_athlete_profile(
        db=db,
        user_id=current_user.id,
        profile_data=profile_data,
    )


@router.get("/me", response_model=AthleteProfileRead)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_athlete_profile_by_user_id(
        db=db,
        user_id=current_user.id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found",
        )

    return profile


@router.patch("/me", response_model=AthleteProfileRead)
def update_my_profile(
    update_data: AthleteProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_athlete_profile_by_user_id(
        db=db,
        user_id=current_user.id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found",
        )

    if not update_data.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided for update",
        )

    return update_athlete_profile(
        db=db,
        profile=profile,
        update_data=update_data,
    )
