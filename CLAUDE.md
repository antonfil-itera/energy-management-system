# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Energy Management System with API and web dashboard for tracking electricity producers, consumers, and accumulators with timeseries data. Built with FastAPI (backend), React (frontend), PostgreSQL (database), and Docker.

## Development Commands

**Start the system:**

```bash
docker-compose up -d
```

**Load seed data (24 hours for 10 facilities):**

```bash
docker-compose exec api python seed_data.py
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
- **Indexes**: Optimized for timeseries queries on `(facility_id, timestamp)`

### API Layer

- **FastAPI** application in `app/main.py` with async/await patterns
- **Models** in `app/models.py` use Pydantic for validation
- **Raw SQL queries** with asyncpg (no ORM) - use PostgreSQL parameterized queries with `$1, $2` syntax
- **Database singleton** `db` imported from `app.database` - initialized on app startup event
- **CORS enabled** for frontend access (allow all origins in development)

### Frontend Layer

- **React + Vite** application in `frontend/` directory
- **Recharts** library for timeseries visualization
- **API proxy** configured in Vite to route `/api/*` requests to backend
- **Two main views**:
  - Global view: Aggregated production vs consumption chart
  - Facility view: Individual facility power chart with statistics
- **Interactive legend**: Click facilities to filter and view individual charts

### Data Model Conventions

- **Facility types**: Must be `'producer'`, `'consumer'`, or `'accumulator'`
- **Power values**:
    - Positive = producing power
    - Negative = consuming power
    - Zero = facility inactive
- **Timeseries interval**: Expected at 5-minute intervals
- **Active times**: Optional TIME fields for facilities with scheduled operations (solar, factories)
- **Metadata**: JSONB field for extensible facility properties

### Seed Data Script

`seed_data.py` connects directly to PostgreSQL (not via API) and generates realistic patterns:

- Solar facilities peak at noon using sine wave
- Wind turbines have variable output
- Residential consumption peaks morning/evening
- Accumulators charge during solar peak, discharge during evening demand

## Key Implementation Details

- All database queries use PostgreSQL-style parameterized queries (`$1, $2` not `?`)
- The `db` object is a singleton initialized on FastAPI startup - do not instantiate new Database objects
- The API uses `asyncpg.Record` objects which are dict-like - convert to `dict()` before returning
- Bulk timeseries insertion uses `execute_many()` for performance
- The timeseries GET endpoint builds dynamic queries with proper parameter counting
- Database is initialized via Docker entrypoint - `init.sql` runs automatically on first container start
