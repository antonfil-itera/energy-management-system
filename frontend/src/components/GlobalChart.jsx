import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GlobalChart({ timeseriesData, facilities }) {
  const chartData = useMemo(() => {
    // Group by timestamp and aggregate production/consumption
    const dataByTime = {};

    timeseriesData.forEach(entry => {
      const timestamp = new Date(entry.timestamp).toISOString();

      if (!dataByTime[timestamp]) {
        dataByTime[timestamp] = {
          timestamp,
          production: 0,
          consumption: 0,
        };
      }

      const powerValue = parseFloat(entry.power_value);

      if (powerValue > 0) {
        dataByTime[timestamp].production += powerValue;
      } else if (powerValue < 0) {
        dataByTime[timestamp].consumption += Math.abs(powerValue);
      }
    });

    // Convert to array and sort by time
    return Object.values(dataByTime)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        production: Math.round(item.production * 100) / 100,
        consumption: Math.round(item.consumption * 100) / 100,
      }));
  }, [timeseriesData]);

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
              {entry.name}: {entry.value.toFixed(2)} kW
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
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
          dataKey="production"
          stroke="#4caf50"
          name="Production"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="consumption"
          stroke="#f44336"
          name="Consumption"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default GlobalChart;
