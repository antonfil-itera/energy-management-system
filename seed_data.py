import asyncio
import asyncpg
from datetime import datetime, timedelta
import random
import math
import os
import json

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://energy_user:energy_password@postgres:5432/energy_db")

async def generate_seed_data():
    """Generate 2 months of timeseries data (1 month past + 1 month future) with 1-minute intervals"""
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Get all facilities
        facilities = await conn.fetch("SELECT id, name, type, max_power, active_start_time, active_end_time, current_charge_kwh, metadata FROM facilities")

        print(f"Found {len(facilities)} facilities")

        # Generate data for 2 months: 1 month before now, 1 month after now
        now = datetime.now().replace(second=0, microsecond=0)
        start_time = now - timedelta(days=30)
        end_time = now + timedelta(days=30)

        # 1-minute intervals = 60 per hour * 24 hours * 60 days = 86,400 data points per facility
        interval = timedelta(minutes=1)
        current_time = start_time

        timeseries_data = []

        # Track current charge for each accumulator
        accumulator_charges = {}
        for facility in facilities:
            if facility['type'] == 'accumulator':
                accumulator_charges[facility['id']] = float(facility['current_charge_kwh'])

        # Parse metadata JSON strings
        facilities_parsed = []
        for facility in facilities:
            facility_dict = dict(facility)
            if isinstance(facility_dict['metadata'], str):
                facility_dict['metadata'] = json.loads(facility_dict['metadata'])
            facilities_parsed.append(facility_dict)
        facilities = facilities_parsed

        while current_time <= end_time:
            # First pass: Calculate production and consumption
            total_production = 0
            total_consumption = 0
            timestamp_data = {}

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
                elif facility_type == 'producer':
                    if 'Solar' in facility['name']:
                        # Solar follows day cycle
                        hour = current_time.hour
                        minute = current_time.minute
                        if 6 <= hour <= 20:
                            # Peak at noon, use sine wave with minute precision
                            hours_from_sunrise = (hour - 6) + (minute / 60.0)
                            solar_factor = math.sin((hours_from_sunrise / 14) * math.pi)
                            power_value = abs(max_power) * solar_factor * random.uniform(0.85, 1.0)
                        else:
                            power_value = 0.0
                    elif 'Wind' in facility['name']:
                        # Wind is variable
                        power_value = abs(max_power) * random.uniform(0.3, 0.95)
                    else:
                        power_value = abs(max_power) * random.uniform(0.7, 1.0)

                    total_production += power_value

                elif facility_type == 'consumer':
                    # Household consumers follow daily patterns
                    hour = current_time.hour
                    if 'Kitchen' in facility['name']:
                        # Kitchen peaks at meal times
                        if 7 <= hour <= 9 or 12 <= hour <= 13 or 18 <= hour <= 20:
                            power_value = max_power * random.uniform(0.8, 1.0)
                        else:
                            power_value = max_power * random.uniform(0.3, 0.5)
                    elif 'Living Room' in facility['name'] or 'Office' in facility['name']:
                        # Living areas peak evening
                        if 17 <= hour <= 23:
                            power_value = max_power * random.uniform(0.7, 1.0)
                        elif 8 <= hour <= 17:
                            power_value = max_power * random.uniform(0.4, 0.6)
                        else:
                            power_value = max_power * random.uniform(0.1, 0.3)
                    elif 'Bedroom' in facility['name']:
                        # Bedrooms peak at night
                        if 22 <= hour or hour <= 7:
                            power_value = max_power * random.uniform(0.6, 0.9)
                        else:
                            power_value = max_power * random.uniform(0.2, 0.4)
                    elif 'Bathroom' in facility['name']:
                        # Bathroom peaks morning and evening
                        if 6 <= hour <= 9 or 18 <= hour <= 22:
                            power_value = max_power * random.uniform(0.7, 1.0)
                        else:
                            power_value = max_power * random.uniform(0.2, 0.4)
                    else:
                        # Default consumer pattern
                        power_value = max_power * random.uniform(0.5, 0.8)

                    total_consumption += abs(power_value)

                elif facility_type == 'accumulator':
                    # Store for second pass
                    power_value = 0.0
                else:
                    power_value = 0.0

                # Store producer/consumer data
                timestamp_data[facility_id] = power_value

            # Second pass: Calculate accumulator behavior based on system balance
            net_balance = total_production - total_consumption

            for facility in facilities:
                if facility['type'] == 'accumulator':
                    facility_id = facility['id']
                    max_power = float(facility['max_power'])
                    capacity_kwh = float(facility['metadata'].get('capacity_kwh', 0))
                    efficiency = float(facility['metadata'].get('efficiency', 0.95))
                    current_charge = accumulator_charges[facility_id]

                    if net_balance > 0:
                        # Excess production: CHARGE the battery at max rate
                        charge_power = abs(max_power)  # Charge at full capacity
                        energy_added = charge_power * efficiency * (1 / 60)
                        new_charge = current_charge + energy_added

                        if new_charge >= capacity_kwh:
                            # Battery full
                            power_value = 0.0
                            accumulator_charges[facility_id] = capacity_kwh
                        else:
                            power_value = -charge_power  # Negative = charging
                            accumulator_charges[facility_id] = new_charge

                    elif net_balance < 0:
                        # Deficit: DISCHARGE the battery at max rate
                        discharge_power = abs(max_power)  # Discharge at full capacity
                        energy_removed = discharge_power / efficiency * (1 / 60)
                        new_charge = current_charge - energy_removed

                        if new_charge <= 0:
                            # Battery empty
                            power_value = 0.0
                            accumulator_charges[facility_id] = 0.0
                        else:
                            power_value = discharge_power  # Positive = discharging
                            accumulator_charges[facility_id] = new_charge
                    else:
                        # Balanced system
                        power_value = 0.0

                    timestamp_data[facility_id] = power_value

            # Third pass: Store all data for this timestamp
            for facility in facilities:
                facility_id = facility['id']
                power_value = timestamp_data[facility_id]

                # Store energy level for accumulators
                stored_energy = None
                if facility['type'] == 'accumulator':
                    stored_energy = round(accumulator_charges[facility_id], 2)

                timeseries_data.append((facility_id, current_time, round(power_value, 2), stored_energy))

            current_time += interval

        # Bulk insert
        print(f"Inserting {len(timeseries_data)} timeseries records...")
        await conn.executemany(
            "INSERT INTO timeseries (facility_id, timestamp, power_value, stored_energy_kwh) VALUES ($1, $2, $3, $4)",
            timeseries_data
        )

        # Update final charge levels for accumulators
        for facility_id, final_charge in accumulator_charges.items():
            await conn.execute(
                "UPDATE facilities SET current_charge_kwh = $1 WHERE id = $2",
                round(final_charge, 2), facility_id
            )

        print("✅ Seed data generation complete!")
        print(f"   - Time range: {start_time} to {end_time}")
        print(f"   - Total records: {len(timeseries_data)}")
        print(f"   - Records per facility: {len(timeseries_data) // len(facilities)}")
        print(f"\n📊 Final accumulator charge levels:")
        for facility in facilities:
            if facility['type'] == 'accumulator':
                final_charge = accumulator_charges[facility['id']]
                capacity = float(facility['metadata'].get('capacity_kwh', 0))
                percentage = (final_charge / capacity * 100) if capacity > 0 else 0
                print(f"   - {facility['name']}: {final_charge:.2f} kWh / {capacity:.2f} kWh ({percentage:.1f}%)")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(generate_seed_data())
