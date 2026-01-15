# Energy Management System - Setup Instructions

Complete step-by-step guide to get the Energy Management System running on your machine.

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Docker Desktop** (includes Docker Compose)
   - **Windows/Mac**: Download from https://www.docker.com/products/docker-desktop
   - **Linux**: Install Docker Engine and Docker Compose separately
     ```bash
     # Docker Engine
     curl -fsSL https://get.docker.com -o get-docker.sh
     sudo sh get-docker.sh

     # Docker Compose
     sudo apt-get install docker-compose-plugin
     ```
   - Verify installation:
     ```bash
     docker --version
     docker-compose --version
     ```

2. **Git** (optional, if cloning from repository)
   - Download from https://git-scm.com/downloads
   - Verify installation:
     ```bash
     git --version
     ```

## Installation Steps

### Step 1: Get the Project Files

If you have the project as a ZIP file:
```bash
# Extract the ZIP file to your desired location
# Navigate to the extracted directory
cd energy
```

If cloning from a repository:
```bash
git clone <repository-url>
cd energy
```

### Step 2: Verify Project Structure

Ensure your project directory contains these files:
```
energy/
├── docker-compose.yml
├── Dockerfile
├── init.sql
├── requirements.txt
├── seed_data.py
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   └── models.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        └── components/
```

### Step 3: Start Docker Desktop

- **Windows/Mac**: Open Docker Desktop application and wait until it's fully started (whale icon in system tray should be steady)
- **Linux**: Ensure Docker daemon is running:
  ```bash
  sudo systemctl start docker
  ```

### Step 4: Build and Start Services

Open a terminal in the project directory and run:

```bash
docker-compose up -d --build
```

**What this does:**
- Builds the API and frontend Docker images
- Starts PostgreSQL database
- Starts FastAPI backend
- Starts React frontend
- Creates the database schema and seeds 10 facilities

**Expected output:**
```
Creating network "energy_default" with the default driver
Creating volume "energy_postgres_data" with default driver
Building api...
Building frontend...
Creating energy-postgres-1 ... done
Creating energy-api-1      ... done
Creating energy-frontend-1 ... done
```

**Time:** First build takes 3-5 minutes (downloads images and installs dependencies)

### Step 5: Wait for Services to Initialize

Wait approximately 10-15 seconds for all services to be ready. You can check the status:

```bash
docker-compose ps
```

**Expected output:**
```
NAME                 STATUS              PORTS
energy-api-1         Up 20 seconds      0.0.0.0:8000->8000/tcp
energy-frontend-1    Up 20 seconds      0.0.0.0:3000->3000/tcp
energy-postgres-1    Up 25 seconds (healthy)  0.0.0.0:5432->5432/tcp
```

All containers should show "Up" status and postgres should show "(healthy)".

### Step 6: Generate Seed Data

Load 24 hours of timeseries data for all facilities:

```bash
curl -X POST http://localhost:8000/seed-timeseries
```

**Alternative using browser:**
- Open http://localhost:8000/docs
- Find the `POST /seed-timeseries` endpoint
- Click "Try it out" → "Execute"

**Expected response:**
```json
{
  "message": "Seed data generated successfully",
  "records_inserted": 2890,
  "facilities": 10,
  "time_range": "2026-01-14 09:00:00 to 2026-01-15 09:00:00"
}
```

### Step 7: Access the Application

Open your web browser and navigate to:

**Main Dashboard:**
```
http://localhost:3000
```

**API Documentation:**
```
http://localhost:8000/docs
```

**Direct API:**
```
http://localhost:8000
```

## Using the Dashboard

### Global View
- Shows aggregated production (green line) vs consumption (red line)
- Displays 24 hours of energy data
- Y-axis: Power in kilowatts (kW)
- X-axis: Time

### Facilities Legend (Right Panel)
- **Green ⚡**: Producers (Solar farms, Wind turbines)
- **Red 🏭**: Consumers (Factories, Residential)
- **Blue 🔋**: Accumulators (Battery storage, Hydro storage)
- Shows average power for each facility

### Facility Details
- Click any facility in the legend
- View individual power chart
- See statistics: Average, Max, Min power
- Click "← Back to Global View" to return

## Available Facilities

The system comes with 10 pre-configured facilities:

1. **Solar Farm A** - 500 kW (active 6:00-20:00)
2. **Solar Farm B** - 300 kW (active 6:00-20:00)
3. **Wind Turbine 1** - 800 kW (24/7)
4. **Wind Turbine 2** - 800 kW (24/7)
5. **Factory A** - 1200 kW consumption (active 8:00-18:00)
6. **Factory B** - 800 kW consumption (24/7)
7. **Residential Area** - 500 kW consumption (peaks morning/evening)
8. **Battery Storage 1** - 400 kW capacity
9. **Battery Storage 2** - 600 kW capacity
10. **Hydro Pump Storage** - 1000 kW capacity

## Troubleshooting

### Port Already in Use

If you see errors about ports 3000, 8000, or 5432 being in use:

```bash
# Check what's using the port (example for port 8000)
# Windows
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :8000

# Stop the conflicting service or change ports in docker-compose.yml
```

### Containers Won't Start

```bash
# View logs
docker-compose logs api
docker-compose logs frontend
docker-compose logs postgres

# Restart services
docker-compose restart

# Full reset (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d --build
```

### Database Connection Errors

```bash
# Ensure postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Frontend Shows "Loading..." Forever

```bash
# Check if API is responding
curl http://localhost:8000/facilities

# If empty response, regenerate seed data
curl -X POST http://localhost:8000/seed-timeseries

# Check frontend logs
docker-compose logs frontend
```

### Seed Data Command Fails

If the curl command doesn't work:

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Method POST -Uri http://localhost:8000/seed-timeseries
```

**Or use the browser method** (see Step 6 alternative)

## Stopping the System

### Stop services (keeps data)
```bash
docker-compose stop
```

### Stop and remove containers (keeps data)
```bash
docker-compose down
```

### Stop and remove everything including data
```bash
docker-compose down -v
```

## Restarting After Stopping

If you previously ran the system and want to start it again:

```bash
# Start existing containers
docker-compose start

# Or rebuild and start
docker-compose up -d
```

**Note:** If you used `docker-compose down -v`, you'll need to regenerate seed data (Step 6).

## Useful Commands

### View all logs in real-time
```bash
docker-compose logs -f
```

### View specific service logs
```bash
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Access database directly
```bash
docker-compose exec postgres psql -U energy_user -d energy_db

# Example queries:
# SELECT COUNT(*) FROM facilities;
# SELECT COUNT(*) FROM timeseries;
# \q (to quit)
```

### Check API health
```bash
curl http://localhost:8000/
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

## System Requirements

- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 2GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **Network**: Internet connection for initial Docker image downloads

## Next Steps

Once the system is running:

1. Explore the dashboard at http://localhost:3000
2. View API documentation at http://localhost:8000/docs
3. Try querying specific facilities
4. Create custom API requests using the documentation
5. Add new facilities via API

## Support

If you encounter issues not covered in troubleshooting:

1. Check all three services are running: `docker-compose ps`
2. Review logs: `docker-compose logs`
3. Ensure Docker Desktop has enough resources (Settings → Resources)
4. Try a full reset: `docker-compose down -v && docker-compose up -d --build`

---

**Quick Start Summary:**
```bash
# 1. Install Docker Desktop
# 2. Open terminal in project directory
docker-compose up -d --build
# 3. Wait 15 seconds
curl -X POST http://localhost:8000/seed-timeseries
# 4. Open browser to http://localhost:3000
```
