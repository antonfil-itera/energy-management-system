export type TimePeriod = 'day' | 'week' | 'month';

export type EnergySource = 'solar' | 'wind';
export type ConsumptionDevice = 'elevator' | 'refrigerator' | 'hvac' | 'lighting' | 'freezer';
export type AccumulationDevice = 'battery';

export interface EnergyDataPoint {
  timestamp: Date;
  solar: number;
  wind: number;
  elevator: number;
  refrigerator: number;
  hvac: number;
  lighting: number;
  freezer: number;
  battery: number;
}

export interface AggregatedData {
  solar: number;
  wind: number;
  elevator: number;
  refrigerator: number;
  hvac: number;
  lighting: number;
  freezer: number;
  battery: number;
}

// Backend API types
export interface Facility {
  id: number;
  name: string;
  type: 'producer' | 'consumer' | 'accumulator';
  max_power: number;
  active_start_time?: string;
  active_end_time?: string;
  metadata?: {
    capacity_kwh?: number;
    [key: string]: any;
  };
  current_charge_kwh?: number;
  created_at: string;
}

export interface TimeseriesData {
  id: number;
  facility_id: number;
  timestamp: string;
  power_value: number;
  stored_energy_kwh?: number;
  created_at: string;
}
