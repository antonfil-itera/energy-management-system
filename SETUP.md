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

Load 2 months of timeseries data (1-minute intervals) for all household facilities:

```bash
docker-compose exec api python seed_data.py
```

**Alternative using API endpoint:**
```bash
curl -X POST http://localhost:8000/seed-timeseries
```

**Or using browser:**
- Open http://localhost:8000/docs
- Find the `POST /seed-timeseries` endpoint
- Click "Try it out" → "Execute"

**Expected output:**
```
Found 19 facilities
Inserting 1641619 timeseries records...
✅ Seed data generation complete!
   - Time range: 2025-12-17 to 2026-02-15
   - Total records: 1641619
   - Records per facility: 86401

📊 Final accumulator charge levels:
   - Home Battery Small: 2.00 kWh / 2.00 kWh (100.0%)
   - Home Battery Medium: 5.00 kWh / 5.00 kWh (100.0%)
   - Home Battery Large: 8.00 kWh / 8.00 kWh (100.0%)
   - Powerwall System: 10.00 kWh / 10.00 kWh (100.0%)
```

**Note:** This process takes about 30 seconds as it generates 1.6 million data points.

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
- Displays energy data with time range controls (Last 24 Hours, Last Week, Last Month)
- Y-axis: Power in kilowatts (kW)
- X-axis: Time

### Facilities Legend (Right Panel)
- **Green ⚡**: Producers (Solar panels, Wind turbines)
- **Red 🏭**: Consumers (Kitchen, Living Room, Bedrooms, etc.)
- **Blue 🔋**: Accumulators (Home batteries with charge percentage bars)
- Shows average power for each facility
- Click any facility to view detailed chart

### Facility Details
- Click any facility in the legend to view its individual chart
- For accumulators: Dual-axis chart showing power flow (kW) and stored energy (kWh)
- Battery status card displays current charge and percentage
- See statistics: Average, Max, Min power
- Click "← Back to Global View" to return

### Time Range Controls
- **Last 24 Hours**: Shows recent day of data
- **Last Week**: Shows past 7 days
- **Last Month**: Shows past 30 days
- All time ranges automatically cap at current moment (no future data displayed)

## Available Facilities

The system comes with 19 pre-configured household facilities simulating a realistic home energy system:

### Producers (6 facilities)
1. **Roof Solar Panel Small** - 5 kW, 12 panels (active 6:00-20:00)
2. **Roof Solar Panel Medium** - 15 kW, 35 panels (active 6:00-20:00)
3. **Roof Solar Panel Large** - 30 kW, 70 panels (active 6:00-20:00)
4. **Garden Solar Station** - 50 kW, 120 panels (active 6:00-20:00)
5. **Small Wind Turbine** - 10 kW, vertical axis (24/7)
6. **Medium Wind Turbine** - 50 kW, horizontal axis (24/7)

### Consumers (9 facilities)
1. **Living Room** - 2.5 kW (TV, lighting, AC)
2. **Kitchen** - 4.0 kW (refrigerator, stove, microwave, dishwasher)
3. **Bedroom 1** - 1.5 kW (lighting, heating, electronics)
4. **Bedroom 2** - 1.5 kW (lighting, heating, electronics)
5. **Bathroom** - 3.0 kW (water heater, lighting, ventilation)
6. **Home Office** - 2.0 kW (computer, lighting, printer)
7. **Garage Workshop** - 3.5 kW (tools, lighting, heater) - active 8:00-22:00
8. **Garden Lighting** - 0.5 kW (outdoor lights, fountain) - active 18:00-6:00
9. **Pool System** - 5.0 kW (pump, heater, filter) - active 6:00-22:00

### Accumulators (4 facilities)
1. **Home Battery Small** - 2 kWh / 2 kW (92% efficiency)
2. **Home Battery Medium** - 5 kWh / 5 kW (94% efficiency)
3. **Home Battery Large** - 8 kWh / 8 kW (95% efficiency)
4. **Powerwall System** - 10 kWh / 10 kW (96% efficiency)

Batteries automatically charge when production exceeds consumption and discharge when consumption exceeds production.

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

If the docker exec command doesn't work, try using the API endpoint:

**Using curl:**
```bash
curl -X POST http://localhost:8000/seed-timeseries
```

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Method POST -Uri http://localhost:8000/seed-timeseries
```

**Or use the browser method** (see Step 6 alternative)

### Reset Simulation

If you want to clear all timeseries data and regenerate with new random values:

```bash
curl -X POST http://localhost:8000/reset-simulation
```

This is useful for testing different energy scenarios.

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
5. Add new facilities via API (POST /facilities)
6. Delete facilities to simulate system changes (DELETE /facilities/{id})
7. Reset simulation to test different scenarios (POST /reset-simulation)

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
# 3. Wait 15 seconds, then generate data
docker-compose exec api python seed_data.py
# 4. Open browser to http://localhost:3000
```
