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
