from database import SessionLocal
import models
from security import get_password_hash


ROOMS_TO_SEED = [
    {"name": "Living Room", "floor": 1, "target_temperature": 22.0},
    {"name": "Kitchen",     "floor": 1, "target_temperature": 21.0},
    {"name": "Bedroom",     "floor": 2, "target_temperature": 20.0},
    {"name": "Office",      "floor": 2, "target_temperature": 23.0},
]

# Devices keyed by room name
DEVICES_TO_SEED = {
    "Living Room": [
        ("Main Light",    "light",      {"brightness": 80}),
        ("AC Unit",       "ac",         {"target_temp": 22}),
        ("Smart TV",      "tv",         {}),
    ],
    "Kitchen": [
        ("Ceiling Light", "light",      {"brightness": 100}),
        ("Humidifier",    "humidifier", {"level": 2}),
    ],
    "Bedroom": [
        ("Bedside Lamp",  "light",      {"brightness": 40}),
        ("HVAC",          "hvac",       {"target_temp": 20}),
    ],
    "Office": [
        ("Desk Lamp",     "light",      {"brightness": 70}),
        ("Office AC",     "ac",         {"target_temp": 23}),
    ],
}


def seed_admin(db):
    if db.query(models.User).filter_by(email="admin@smarthome.com").first():
        print("• Admin already exists.")
        return
    db.add(models.User(
        username="admin",
        email="admin@smarthome.com",
        password_hash=get_password_hash("admin123"),
        role="admin",
        is_active=True,
    ))
    db.commit()
    print("✓ Admin created (admin@smarthome.com / admin123).")


def seed_regular_user(db, default_room_id: int | None):
    if db.query(models.User).filter_by(email="user@smarthome.com").first():
        print("• Regular user already exists.")
        return
    db.add(models.User(
        username="user",
        email="user@smarthome.com",
        password_hash=get_password_hash("user123"),
        role="user",
        is_active=True,
        room_id=default_room_id,
    ))
    db.commit()
    print(f"✓ Regular user created (user@smarthome.com / user123), assigned to room {default_room_id}.")


def seed_rooms(db) -> dict[str, models.Room]:
    """Returns a {name: Room} map of seeded rooms (idempotent)."""
    name_to_room = {}
    for r in ROOMS_TO_SEED:
        existing = db.query(models.Room).filter_by(name=r["name"]).first()
        if existing:
            name_to_room[r["name"]] = existing
            continue
        room = models.Room(**r)
        db.add(room)
        db.flush()  # populate room.id without ending the transaction
        name_to_room[r["name"]] = room
        print(f"✓ Room created: {r['name']}")
    db.commit()
    return name_to_room


def seed_devices(db, name_to_room):
    for room_name, devices in DEVICES_TO_SEED.items():
        room = name_to_room.get(room_name)
        if not room:
            continue
        for dev_name, dev_type, settings in devices:
            existing = db.query(models.Device).filter_by(
                name=dev_name, room_id=room.id
            ).first()
            if existing:
                continue
            db.add(models.Device(
                name=dev_name,
                device_type=dev_type,
                room_id=room.id,
                is_on=False,
                settings=settings,
            ))
            print(f"  ✓ Device created: {dev_name} ({dev_type}) in {room_name}")
    db.commit()


def seed_all():
    db = SessionLocal()
    try:
        print("=== Seeding database ===")
        seed_admin(db)
        rooms = seed_rooms(db)
        seed_devices(db, rooms)
        # Park the regular user in the Living Room by default
        default_room = rooms.get("Living Room")
        seed_regular_user(db, default_room.id if default_room else None)
        print("=== Done ===")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()