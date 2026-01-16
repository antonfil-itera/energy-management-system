import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const getFacilityColor = (type) => {
  switch (type) {
    case 'producer':
      return '#4caf50';
    case 'consumer':
      return '#f44336';
    case 'accumulator':
      return '#2196f3';
    default:
      return '#999';
  }
};

function FacilityChart({ facilityId, timeseriesData, facilities }) {
  const facility = facilities.find(f => f.id === facilityId);

  const chartData = useMemo(() => {
    return timeseriesData
      .filter(entry => entry.facility_id === facilityId)
      .map(entry => ({
        timestamp: entry.timestamp,
        time: new Date(entry.timestamp).toLocaleTimeString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        power: Math.round(parseFloat(entry.power_value) * 100) / 100,
        storedEnergy: entry.stored_energy_kwh ? Math.round(parseFloat(entry.stored_energy_kwh) * 100) / 100 : null,
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [facilityId, timeseriesData]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, max: 0, min: 0 };

    const powers = chartData.map(d => d.power);
    return {
      avg: Math.round((powers.reduce((a, b) => a + b, 0) / powers.length) * 100) / 100,
      max: Math.max(...powers),
      min: Math.min(...powers),
    };
  }, [chartData]);

  const isAccumulator = facility?.type === 'accumulator';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            {payload[0].payload.time}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '3px 0', color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)} {entry.dataKey === 'storedEnergy' ? 'kWh' : 'kW'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!facility) {
    return <div>Facility not found</div>;
  }

  // Calculate charge percentage for accumulators
  const chargeInfo = useMemo(() => {
    if (facility.type === 'accumulator' && facility.metadata?.capacity_kwh) {
      const currentCharge = parseFloat(facility.current_charge_kwh || 0);
      const capacity = parseFloat(facility.metadata.capacity_kwh);
      const percentage = Math.max(0, Math.min(100, (currentCharge / capacity) * 100));
      return {
        currentCharge: currentCharge.toFixed(2),
        capacity: capacity.toFixed(2),
        percentage: percentage.toFixed(1)
      };
    }
    return null;
  }, [facility]);

  return (
    <div>
      <h2>{facility.name}</h2>
      <div style={{ marginBottom: '20px', color: '#666' }}>
        <p>Type: <strong style={{ textTransform: 'capitalize' }}>{facility.type}</strong></p>
        <p>Max Power: <strong>{facility.max_power} kW</strong></p>
        {chargeInfo && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1976d2' }}>
              Battery Status
            </p>
            <p style={{ margin: '5px 0' }}>
              Current Charge: <strong>{chargeInfo.currentCharge} kWh</strong> / {chargeInfo.capacity} kWh
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <div style={{ flex: 1, height: '20px', backgroundColor: '#ddd', borderRadius: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${chargeInfo.percentage}%`,
                    backgroundColor: '#2196f3',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span style={{ fontWeight: 'bold', minWidth: '50px', textAlign: 'right' }}>
                {chargeInfo.percentage}%
              </span>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <span>Avg: <strong>{stats.avg} kW</strong></span>
          <span>Max: <strong>{stats.max} kW</strong></span>
          <span>Min: <strong>{stats.min} kW</strong></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {isAccumulator ? (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Stored Energy (kWh)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="power"
              stroke={getFacilityColor(facility.type)}
              name="Power Flow"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="storedEnergy"
              stroke="#ff9800"
              name="Stored Energy"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="power"
              stroke={getFacilityColor(facility.type)}
              name={facility.name}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default FacilityChart;
