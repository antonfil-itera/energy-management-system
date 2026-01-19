import type { Facility, TimeseriesData } from '../types';
import type { TimePeriod } from '../types';

interface TimeSeriesDataPoint {
  timestamp: Date;
  [facilityName: string]: Date | number;
}

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
}

/**
 * Sample data points to reduce rendering load
 * Aggregates data based on time period
 */
const sampleDataPoints = (
  dataPoints: TimeSeriesDataPoint[],
  period: TimePeriod,
  maxPoints: number = 100
): TimeSeriesDataPoint[] => {
  if (dataPoints.length <= maxPoints) return dataPoints;

  const samplingRate = Math.ceil(dataPoints.length / maxPoints);
  const sampled: TimeSeriesDataPoint[] = [];

  for (let i = 0; i < dataPoints.length; i += samplingRate) {
    // Get a slice of points to aggregate
    const slice = dataPoints.slice(i, i + samplingRate);
    if (slice.length === 0) continue;

    // Aggregate the slice by averaging values
    const aggregated: TimeSeriesDataPoint = {
      timestamp: slice[Math.floor(slice.length / 2)].timestamp, // Use middle timestamp
    };

    // Get all facility keys
    const facilityKeys = new Set<string>();
    slice.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'timestamp') facilityKeys.add(key);
      });
    });

    // Average each facility's values
    facilityKeys.forEach(facilityName => {
      const values = slice
        .map(point => point[facilityName])
        .filter(val => typeof val === 'number') as number[];
      
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        aggregated[facilityName] = Math.round(avg * 10) / 10;
      }
    });

    sampled.push(aggregated);
  }

  return sampled;
}

/**
 * Generate a color for a facility based on its type and index
 */
const getFacilityColor = (type: string, index: number): string => {
  const producerColors = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];
  const consumerColors = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', 
                          '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
                          '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
                          '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
                          '#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
  const accumulatorColors = ['#ec4899', '#db2777', '#be185d', '#9f1239', '#831843'];

  if (type === 'producer') return producerColors[index % producerColors.length];
  if (type === 'consumer') return consumerColors[index % consumerColors.length];
  if (type === 'accumulator') return accumulatorColors[index % accumulatorColors.length];
  return '#6b7280';
};

/**
 * Transform backend data to time series format with actual facility data
 */
export const transformBackendData = (
  facilities: Facility[],
  timeseriesData: TimeseriesData[],
  period?: TimePeriod
): TimeSeriesDataPoint[] => {
  // Group timeseries by timestamp
  const dataByTimestamp = new Map<string, Map<number, TimeseriesData>>();
  
  timeseriesData.forEach(entry => {
    if (!dataByTimestamp.has(entry.timestamp)) {
      dataByTimestamp.set(entry.timestamp, new Map());
    }
    dataByTimestamp.get(entry.timestamp)!.set(entry.facility_id, entry);
  });

  // Create facility mapping
  const facilityMap = new Map(facilities.map(f => [f.id, f]));

  // Transform each timestamp into a data point
  const dataPoints: TimeSeriesDataPoint[] = [];
  
  dataByTimestamp.forEach((facilityData, timestamp) => {
    const point: TimeSeriesDataPoint = {
      timestamp: new Date(timestamp),
    };

    facilityData.forEach((data, facilityId) => {
      const facility = facilityMap.get(facilityId);
      if (!facility) return;

      const powerValue = parseFloat(data.power_value.toString());
      
      // Use actual facility name as the key
      point[facility.name] = Math.round(Math.abs(powerValue) * 10) / 10;
    });

    dataPoints.push(point);
  });

  // Sort by timestamp
  const sorted = dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Sample data based on period to optimize rendering
  if (period) {
    const maxPoints = period === 'day' ? 150 : period === 'week' ? 100 : 80;
    return sampleDataPoints(sorted, period, maxPoints);
  }
  
  return sorted;
};

/**
 * Calculate totals for pie charts from actual facilities
 */
export const calculateTotalsFromBackend = (
  facilities: Facility[],
  timeseriesData: TimeseriesData[]
) => {
  // Calculate total power for each facility
  const facilityTotals = new Map<number, number>();
  
  timeseriesData.forEach(entry => {
    const current = facilityTotals.get(entry.facility_id) || 0;
    facilityTotals.set(entry.facility_id, current + Math.abs(parseFloat(entry.power_value.toString())));
  });

  // Separate facilities by type
  const producers = facilities.filter(f => f.type === 'producer');
  const consumers = facilities.filter(f => f.type === 'consumer');
  const accumulators = facilities.filter(f => f.type === 'accumulator');

  // Create chart data for producers
  const generation: ChartDataItem[] = producers.map((facility, index) => ({
    name: facility.name,
    value: Math.round(facilityTotals.get(facility.id) || 0),
    fill: getFacilityColor('producer', index)
  })).filter(item => item.value > 0);

  // Create chart data for consumers
  const consumption: ChartDataItem[] = consumers.map((facility, index) => ({
    name: facility.name,
    value: Math.round(facilityTotals.get(facility.id) || 0),
    fill: getFacilityColor('consumer', index)
  })).filter(item => item.value > 0);

  // Calculate average battery charge
  let averageBattery = 0;
  if (accumulators.length > 0) {
    const batteryCharges = accumulators.map(acc => {
      if (acc.metadata?.capacity_kwh && acc.current_charge_kwh !== undefined) {
        const capacity = parseFloat(acc.metadata.capacity_kwh.toString());
        const charge = parseFloat(acc.current_charge_kwh.toString());
        return Math.max(0, Math.min(100, (charge / capacity) * 100));
      }
      return 0;
    });
    averageBattery = Math.round(batteryCharges.reduce((a, b) => a + b, 0) / accumulators.length);
  }

  return {
    generation,
    consumption,
    averageBattery,
  };
};
