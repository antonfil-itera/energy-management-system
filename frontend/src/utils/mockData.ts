import type { EnergyDataPoint, TimePeriod } from '../types';

/**
 * Generate realistic electricity data with daily patterns
 */
const generateDataPoint = (date: Date, mode: 'surplus' | 'deficit' = 'deficit'): EnergyDataPoint => {
  const hour = date.getHours();
  
  // Adjust multipliers based on mode - more aggressive for surplus
  const genMultiplier = mode === 'surplus' ? 3.0 : 1.0;
  const consumMultiplier = mode === 'surplus' ? 0.4 : 1.0;
  
  // Solar follows sun pattern (peaks at noon)
  const solarBase = hour >= 6 && hour <= 18 
    ? Math.sin((hour - 6) * Math.PI / 12) * 30 * genMultiplier + Math.random() * 5
    : 0;
  
  // Wind is more random but typically stronger at night
  const windBase = ((hour < 6 || hour > 18 ? 25 : 15) + Math.random() * 10) * genMultiplier;
  
  // Elevator peaks during business hours
  const elevatorBase = (hour >= 8 && hour <= 20
    ? 25 + Math.sin((hour - 8) * Math.PI / 12) * 15 + Math.random() * 8
    : 8 + Math.random() * 5) * consumMultiplier;
  
  // Refrigerator has constant base load with small variations
  const refrigeratorBase = (30 + Math.random() * 8) * consumMultiplier;
  
  // HVAC (Heating, Ventilation, Air Conditioning) - high consumption, peaks during business hours
  const hvacBase = (hour >= 7 && hour <= 22
    ? 45 + Math.sin((hour - 7) * Math.PI / 15) * 20 + Math.random() * 12
    : 15 + Math.random() * 5) * consumMultiplier;
  
  // Lighting - peaks during business hours, minimal at night
  const lightingBase = (hour >= 8 && hour <= 21
    ? 35 + (hour >= 18 ? 15 : 0) + Math.random() * 8
    : 5 + Math.random() * 2) * consumMultiplier;
  
  // Freezer - constant high load for frozen goods storage
  const freezerBase = (40 + Math.random() * 10) * consumMultiplier;
  
  // Battery accumulates excess or depletes based on generation vs consumption
  const generation = solarBase + windBase;
  const consumption = elevatorBase + refrigeratorBase + hvacBase + lightingBase + freezerBase;
  const batteryBase = Math.max(0, Math.min(100, 50 + (generation - consumption) * 0.3 + Math.random() * 10));
  
  return {
    timestamp: new Date(date),
    solar: Math.round(solarBase * 10) / 10,
    wind: Math.round(windBase * 10) / 10,
    elevator: Math.round(elevatorBase * 10) / 10,
    refrigerator: Math.round(refrigeratorBase * 10) / 10,
    hvac: Math.round(hvacBase * 10) / 10,
    lighting: Math.round(lightingBase * 10) / 10,
    freezer: Math.round(freezerBase * 10) / 10,
    battery: Math.round(batteryBase * 10) / 10,
  };
};

/**
 * Generate mock data for a given time period
 */
export const generateMockData = (period: TimePeriod, mode: 'surplus' | 'deficit' = 'deficit'): EnergyDataPoint[] => {
  const now = new Date();
  const data: EnergyDataPoint[] = [];
  
  switch (period) {
    case 'day': {
      // Last 24 hours, hourly data points
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(now.getHours() - i, 0, 0, 0);
        data.push(generateDataPoint(date, mode));
      }
      break;
    }
    
    case 'week': {
      // Last 7 days, data points every 4 hours
      for (let i = 7 * 6 - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(now.getHours() - i * 4, 0, 0, 0);
        data.push(generateDataPoint(date, mode));
      }
      break;
    }
    
    case 'month': {
      // Last 30 days, daily data points
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(12, 0, 0, 0);
        data.push(generateDataPoint(date, mode));
      }
      break;
    }
  }
  
  return data;
};

/**
 * Calculate totals for pie chart
 */
export const calculateTotals = (data: EnergyDataPoint[]) => {
  const totals = data.reduce(
    (acc, point) => ({
      solar: acc.solar + point.solar,
      wind: acc.wind + point.wind,
      elevator: acc.elevator + point.elevator,
      refrigerator: acc.refrigerator + point.refrigerator,
      hvac: acc.hvac + point.hvac,
      lighting: acc.lighting + point.lighting,
      freezer: acc.freezer + point.freezer,
      battery: acc.battery + point.battery,
    }),
    { solar: 0, wind: 0, elevator: 0, refrigerator: 0, hvac: 0, lighting: 0, freezer: 0, battery: 0 }
  );
  
  return {
    generation: [
      { name: 'Solar Station', value: Math.round(totals.solar), fill: '#fbbf24' },
      { name: 'Wind Station', value: Math.round(totals.wind), fill: '#3b82f6' },
    ],
    consumption: [
      { name: 'Elevator', value: Math.round(totals.elevator), fill: '#ef4444' },
      { name: 'Refrigerator', value: Math.round(totals.refrigerator), fill: '#8b5cf6' },
      { name: 'HVAC', value: Math.round(totals.hvac), fill: '#06b6d4' },
      { name: 'Lighting', value: Math.round(totals.lighting), fill: '#f59e0b' },
      { name: 'Freezer', value: Math.round(totals.freezer), fill: '#10b981' },
    ],
    averageBattery: Math.round(totals.battery / data.length),
  };
};
