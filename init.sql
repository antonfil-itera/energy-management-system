-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('producer', 'consumer', 'accumulator')),
    max_power DECIMAL(10, 2) NOT NULL,
    active_start_time TIME,
    active_end_time TIME,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create timeseries table
CREATE TABLE IF NOT EXISTS timeseries (
    id BIGSERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    power_value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_timeseries_facility_id ON timeseries(facility_id);
CREATE INDEX IF NOT EXISTS idx_timeseries_timestamp ON timeseries(timestamp);
CREATE INDEX IF NOT EXISTS idx_timeseries_facility_timestamp ON timeseries(facility_id, timestamp);

-- Insert seed facilities
INSERT INTO facilities (name, type, max_power, active_start_time, active_end_time, metadata) VALUES
('Solar Farm A', 'producer', 500.00, '06:00:00', '20:00:00', '{"location": "North Field", "panel_count": 1000}'),
('Solar Farm B', 'producer', 300.00, '06:00:00', '20:00:00', '{"location": "South Field", "panel_count": 600}'),
('Wind Turbine 1', 'producer', 800.00, NULL, NULL, '{"location": "Hill Top", "turbine_type": "horizontal"}'),
('Wind Turbine 2', 'producer', 800.00, NULL, NULL, '{"location": "Coast", "turbine_type": "horizontal"}'),
('Factory A', 'consumer', -1200.00, '08:00:00', '18:00:00', '{"industry": "manufacturing", "shift": "day"}'),
('Factory B', 'consumer', -800.00, '00:00:00', '23:59:59', '{"industry": "processing", "shift": "24/7"}'),
('Residential Area', 'consumer', -500.00, NULL, NULL, '{"households": 200, "type": "residential"}'),
('Battery Storage 1', 'accumulator', 400.00, NULL, NULL, '{"capacity_kwh": 2000, "efficiency": 0.95}'),
('Battery Storage 2', 'accumulator', 600.00, NULL, NULL, '{"capacity_kwh": 3000, "efficiency": 0.96}'),
('Hydro Pump Storage', 'accumulator', 1000.00, NULL, NULL, '{"capacity_kwh": 10000, "type": "pumped_hydro"}');
