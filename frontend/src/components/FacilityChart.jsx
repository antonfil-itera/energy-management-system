import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
          <p style={{ margin: '3px 0', color: payload[0].color }}>
            Power: {payload[0].value.toFixed(2)} kW
          </p>
        </div>
      );
    }
    return null;
  };

  if (!facility) {
    return <div>Facility not found</div>;
  }

  return (
    <div>
      <h2>{facility.name}</h2>
      <div style={{ marginBottom: '20px', color: '#666' }}>
        <p>Type: <strong style={{ textTransform: 'capitalize' }}>{facility.type}</strong></p>
        <p>Max Power: <strong>{facility.max_power} kW</strong></p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <span>Avg: <strong>{stats.avg} kW</strong></span>
          <span>Max: <strong>{stats.max} kW</strong></span>
          <span>Min: <strong>{stats.min} kW</strong></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
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
      </ResponsiveContainer>
    </div>
  );
}

export default FacilityChart;
