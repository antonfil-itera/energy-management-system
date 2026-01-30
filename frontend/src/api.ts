// const API_BASE = '/api';

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

// Cache for loaded data
let facilitiesCache: Facility[] | null = null;
let timeseriesCache: TimeseriesData[] | null = null;

// Use local JSON data from public folder
export const fetchFacilities = async (): Promise<Facility[]> => {
  if (facilitiesCache) return facilitiesCache;
  
  const response = await fetch('/data/facilities.json');
  if (!response.ok) throw new Error('Failed to load facilities data');
  
  const data = await response.json();
  facilitiesCache = data.map((f: any) => ({
    ...f,
    max_power: parseFloat(f.max_power),
    current_charge_kwh: f.current_charge_kwh ? parseFloat(f.current_charge_kwh) : undefined
  })) as Facility[];
  
  return facilitiesCache;
};

export const fetchTimeseries = async (
  startTime?: Date,
  endTime?: Date,
  facilityIds?: number[],
  limit?: number
): Promise<TimeseriesData[]> => {
  // Load from cache or fetch
  if (!timeseriesCache) {
    const response = await fetch('/data/timeseries.json');
    if (!response.ok) throw new Error('Failed to load timeseries data');
    timeseriesCache = await response.json();
  }
  
  let filtered = timeseriesCache as TimeseriesData[];

  // Filter by time range
  if (startTime) {
    filtered = filtered.filter(d => new Date(d.timestamp) >= startTime);
  }
  if (endTime) {
    filtered = filtered.filter(d => new Date(d.timestamp) <= endTime);
  }

  // Filter by facility IDs
  if (facilityIds && facilityIds.length > 0) {
    filtered = filtered.filter(d => facilityIds.includes(d.facility_id));
  }

  // Apply limit
  if (limit && filtered.length > limit) {
    const step = Math.ceil(filtered.length / limit);
    filtered = filtered.filter((_, index) => index % step === 0);
  }

  return filtered;
};
