# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Energy Management System with API and web dashboard for tracking electricity producers, consumers, and accumulators with timeseries data. Built with FastAPI (backend), React (frontend), PostgreSQL (database), and Docker.

## Development Commands

**Start the system:**

```bash
docker-compose up -d
```

**Load seed data (2 months with 1-minute intervals for household simulation):**

```bash
docker-compose exec api python seed_data.py
```

**Reset simulation (clear all timeseries and regenerate):**

```bash
curl -X POST http://localhost:8000/reset-simulation
```

**Access services:**

- Frontend Dashboard: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

**Stop and clean up:**

```bash
docker-compose down      # Stop services
docker-compose down -v   # Stop and remove all data
```

**View logs:**

```bash
docker-compose logs -f frontend  # Frontend logs
docker-compose logs -f api       # API logs
docker-compose logs -f postgres  # Database logs
```

**Access database directly:**

```bash
docker-compose exec postgres psql -U energy_user -d energy_db
```

**Rebuild after code changes:**

```bash
docker-compose up -d --build
```

## Architecture

### Database Layer

- **Connection pooling** via asyncpg (5-20 connections) in `app/database.py`
- **Database initialization** via `init.sql` mounted to postgres container entrypoint
- **Schema**: Two main tables - `facilities` and `timeseries`
- **Cascade deletion**: Deleting a facility automatically removes all associated timeseries data via `ON DELETE CASCADE`
- **Indexes**: Optimized for timeseries queries on `(facility_id, timestamp)`

### API Layer

- **FastAPI** application in `app/main.py` with async/await patterns
- **Models** in `app/models.py` use Pydantic for validation
- **Raw SQL queries** with asyncpg (no ORM) - use PostgreSQL parameterized queries with `$1, $2` syntax
- **Database singleton** `db` imported from `app.database` - initialized on app startup event
- **CORS enabled** for frontend access (allow all origins in development)
- **CRUD operations**: GET, POST, DELETE for facilities; GET for timeseries

### Frontend Layer

- **React + Vite** application in `frontend/` directory
- **Recharts** library for timeseries visualization
- **API proxy** configured in Vite to route `/api/*` requests to backend
- **Three main views**:
  - Global view: Aggregated production vs consumption chart
  - Facility view: Individual facility power chart with statistics
  - Battery view: Dual-axis chart showing power flow (kW) and stored energy (kWh)
- **Interactive legend**: Click facilities to filter and view individual charts
- **Time range controls**: Last 24 Hours, Last Week, Last Month buttons
- **Battery charge display**: Progress bars showing current charge percentage

### Data Model Conventions

- **Facility types**: Must be `'producer'`, `'consumer'`, or `'accumulator'`
- **Power values**:
    - Positive = producing/discharging power
    - Negative = consuming/charging power
    - Zero = facility inactive
- **Timeseries interval**: 1-minute intervals for 2 months (1 past + 1 future)
- **Active times**: Optional TIME fields for facilities with scheduled operations (solar panels, household rooms)
- **Metadata**: JSONB field for extensible facility properties (capacity_kwh, efficiency for accumulators)
- **Stored energy**: Tracked in `stored_energy_kwh` column for accumulators only

### Seed Data Script

`seed_data.py` connects directly to PostgreSQL (not via API) and generates realistic household energy system patterns:

#### Three-Pass System Balance Algorithm

The seed data generator simulates a realistic connected electrical circuit using a three-pass approach:

**Pass 1: Calculate Production and Consumption**
- Solar panels: Peak at noon using sine wave (6:00-20:00), 5-125 kW
- Wind turbines: Variable output (5-125 kW), 24/7
- Household rooms: Different consumption patterns per room type
  - Kitchen: Peaks at meal times (7-9, 12-13, 18-20)
  - Living rooms: Peak in evenings (17-23)
  - Bedrooms: Peak at night (22-7)
  - Bathrooms: Peak morning/evening (6-9, 18-22)
- Calculate `total_production` and `total_consumption`

**Pass 2: Accumulator Response to System Balance**
- Calculate `net_balance = total_production - total_consumption`
- If `net_balance > 0` (excess production): Batteries CHARGE at maximum power rate
- If `net_balance < 0` (deficit): Batteries DISCHARGE at maximum power rate
- If balanced: Batteries idle
- Accumulators act like real physical devices with fixed max charge/discharge rates
- Capacity limits enforced: Stop charging when full, stop discharging when empty

**Pass 3: Store Data**
- Store all power values and accumulated stored_energy_kwh for each facility
- Update facility current_charge_kwh in database

This creates realistic behavior where batteries actively respond to grid imbalance rather than following fixed schedules.

## Key Implementation Details

- All database queries use PostgreSQL-style parameterized queries (`$1, $2` not `?`)
- The `db` object is a singleton initialized on FastAPI startup - do not instantiate new Database objects
- The API uses `asyncpg.Record` objects which are dict-like - convert to `dict()` before returning
- Bulk timeseries insertion uses `execute_many()` for performance (1.6M+ records for 2 months)
- The timeseries GET endpoint builds dynamic queries with proper parameter counting
- Database is initialized via Docker entrypoint - `init.sql` runs automatically on first container start
- Energy calculations: Power (kW) × Time (1/60 hour) × Efficiency = Energy (kWh)
- Charging efficiency applied when storing energy, discharging efficiency when retrieving
- Frontend caps end_time at current moment to prevent displaying future data
- Facility deletion cascades to timeseries data automatically via database constraints
