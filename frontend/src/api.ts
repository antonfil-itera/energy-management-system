const API_BASE = '/api';

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

export const fetchFacilities = async (): Promise<Facility[]> => {
  const response = await fetch(`${API_BASE}/facilities`);
  if (!response.ok) throw new Error('Failed to fetch facilities');
  return response.json();
};

export const fetchTimeseries = async (
  startTime?: Date,
  endTime?: Date,
  facilityIds?: number[],
  limit?: number
): Promise<TimeseriesData[]> => {
  let url = `${API_BASE}/timeseries?`;

  if (startTime) {
    url += `start_time=${startTime.toISOString()}&`;
  }
  if (endTime) {
    url += `end_time=${endTime.toISOString()}&`;
  }
  if (facilityIds && facilityIds.length > 0) {
    url += `facility_ids=${facilityIds.join(',')}&`;
  }
  if (limit) {
    url += `limit=${limit}&`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch timeseries');
  return response.json();
};
