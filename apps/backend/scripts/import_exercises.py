
import json
import re
import unicodedata
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import (
    Exercise,
    ExerciseMuscle,
    ExerciseMedia,
    ExerciseInstruction,
    Muscle,
    Equipment,
)


BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "data"
    / "external"
    / "free-exercise-db"
    / "exercises.json"
)

SOURCE_NAME = "free-exercise-db"
SOURCE_LICENSE = "Unlicense"

MUSCLE_GROUPS = {
    "abdominals": "core",
    "abductors": "hips",
    "adductors": "hips",
    "biceps": "arms",
    "triceps": "arms",
    "forearms": "arms",
    "chest": "chest",
    "shoulders": "shoulders",
    "traps": "back",
    "lats": "back",
    "middle back": "back",
    "lower back": "back",
    "neck": "neck",
    "quadriceps": "legs",
    "hamstrings": "legs",
    "glutes": "glutes",
    "calves": "legs",
}


def create_slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def load_dataset() -> list:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset non trovato: {DATASET_PATH}"
        )

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(
            "Il dataset deve contenere una lista JSON."
        )

    return data


def get_or_create_muscle(
    db: Session,
    name: str
) -> Muscle:

    muscle = db.scalar(
        select(Muscle).where(Muscle.name == name)
    )

    if muscle is None:
        muscle = Muscle(
            name=name,
            anatomical_group=MUSCLE_GROUPS.get(
                name, "other"
            )
        )
        db.add(muscle)
        db.flush()

    return muscle


def get_or_create_equipment(
    db: Session,
    name: str
) -> Equipment:

    equipment = db.scalar(
        select(Equipment).where(
            Equipment.name == name
        )
    )

    if equipment is None:
        equipment = Equipment(name=name)
        db.add(equipment)
        db.flush()

    return equipment


def import_exercise(
    db: Session,
    item: dict
) -> bool:

    source_id = item.get("id")
    name = item.get("name")

    if not source_id or not name:
        return False

    exercise = db.scalar(
        select(Exercise).where(
            Exercise.source == SOURCE_NAME,
            Exercise.source_id == source_id
        )
    )

    is_new = exercise is None

    if is_new:
        base_slug = create_slug(name)

        if not base_slug:
            base_slug = "exercise"

        slug = base_slug
        suffix = 2

        while db.scalar(
            select(Exercise.id).where(
                Exercise.slug == slug
            )
        ) is not None:

            slug = f"{base_slug}-{suffix}"
            suffix += 1

        exercise = Exercise(
            name=name,
            slug=slug,
            source=SOURCE_NAME,
            source_id=source_id,
            source_license=SOURCE_LICENSE,
        )

        db.add(exercise)
        db.flush()

    exercise.name = name
    exercise.category = item.get("category")
    exercise.difficulty = item.get("level")
    exercise.force_type = item.get("force")
    exercise.mechanic = item.get("mechanic")
    exercise.is_compound = (
        item.get("mechanic") == "compound"
    )
    exercise.is_active = True

    # MUSCOLI
    if is_new:

        muscle_roles = {}

        # I muscoli primari hanno la precedenza
        for muscle_name in item.get(
            "primaryMuscles", []
        ):
            muscle_roles[muscle_name] = "primary"

        # I secondari non sovrascrivono i primari
        for muscle_name in item.get(
            "secondaryMuscles", []
        ):
            muscle_roles.setdefault(
                muscle_name,
                "secondary"
            )

        for muscle_name, role in muscle_roles.items():

            muscle = get_or_create_muscle(
                db,
                muscle_name
            )

            exercise.muscle_relationships.append(
                ExerciseMuscle(
                    muscle=muscle,
                    role=role
                )
            )

    # ATTREZZATURA
    equipment_name = item.get("equipment")

    if equipment_name:

        equipment = get_or_create_equipment(
            db,
            equipment_name
        )

        if equipment not in exercise.equipment:
            exercise.equipment.append(equipment)

    # ISTRUZIONI ORIGINALI IN INGLESE
    if is_new:

        for index, instruction in enumerate(
            item.get("instructions", []),
            start=1
        ):

            exercise.instructions.append(
                ExerciseInstruction(
                    language="en",
                    step_number=index,
                    instruction=instruction
                )
            )

    # IMMAGINI
    if is_new:

        images = item.get("images", [])

        for index, image_path in enumerate(images):

            image_url = (
                "https://raw.githubusercontent.com/"
                "yuhonas/free-exercise-db/main/exercises/"
                + image_path
            )

            exercise.media.append(
                ExerciseMedia(
                    media_type="image",
                    url=image_url,
                    alt_text=(
                        f"{name} - image {index + 1}"
                    ),
                    sort_order=index,
                    is_primary=(index == 0),
                    source=SOURCE_NAME,
                    license=SOURCE_LICENSE,
                )
            )

    return is_new


def main():

    data = load_dataset()

    print(
        f"Dataset caricato: {len(data)} esercizi"
    )

    db = SessionLocal()

    imported = 0
    updated = 0
    skipped = 0

    try:

        for index, item in enumerate(
            data,
            start=1
        ):

            try:

                is_new = import_exercise(
                    db,
                    item
                )

                if is_new:
                    imported += 1
                elif item.get("id") and item.get("name"):
                    updated += 1
                else:
                    skipped += 1

                if index % 50 == 0:
                    print(
                        f"Elaborati {index}/{len(data)}..."
                    )

            except Exception as error:

                raise RuntimeError(
                    f"Errore nell'esercizio "
                    f"{item.get('name', 'sconosciuto')}: "
                    f"{error}"
                ) from error

        db.commit()

        print("\nIMPORTAZIONE COMPLETATA")
        print(f"Nuovi esercizi: {imported}")
        print(f"Esercizi già presenti: {updated}")
        print(f"Esercizi saltati: {skipped}")

    except Exception:

        db.rollback()

        print(
            "\nERRORE: transazione annullata. "
            "Nessuna importazione parziale salvata."
        )

        raise

    finally:
        db.close()ss


if __name__ == "__main__":
    main()
