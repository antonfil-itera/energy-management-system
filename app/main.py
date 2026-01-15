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
        SELECT id, name, type, max_power, active_start_time, active_end_time, metadata, created_at
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
        SELECT id, name, type, max_power, active_start_time, active_end_time, metadata, created_at
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
        INSERT INTO facilities (name, type, max_power, active_start_time, active_end_time, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, type, max_power, active_start_time, active_end_time, metadata, created_at
    """
    row = await db.fetch_one(
        query,
        facility.name,
        facility.type,
        facility.max_power,
        facility.active_start_time,
        facility.active_end_time,
        facility.metadata
    )
    return dict(row)

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
    """Get timeseries data with optional filters"""
    query_parts = ["SELECT id, facility_id, timestamp, power_value, created_at FROM timeseries WHERE 1=1"]
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
        # Remove timezone info to match naive timestamps in database
        params.append(end_time.replace(tzinfo=None) if end_time.tzinfo else end_time)

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
    """Generate 24 hours of seed timeseries data for all facilities"""
    # Get all facilities
    facilities = await db.fetch_all("SELECT id, type, max_power, active_start_time, active_end_time, name FROM facilities")

    # Generate data for the last 24 hours
    end_time = datetime.now().replace(second=0, microsecond=0)
    start_time = end_time - timedelta(hours=24)
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
            facility_name = facility['name']

            # Determine if facility is active
            current_hour_minute = current_time.time()
            is_active = True

            if active_start and active_end:
                is_active = active_start <= current_hour_minute <= active_end

            if not is_active:
                power_value = 0.0
            else:
                if facility_type == 'producer':
                    if 'Solar' in facility_name:
                        hour = current_time.hour
                        if 6 <= hour <= 20:
                            hours_from_sunrise = hour - 6
                            solar_factor = math.sin((hours_from_sunrise / 14) * math.pi)
                            power_value = abs(max_power) * solar_factor * random.uniform(0.85, 1.0)
                        else:
                            power_value = 0.0
                    elif 'Wind' in facility_name:
                        power_value = abs(max_power) * random.uniform(0.3, 0.95)
                    else:
                        power_value = abs(max_power) * random.uniform(0.7, 1.0)

                elif facility_type == 'consumer':
                    if 'Factory' in facility_name:
                        power_value = max_power * random.uniform(0.8, 1.0)
                    elif 'Residential' in facility_name:
                        hour = current_time.hour
                        if 6 <= hour <= 9 or 17 <= hour <= 23:
                            power_value = max_power * random.uniform(0.7, 1.0)
                        else:
                            power_value = max_power * random.uniform(0.3, 0.6)
                    else:
                        power_value = max_power * random.uniform(0.6, 0.9)

                elif facility_type == 'accumulator':
                    hour = current_time.hour
                    if 10 <= hour <= 16:
                        power_value = -abs(max_power) * random.uniform(0.5, 0.8)
                    elif 18 <= hour <= 22:
                        power_value = abs(max_power) * random.uniform(0.5, 0.8)
                    else:
                        power_value = random.choice([0.0, 0.0, random.uniform(-0.1, 0.1) * abs(max_power)])
                else:
                    power_value = 0.0

            timeseries_data.append((facility_id, current_time, round(power_value, 2)))

        current_time += interval

    # Bulk insert
    await db.execute_many(
        "INSERT INTO timeseries (facility_id, timestamp, power_value) VALUES ($1, $2, $3)",
        timeseries_data
    )

    return {
        "message": "Seed data generated successfully",
        "records_inserted": len(timeseries_data),
        "facilities": len(facilities),
        "time_range": f"{start_time} to {end_time}"
    }

@app.get("/")
async def root():
    return {
        "message": "Energy Management API",
        "version": "1.0.0",
        "endpoints": {
            "facilities": "/facilities",
            "facility_by_id": "/facilities/{id}",
            "create_facility": "POST /facilities",
            "bulk_timeseries": "POST /timeseries/bulk",
            "query_timeseries": "/timeseries?start_time=&end_time=&facility_ids=",
            "seed_data": "POST /seed-timeseries"
        }
    }
