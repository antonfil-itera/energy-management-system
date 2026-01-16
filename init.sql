-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('producer', 'consumer', 'accumulator')),
    max_power DECIMAL(10, 2) NOT NULL,
    active_start_time TIME,
    active_end_time TIME,
    metadata JSONB DEFAULT '{}'::jsonb,
    current_charge_kwh DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create timeseries table
CREATE TABLE IF NOT EXISTS timeseries (
    id BIGSERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    power_value DECIMAL(10, 2) NOT NULL,
    stored_energy_kwh DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_timeseries_facility_id ON timeseries(facility_id);
CREATE INDEX IF NOT EXISTS idx_timeseries_timestamp ON timeseries(timestamp);
CREATE INDEX IF NOT EXISTS idx_timeseries_facility_timestamp ON timeseries(facility_id, timestamp);

-- Insert seed facilities (household simulation)
INSERT INTO facilities (name, type, max_power, active_start_time, active_end_time, metadata, current_charge_kwh) VALUES
-- Producers (Solar stations 5-125 kW)
('Roof Solar Panel Small', 'producer', 5.00, '06:00:00', '20:00:00', '{"location": "Small House Roof", "panel_count": 12, "type": "residential"}', 0),
('Roof Solar Panel Medium', 'producer', 15.00, '06:00:00', '20:00:00', '{"location": "Medium House Roof", "panel_count": 35, "type": "residential"}', 0),
('Roof Solar Panel Large', 'producer', 30.00, '06:00:00', '20:00:00', '{"location": "Large House Roof", "panel_count": 70, "type": "residential"}', 0),
('Garden Solar Station', 'producer', 50.00, '06:00:00', '20:00:00', '{"location": "Backyard Ground", "panel_count": 120, "type": "ground_mounted"}', 0),
-- ('Community Solar Array', 'producer', 125.00, '06:00:00', '20:00:00', '{"location": "Community Park", "panel_count": 300, "type": "shared"}', 0),
-- Wind turbines (5-125 kW)
('Small Wind Turbine', 'producer', 10.00, NULL, NULL, '{"location": "Garden", "turbine_type": "vertical", "height_m": 10}', 0),
('Medium Wind Turbine', 'producer', 50.00, NULL, NULL, '{"location": "Roof Top", "turbine_type": "horizontal", "height_m": 15}', 0),
-- ('Large Wind Turbine', 'producer', 100.00, NULL, NULL, '{"location": "Property Edge", "turbine_type": "horizontal", "height_m": 25}', 0),
-- Consumers (household rooms and facilities)
('Living Room', 'consumer', -2.50, NULL, NULL, '{"devices": ["TV", "lighting", "AC"], "area_sqm": 40}', 0),
('Kitchen', 'consumer', -4.00, NULL, NULL, '{"devices": ["refrigerator", "stove", "microwave", "dishwasher"], "area_sqm": 20}', 0),
('Bedroom 1', 'consumer', -1.50, NULL, NULL, '{"devices": ["lighting", "heating", "electronics"], "area_sqm": 25}', 0),
('Bedroom 2', 'consumer', -1.50, NULL, NULL, '{"devices": ["lighting", "heating", "electronics"], "area_sqm": 25}', 0),
('Bathroom', 'consumer', -3.00, NULL, NULL, '{"devices": ["water_heater", "lighting", "ventilation"], "area_sqm": 15}', 0),
('Home Office', 'consumer', -2.00, NULL, NULL, '{"devices": ["computer", "lighting", "printer"], "area_sqm": 15}', 0),
('Garage Workshop', 'consumer', -3.50, '08:00:00', '22:00:00', '{"devices": ["tools", "lighting", "heater"], "area_sqm": 30}', 0),
('Garden Lighting', 'consumer', -0.50, '18:00:00', '06:00:00', '{"devices": ["outdoor_lights", "fountain_pump"], "area_sqm": 100}', 0),
('Pool System', 'consumer', -5.00, '06:00:00', '22:00:00', '{"devices": ["pump", "heater", "filter"], "volume_liters": 50000}', 0),
-- Accumulators (2-10 kWh storage)
('Home Battery Small', 'accumulator', 2.00, NULL, NULL, '{"capacity_kwh": 2, "efficiency": 0.92, "type": "lithium_ion"}', 1.00),
('Home Battery Medium', 'accumulator', 5.00, NULL, NULL, '{"capacity_kwh": 5, "efficiency": 0.94, "type": "lithium_ion"}', 2.50),
('Home Battery Large', 'accumulator', 8.00, NULL, NULL, '{"capacity_kwh": 8, "efficiency": 0.95, "type": "lithium_ion"}', 4.00),
('Powerwall System', 'accumulator', 10.00, NULL, NULL, '{"capacity_kwh": 10, "efficiency": 0.96, "type": "lithium_ion", "model": "powerwall"}', 5.00);
