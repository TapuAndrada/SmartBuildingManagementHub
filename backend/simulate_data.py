"""
Sensor + energy data simulator for SmartBuildingManagementHub.

  backfill : generate historical data over a window
  live     : continuously emit new readings

Examples:
  python simulate_data.py --mode backfill --hours 24 --interval-min 15
  python simulate_data.py --mode live --interval-sec 30
"""
import argparse
import math
import random
import time
from datetime import datetime, timedelta

from database import SessionLocal
import models


ENERGY_PROFILES = {
    "light":      (0.01, 0.06),
    "ac":         (0.4,  1.5),
    "hvac":       (0.4,  1.5),
    "humidifier": (0.02, 0.10),
    "heater":     (0.5,  2.0),
    "tv":         (0.05, 0.20),
    "default":    (0.05, 0.25),
}


def temperature_for_hour(hour: int, target):
    base = target if target is not None else 22.0
    daily = math.sin((hour - 9) / 24 * 2 * math.pi) * 1.5
    return round(base + daily + random.uniform(-0.6, 0.6), 1)


def humidity_for_hour(hour: int):
    daily = -math.sin((hour - 9) / 24 * 2 * math.pi) * 5
    return round(45 + daily + random.uniform(-3, 3), 1)


def energy_for_device(device, interval_minutes: float):
    if not device.is_on:
        return 0.0
    key = (device.device_type or "").lower()
    low, high = ENERGY_PROFILES.get(key, ENERGY_PROFILES["default"])

    # If the device has a target_temp setting, use it as a load multiplier:
    # the further from a comfortable 22°C, the harder it works.
    multiplier = 1.0
    if isinstance(device.settings, dict) and "target_temp" in device.settings:
        delta = abs(device.settings["target_temp"] - 22)
        multiplier = 1 + (delta * 0.08)

    fraction = interval_minutes / 60
    return round(random.uniform(low, high) * fraction * multiplier, 4)


def generate_tick(db, ts: datetime, interval_minutes: float):
    rooms = db.query(models.Room).all()
    devices = db.query(models.Device).all()

    if not rooms:
        print("WARNING: No rooms in DB. Run seed.py first.")
        return 0, 0

    sensors_added = 0
    for room in rooms:
        db.add(models.SensorData(
            room_id=room.id,
            temperature=temperature_for_hour(ts.hour, room.target_temperature),
            humidity=humidity_for_hour(ts.hour),
            timestamp=ts,
        ))
        sensors_added += 1

    energy_added = 0
    for device in devices:
        kwh = energy_for_device(device, interval_minutes)
        if kwh > 0:
            db.add(models.EnergyConsumption(
                device_id=device.id,
                consumption_kwh=kwh,
                timestamp=ts,
            ))
            energy_added += 1

    db.commit()
    return sensors_added, energy_added


def backfill(hours: int, interval_min: int):
    db = SessionLocal()
    try:
        end = datetime.utcnow()
        start = end - timedelta(hours=hours)
        ticks = int((hours * 60) / interval_min)
        print(f"Backfilling {ticks} ticks across {hours}h ({interval_min}-min spacing)...")

        ts = start
        total_s = total_e = 0
        for _ in range(ticks):
            s, e = generate_tick(db, ts, interval_min)
            total_s += s
            total_e += e
            ts += timedelta(minutes=interval_min)
        print(f"Done. {total_s} sensor readings, {total_e} energy logs inserted.")
    finally:
        db.close()


def live(interval_sec: int):
    """Per-tick session: survives DB hiccups and picks up newly-created rooms/devices live."""
    print(f"Live mode: every {interval_sec}s. Ctrl+C to stop.")
    try:
        while True:
            db = SessionLocal()
            try:
                now = datetime.utcnow()
                s, e = generate_tick(db, now, interval_sec / 60)
                print(f"[{now:%H:%M:%S}] +{s} sensors, +{e} energy logs")
            except Exception as ex:
                print(f"Tick failed: {ex}. Continuing...")
                db.rollback()
            finally:
                db.close()
            time.sleep(interval_sec)
    except KeyboardInterrupt:
        print("\nStopped.")


def main():
    p = argparse.ArgumentParser(description="Sensor + energy data simulator")
    p.add_argument("--mode", choices=["backfill", "live"], default="backfill")
    p.add_argument("--hours", type=int, default=24)
    p.add_argument("--interval-min", type=int, default=15)
    p.add_argument("--interval-sec", type=int, default=30)
    args = p.parse_args()

    if args.mode == "backfill":
        backfill(args.hours, args.interval_min)
    else:
        live(args.interval_sec)


if __name__ == "__main__":
    main()