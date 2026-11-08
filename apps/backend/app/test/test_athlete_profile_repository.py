import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db import models
from app.db.models.user import User
from app.schemas.athlete_profile import AthleteProfileCreate
from app.repositories.athlete_profile import (
    create_athlete_profile,
    get_athlete_profile_by_user_id,
    delete_athlete_profile,
)
 

from app.schemas.athlete_profile import AthleteProfileUpdate
from app.repositories.athlete_profile import update_athlete_profile
from app.db.models.athlete_profile import AthleteProfile

@pytest.fixture
def db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:")

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_create_athlete_profile(db_session):
    user = User(
        email="test@example.com",
        hashed_password="fake_hashed_password",
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile_data = AthleteProfileCreate(
        first_name="Luca",
        age=25,
        body_weight=80.5,
        height=180,
    )

    profile = create_athlete_profile(
        db=db_session,
        user_id=user.id,
        profile_data=profile_data,
    )

    assert profile.id is not None
    assert profile.user_id == user.id
    assert profile.first_name == "Luca"
    assert profile.body_weight == 80.5


def test_get_athlete_profile_by_user_id(db_session):
    user = User(
        email="test2@example.com",
        hashed_password="fake_hashed_password",
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile_data = AthleteProfileCreate(
        first_name="Marco",
        training_goal="hypertrophy",
    )

    create_athlete_profile(
        db=db_session,
        user_id=user.id,
        profile_data=profile_data,
    )

    profile = get_athlete_profile_by_user_id(
        db=db_session,
        user_id=user.id,
    )

    assert profile is not None
    assert profile.first_name == "Marco"
    assert profile.training_goal == "hypertrophy"


def test_get_nonexistent_athlete_profile(db_session):
    profile = get_athlete_profile_by_user_id(
        db=db_session,
        user_id=999,
    )

    assert profile is None

def test_update_athlete_profile(db_session):
    user = User(
        email="update@test.com",
        hashed_password="fake_hash"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = AthleteProfile(
        user_id=user.id,
        first_name="Luan",
        body_weight=100.0,
        training_goal="strength"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    update_data = AthleteProfileUpdate(body_weight=98.5)

    updated_profile = update_athlete_profile(
        db=db_session,
        profile=profile,
        update_data=update_data
    )

    assert updated_profile.body_weight == 98.5
    assert updated_profile.first_name == "Luan"
    assert updated_profile.training_goal == "strength"


def test_update_athlete_profile_can_clear_nullable_field(db_session):
    user = User(
        email="clear@test.com",
        hashed_password="fake_hash"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = AthleteProfile(
        user_id=user.id,
        first_name="Luan",
        last_name="Nurja"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    update_data = AthleteProfileUpdate(last_name=None)

    updated_profile = update_athlete_profile(
        db=db_session,
        profile=profile,
        update_data=update_data
    )

    assert updated_profile.last_name is None


def test_delete_athlete_profile(db_session):
    user = User(
        email="delete@test.com",
        hashed_password="fake_hash"
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = AthleteProfile(
        user_id=user.id,
        first_name="Luan",
        last_name="Nurja",
        body_weight=100.0
    )

    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    delete_athlete_profile(
        db=db_session,
        profile=profile
    )

    deleted_profile = get_athlete_profile_by_user_id(
        db=db_session,
        user_id=user.id
    )

    assert deleted_profile is None