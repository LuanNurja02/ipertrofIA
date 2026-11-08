import pytest
from pydantic import ValidationError

from app.schemas.athlete_profile import AthleteProfileUpdate


def test_partial_update():
    data = AthleteProfileUpdate(body_weight=98.5)

    assert data.model_dump(exclude_unset=True) == {
        "body_weight": 98.5
    }


def test_nullable_field_can_be_cleared():
    data = AthleteProfileUpdate(last_name=None)

    assert data.model_dump(exclude_unset=True) == {
        "last_name": None
    }


def test_first_name_cannot_be_null():
    with pytest.raises(ValidationError):
        AthleteProfileUpdate(first_name=None)