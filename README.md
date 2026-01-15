# Energy Management System

Full-stack application with API and web dashboard for managing electricity producers, consumers, and accumulators with timeseries data tracking.

## Quick Start

1. Start the system:
```bash
docker-compose up -d
```

2. Wait for services to be ready (~10 seconds)

3. Load seed data (24 hours of data for 10 facilities):
```bash
docker-compose exec api python seed_data.py
```

4. Access the application:
- **Web Dashboard**: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Endpoints

### Facilities
- `GET /facilities` - List all facilities
- `GET /facilities/{id}` - Get facility by ID
- `POST /facilities` - Create new facility

### Timeseries
- `POST /timeseries/bulk` - Bulk insert timeseries data
- `GET /timeseries?start_time=&end_time=&facility_ids=` - Query timeseries

## Example Requests

### Get all facilities
```bash
curl http://localhost:8000/facilities
```

### Get timeseries for last 2 hours
```bash
curl "http://localhost:8000/timeseries?start_time=2024-01-15T10:00:00&end_time=2024-01-15T12:00:00"
```

### Get timeseries for specific facilities
```bash
curl "http://localhost:8000/timeseries?facility_ids=1,2,3"
```

### Bulk insert timeseries
```bash
curl -X POST http://localhost:8000/timeseries/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-01-15T12:00:00",
    "entries": [
      {"facility_id": 1, "power_value": 450.5},
      {"facility_id": 2, "power_value": -320.0}
    ]
  }'
```

## Features

### Web Dashboard
- **Global Overview**: Combined production vs consumption chart for all facilities
- **Facility Details**: Click any facility to view individual power chart with statistics
- **Interactive Legend**: Color-coded facilities by type (producer, consumer, accumulator)
- **Real-time Data**: Displays 24 hours of timeseries data at 5-minute intervals

### Database Schema

**Facilities**
- 10 pre-seeded facilities (solar farms, wind turbines, factories, residential, battery storage)
- Fields: id, name, type, max_power, active_start_time, active_end_time, metadata

**Timeseries**
- 5-minute interval data
- Fields: id, facility_id, timestamp, power_value
- Power value: positive (producing), negative (consuming), 0 (inactive)

## Stopping the System

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```
