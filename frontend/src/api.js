const API_BASE = '/api';

export const fetchFacilities = async () => {
  const response = await fetch(`${API_BASE}/facilities`);
  if (!response.ok) throw new Error('Failed to fetch facilities');
  return response.json();
};

export const fetchTimeseries = async (startTime, endTime, facilityIds = null) => {
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

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch timeseries');
  return response.json();
};
