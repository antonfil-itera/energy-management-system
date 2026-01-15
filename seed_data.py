import asyncio
import asyncpg
from datetime import datetime, timedelta
import random
import math
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://energy_user:energy_password@postgres:5432/energy_db")

async def generate_seed_data():
    """Generate 24 hours of timeseries data for 10 facilities with 5-minute intervals"""
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Get all facilities
        facilities = await conn.fetch("SELECT id, type, max_power, active_start_time, active_end_time FROM facilities")

        print(f"Found {len(facilities)} facilities")

        # Generate data for the last 24 hours
        end_time = datetime.now().replace(second=0, microsecond=0)
        start_time = end_time - timedelta(hours=24)

        # 5-minute intervals = 12 per hour * 24 hours = 288 data points per facility
        interval = timedelta(minutes=5)
        current_time = start_time

        timeseries_data = []

        while current_time <= end_time:
            for facility in facilities:
                facility_id = facility['id']
                facility_type = facility['type']
                max_power = float(facility['max_power'])
                active_start = facility['active_start_time']
                active_end = facility['active_end_time']

                # Determine if facility is active
                current_hour_minute = current_time.time()
                is_active = True

                if active_start and active_end:
                    is_active = active_start <= current_hour_minute <= active_end

                if not is_active:
                    power_value = 0.0
                else:
                    if facility_type == 'producer':
                        if 'Solar' in facility['name']:
                            # Solar follows day cycle
                            hour = current_time.hour
                            if 6 <= hour <= 20:
                                # Peak at noon, use sine wave
                                hours_from_sunrise = hour - 6
                                solar_factor = math.sin((hours_from_sunrise / 14) * math.pi)
                                power_value = abs(max_power) * solar_factor * random.uniform(0.85, 1.0)
                            else:
                                power_value = 0.0
                        elif 'Wind' in facility['name']:
                            # Wind is variable
                            power_value = abs(max_power) * random.uniform(0.3, 0.95)
                        else:
                            power_value = abs(max_power) * random.uniform(0.7, 1.0)

                    elif facility_type == 'consumer':
                        if 'Factory' in facility['name']:
                            # Factories have steady load with some variation
                            power_value = max_power * random.uniform(0.8, 1.0)  # negative value
                        elif 'Residential' in facility['name']:
                            # Residential follows daily pattern
                            hour = current_time.hour
                            if 6 <= hour <= 9 or 17 <= hour <= 23:
                                # Peak morning and evening
                                power_value = max_power * random.uniform(0.7, 1.0)
                            else:
                                # Lower usage at night and midday
                                power_value = max_power * random.uniform(0.3, 0.6)
                        else:
                            power_value = max_power * random.uniform(0.6, 0.9)

                    elif facility_type == 'accumulator':
                        # Accumulators charge (negative) during excess production, discharge (positive) during deficit
                        hour = current_time.hour
                        if 10 <= hour <= 16:
                            # Charging during solar peak
                            power_value = -abs(max_power) * random.uniform(0.5, 0.8)
                        elif 18 <= hour <= 22:
                            # Discharging during evening peak
                            power_value = abs(max_power) * random.uniform(0.5, 0.8)
                        else:
                            # Minimal activity
                            power_value = random.choice([0.0, 0.0, random.uniform(-0.1, 0.1) * abs(max_power)])
                    else:
                        power_value = 0.0

                timeseries_data.append((facility_id, current_time, round(power_value, 2)))

            current_time += interval

        # Bulk insert
        print(f"Inserting {len(timeseries_data)} timeseries records...")
        await conn.executemany(
            "INSERT INTO timeseries (facility_id, timestamp, power_value) VALUES ($1, $2, $3)",
            timeseries_data
        )

        print("✅ Seed data generation complete!")
        print(f"   - Time range: {start_time} to {end_time}")
        print(f"   - Total records: {len(timeseries_data)}")
        print(f"   - Records per facility: {len(timeseries_data) // len(facilities)}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(generate_seed_data())
