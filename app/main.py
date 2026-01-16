from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
import random
import math
import json
from app.database import db
from app.models import Facility, FacilityCreate, TimeseriesBulkCreate, Timeseries, TimeseriesQuery

app = FastAPI(title="Energy Management API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

# Facility endpoints
@app.get("/facilities", response_model=List[Facility])
async def get_facilities():
    """Get all facilities"""
    query = """
        SELECT id, name, type, max_power, active_start_time, active_end_time, metadata, current_charge_kwh, created_at
        FROM facilities
        ORDER BY id
    """
    rows = await db.fetch_all(query)
    result = []
    for row in rows:
        data = dict(row)
        # Parse JSONB metadata if it's a string
        if isinstance(data['metadata'], str):
            data['metadata'] = json.loads(data['metadata'])
        result.append(data)
    return result

@app.get("/facilities/{facility_id}", response_model=Facility)
async def get_facility(facility_id: int):
    """Get facility by ID"""
    query = """
        SELECT id, name, type, max_power, active_start_time, active_end_time, metadata, current_charge_kwh, created_at
        FROM facilities
        WHERE id = $1
    """
    row = await db.fetch_one(query, facility_id)
    if not row:
        raise HTTPException(status_code=404, detail="Facility not found")
    data = dict(row)
    # Parse JSONB metadata if it's a string
    if isinstance(data['metadata'], str):
        data['metadata'] = json.loads(data['metadata'])
    return data

@app.post("/facilities", response_model=Facility, status_code=201)
async def create_facility(facility: FacilityCreate):
    """Create a new facility"""
    query = """
        INSERT INTO facilities (name, type, max_power, active_start_time, active_end_time, metadata, current_charge_kwh)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, type, max_power, active_start_time, active_end_time, metadata, current_charge_kwh, created_at
    """
    row = await db.fetch_one(
        query,
        facility.name,
        facility.type,
        facility.max_power,
        facility.active_start_time,
        facility.active_end_time,
        facility.metadata,
        facility.current_charge_kwh
    )
    return dict(row)

@app.delete("/facilities/{facility_id}", status_code=200)
async def delete_facility(facility_id: int):
    """Delete a facility by ID (also deletes all associated timeseries data via CASCADE)"""
    # Check if facility exists
    check_query = "SELECT id, name FROM facilities WHERE id = $1"
    facility = await db.fetch_one(check_query, facility_id)

    if not facility:
        raise HTTPException(status_code=404, detail=f"Facility with id {facility_id} not found")

    # Delete facility (CASCADE will automatically delete timeseries data)
    delete_query = "DELETE FROM facilities WHERE id = $1"
    await db.execute(delete_query, facility_id)

    return {
        "message": f"Facility '{facility['name']}' (id: {facility_id}) deleted successfully",
        "deleted_facility_id": facility_id,
        "deleted_facility_name": facility['name']
    }

# Timeseries endpoints
@app.post("/timeseries/bulk", status_code=201)
async def create_timeseries_bulk(data: TimeseriesBulkCreate):
    """Bulk insert timeseries data for multiple facilities at a specific timestamp"""
    query = """
        INSERT INTO timeseries (facility_id, timestamp, power_value)
        VALUES ($1, $2, $3)
    """
    args_list = [
        (entry.facility_id, data.timestamp, entry.power_value)
        for entry in data.entries
    ]

    await db.execute_many(query, args_list)
    return {"message": f"Inserted {len(args_list)} timeseries entries", "timestamp": data.timestamp}

@app.get("/timeseries", response_model=List[Timeseries])
async def get_timeseries(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    facility_ids: Optional[str] = Query(None, description="Comma-separated facility IDs")
):
    """Get timeseries data with optional filters (caps end_time at current moment if in future)"""
    query_parts = ["SELECT id, facility_id, timestamp, power_value, stored_energy_kwh, created_at FROM timeseries WHERE 1=1"]
    params = []
    param_count = 0

    if start_time:
        param_count += 1
        query_parts.append(f"AND timestamp >= ${param_count}")
        # Remove timezone info to match naive timestamps in database
        params.append(start_time.replace(tzinfo=None) if start_time.tzinfo else start_time)

    if end_time:
        param_count += 1
        query_parts.append(f"AND timestamp <= ${param_count}")
        # Remove timezone info and cap at current time to prevent future data
        end_time_naive = end_time.replace(tzinfo=None) if end_time.tzinfo else end_time
        now = datetime.now()
        capped_end_time = min(end_time_naive, now)
        params.append(capped_end_time)

    if facility_ids:
        ids = [int(id.strip()) for id in facility_ids.split(",")]
        param_count += 1
        query_parts.append(f"AND facility_id = ANY(${param_count})")
        params.append(ids)

    query_parts.append("ORDER BY timestamp, facility_id")
    query = " ".join(query_parts)

    rows = await db.fetch_all(query, *params)
    return [dict(row) for row in rows]

@app.post("/seed-timeseries")
async def seed_timeseries_data():
    """Generate 2 months of seed timeseries data (1 month past + 1 month future) with 1-minute intervals"""
    # Get all facilities
    facilities = await db.fetch_all("SELECT id, type, max_power, active_start_time, active_end_time, name, current_charge_kwh, metadata FROM facilities")

    # Generate data for 2 months: 1 month before now, 1 month after now
    now = datetime.now().replace(second=0, microsecond=0)
    start_time = now - timedelta(days=30)
    end_time = now + timedelta(days=30)
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
            facility_name = facility['name']

            # Determine if facility is active
            current_hour_minute = current_time.time()
            is_active = True

            if active_start and active_end:
                is_active = active_start <= current_hour_minute <= active_end

            if not is_active:
                power_value = 0.0
            elif facility_type == 'producer':
                if 'Solar' in facility_name:
                    hour = current_time.hour
                    minute = current_time.minute
                    if 6 <= hour <= 20:
                        hours_from_sunrise = (hour - 6) + (minute / 60.0)
                        solar_factor = math.sin((hours_from_sunrise / 14) * math.pi)
                        power_value = abs(max_power) * solar_factor * random.uniform(0.85, 1.0)
                    else:
                        power_value = 0.0
                elif 'Wind' in facility_name:
                    power_value = abs(max_power) * random.uniform(0.3, 0.95)
                else:
                    power_value = abs(max_power) * random.uniform(0.7, 1.0)

                total_production += power_value

            elif facility_type == 'consumer':
                hour = current_time.hour
                if 'Kitchen' in facility_name:
                    if 7 <= hour <= 9 or 12 <= hour <= 13 or 18 <= hour <= 20:
                        power_value = max_power * random.uniform(0.8, 1.0)
                    else:
                        power_value = max_power * random.uniform(0.3, 0.5)
                elif 'Living Room' in facility_name or 'Office' in facility_name:
                    if 17 <= hour <= 23:
                        power_value = max_power * random.uniform(0.7, 1.0)
                    elif 8 <= hour <= 17:
                        power_value = max_power * random.uniform(0.4, 0.6)
                    else:
                        power_value = max_power * random.uniform(0.1, 0.3)
                elif 'Bedroom' in facility_name:
                    if 22 <= hour or hour <= 7:
                        power_value = max_power * random.uniform(0.6, 0.9)
                    else:
                        power_value = max_power * random.uniform(0.2, 0.4)
                elif 'Bathroom' in facility_name:
                    if 6 <= hour <= 9 or 18 <= hour <= 22:
                        power_value = max_power * random.uniform(0.7, 1.0)
                    else:
                        power_value = max_power * random.uniform(0.2, 0.4)
                else:
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
                    # Excess production: CHARGE the battery
                    charge_power = min(abs(max_power), net_balance * 0.7)
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
                    # Deficit: DISCHARGE the battery
                    discharge_power = min(abs(max_power), abs(net_balance) * 0.7)
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
    await db.execute_many(
        "INSERT INTO timeseries (facility_id, timestamp, power_value, stored_energy_kwh) VALUES ($1, $2, $3, $4)",
        timeseries_data
    )

    # Update final charge levels for accumulators
    for facility_id, final_charge in accumulator_charges.items():
        await db.execute(
            "UPDATE facilities SET current_charge_kwh = $1 WHERE id = $2",
            round(final_charge, 2), facility_id
        )

    return {
        "message": "Seed data generated successfully",
        "records_inserted": len(timeseries_data),
        "facilities": len(facilities),
        "time_range": f"{start_time} to {end_time}",
        "accumulator_charges": {
            facility['name']: {
                "charge_kwh": round(accumulator_charges[facility['id']], 2),
                "capacity_kwh": facility['metadata'].get('capacity_kwh', 0),
                "percentage": round((accumulator_charges[facility['id']] / float(facility['metadata'].get('capacity_kwh', 1))) * 100, 1)
            }
            for facility in facilities if facility['type'] == 'accumulator'
        }
    }

@app.post("/reset-simulation")
async def reset_simulation():
    """Clear all timeseries data and regenerate with new random values"""
    try:
        # Delete all timeseries data
        await db.execute("DELETE FROM timeseries")

        # Reset accumulator charge levels to starting values
        await db.execute("""
            UPDATE facilities
            SET current_charge_kwh = CASE
                WHEN type = 'accumulator' THEN (metadata->>'capacity_kwh')::decimal / 2
                ELSE 0
            END
        """)

        # Get all facilities
        facilities = await db.fetch_all("SELECT id, type, max_power, active_start_time, active_end_time, name, current_charge_kwh, metadata FROM facilities")

        # Generate data for 2 months: 1 month before now, 1 month after now
        now = datetime.now().replace(second=0, microsecond=0)
        start_time = now - timedelta(days=30)
        end_time = now + timedelta(days=30)
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
                facility_name = facility['name']

                # Determine if facility is active
                current_hour_minute = current_time.time()
                is_active = True

                if active_start and active_end:
                    is_active = active_start <= current_hour_minute <= active_end

                if not is_active:
                    power_value = 0.0
                elif facility_type == 'producer':
                    if 'Solar' in facility_name:
                        hour = current_time.hour
                        minute = current_time.minute
                        if 6 <= hour <= 20:
                            hours_from_sunrise = (hour - 6) + (minute / 60.0)
                            solar_factor = math.sin((hours_from_sunrise / 14) * math.pi)
                            power_value = abs(max_power) * solar_factor * random.uniform(0.85, 1.0)
                        else:
                            power_value = 0.0
                    elif 'Wind' in facility_name:
                        power_value = abs(max_power) * random.uniform(0.3, 0.95)
                    else:
                        power_value = abs(max_power) * random.uniform(0.7, 1.0)

                    total_production += power_value

                elif facility_type == 'consumer':
                    hour = current_time.hour
                    if 'Kitchen' in facility_name:
                        if 7 <= hour <= 9 or 12 <= hour <= 13 or 18 <= hour <= 20:
                            power_value = max_power * random.uniform(0.8, 1.0)
                        else:
                            power_value = max_power * random.uniform(0.3, 0.5)
                    elif 'Living Room' in facility_name or 'Office' in facility_name:
                        if 17 <= hour <= 23:
                            power_value = max_power * random.uniform(0.7, 1.0)
                        elif 8 <= hour <= 17:
                            power_value = max_power * random.uniform(0.4, 0.6)
                        else:
                            power_value = max_power * random.uniform(0.1, 0.3)
                    elif 'Bedroom' in facility_name:
                        if 22 <= hour or hour <= 7:
                            power_value = max_power * random.uniform(0.6, 0.9)
                        else:
                            power_value = max_power * random.uniform(0.2, 0.4)
                    elif 'Bathroom' in facility_name:
                        if 6 <= hour <= 9 or 18 <= hour <= 22:
                            power_value = max_power * random.uniform(0.7, 1.0)
                        else:
                            power_value = max_power * random.uniform(0.2, 0.4)
                    else:
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
        await db.execute_many(
            "INSERT INTO timeseries (facility_id, timestamp, power_value, stored_energy_kwh) VALUES ($1, $2, $3, $4)",
            timeseries_data
        )

        # Update final charge levels for accumulators
        for facility_id, final_charge in accumulator_charges.items():
            await db.execute(
                "UPDATE facilities SET current_charge_kwh = $1 WHERE id = $2",
                round(final_charge, 2), facility_id
            )

        return {
            "message": "Simulation reset successfully - new data generated",
            "records_inserted": len(timeseries_data),
            "facilities": len(facilities),
            "time_range": f"{start_time} to {end_time}",
            "accumulator_charges": {
                facility['name']: {
                    "charge_kwh": round(accumulator_charges[facility['id']], 2),
                    "capacity_kwh": facility['metadata'].get('capacity_kwh', 0),
                    "percentage": round((accumulator_charges[facility['id']] / float(facility['metadata'].get('capacity_kwh', 1))) * 100, 1)
                }
                for facility in facilities if facility['type'] == 'accumulator'
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset simulation: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "Energy Management API",
        "version": "1.0.0",
        "endpoints": {
            "facilities": "/facilities",
            "facility_by_id": "/facilities/{id}",
            "create_facility": "POST /facilities",
            "delete_facility": "DELETE /facilities/{id}",
            "bulk_timeseries": "POST /timeseries/bulk",
            "query_timeseries": "/timeseries?start_time=&end_time=&facility_ids=",
            "seed_data": "POST /seed-timeseries",
            "reset_simulation": "POST /reset-simulation"
        }
    }
