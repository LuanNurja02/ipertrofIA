
import pytest
from pydantic import ValidationError

from app.schemas.athlete_profile import AthleteProfileCreate


def test_valid_athlete_profile():
    profile = AthleteProfileCreate(
        first_name="Luca",
        age=25,
        body_weight=80.5,
        height=180,
        training_experience="intermediate",
        training_goal="hypertrophy"
    )

    assert profile.first_name == "Luca"
    assert profile.body_weight == 80.5


def test_first_name_is_required():
    with pytest.raises(ValidationError):
        AthleteProfileCreate(
            age=25
        )


def test_body_weight_must_be_positive():
    with pytest.raises(ValidationError):
        AthleteProfileCreate(
            first_name="Luca",
            body_weight=-10
        )
