import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Facility } from '../types';
import type { TimePeriod } from '../types';

interface DynamicLineChartProps {
  data: any[];
  facilities: Facility[];
  period: TimePeriod;
  type: 'generation' | 'consumption';
  theme?: 'light' | 'dark';
}

const formatTimestamp = (timestamp: Date, period: TimePeriod): string => {
  if (period === 'day') {
    return timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (period === 'week') {
    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
  } else {
    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const getFacilityColor = (type: string, index: number): string => {
  const producerColors = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];
  const consumerColors = ['#ef4444', '#dc2626', '#b91c1c', '#8b5cf6', '#7c3aed', 
                          '#06b6d4', '#0891b2', '#f59e0b', '#d97706', '#10b981'];
  
  if (type === 'producer') return producerColors[index % producerColors.length];
  return consumerColors[index % consumerColors.length];
};

export const DynamicLineChart: React.FC<DynamicLineChartProps> = ({ 
  data, 
  facilities, 
  period, 
  type,
  theme = 'light' 
}) => {
  const relevantFacilities = useMemo(() => 
    facilities.filter(f => 
      type === 'generation' ? f.type === 'producer' : f.type === 'consumer'
    ),
    [facilities, type]
  );

  // Initialize with only first 2 facilities visible
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    relevantFacilities.forEach((facility, index) => {
      initial[facility.name] = index < 2;
    });
    return initial;
  });

  const toggleLine = (facilityName: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [facilityName]: !prev[facilityName]
    }));
  };

  const isDark = theme === 'dark';
  const containerClass = isDark
    ? 'bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/30 p-6 hover:shadow-2xl transition-shadow duration-300'
    : 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow duration-300';
  const titleClass = isDark ? 'text-slate-100' : 'text-gray-800';
  const gridColor = isDark ? '#475569' : '#e5e7eb';
  const axisStroke = isDark ? '#94a3b8' : '#9ca3af';
  const tickColor = isDark ? '#cbd5e1' : '#6b7280';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#e5e7eb';
  const tooltipColor = isDark ? '#e2e8f0' : '#000000';

  const chartData = data.map(point => ({
    ...point,
    time: formatTimestamp(point.timestamp, period),
  }));

  const title = type === 'generation' ? 'Energy Generation' : 'Energy Consumption';

  const getToggleClass = (isActive: boolean, color: string) => {
    if (isDark) {
      return `px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
        isActive
          ? `${color} border-2`
          : 'bg-slate-700/50 text-slate-500 border-2 border-slate-600'
      }`;
    }
    return `px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
      isActive
        ? `${color} border-2`
        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
    }`;
  };

  const getButtonColorClass = (index: number) => {
    const colors = [
      isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/50' : 'bg-amber-100 text-amber-800 border-amber-400',
      isDark ? 'bg-orange-500/20 text-orange-300 border-orange-400/50' : 'bg-orange-100 text-orange-800 border-orange-400',
      isDark ? 'bg-red-500/20 text-red-300 border-red-400/50' : 'bg-red-100 text-red-800 border-red-400',
      isDark ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-purple-100 text-purple-800 border-purple-400',
      isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-cyan-100 text-cyan-800 border-cyan-400',
      isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' : 'bg-blue-100 text-blue-800 border-blue-400',
      isDark ? 'bg-green-500/20 text-green-300 border-green-400/50' : 'bg-green-100 text-green-800 border-green-400',
      isDark ? 'bg-pink-500/20 text-pink-300 border-pink-400/50' : 'bg-pink-100 text-pink-800 border-pink-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={containerClass}>
      <h3 className={`text-lg font-bold mb-4 ${titleClass} flex items-center gap-2`}>
        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
        {title}
      </h3>
      
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {relevantFacilities.map((facility, index) => {
          const color = getFacilityColor(facility.type, index);
          return (
            <button
              key={facility.id}
              onClick={() => toggleLine(facility.name)}
              className={getToggleClass(visibleLines[facility.name], getButtonColorClass(index))}
            >
              <span 
                className="inline-block w-3 h-0.5 mr-2" 
                style={{ backgroundColor: color }}
              ></span>
              {facility.name}
            </button>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="time" 
            stroke={axisStroke}
            tick={{ fill: tickColor, fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke={axisStroke}
            tick={{ fill: tickColor, fontSize: 12 }}
            label={{ 
              value: 'Power (kW)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: tickColor }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: isDark ? '0 10px 15px -3px rgb(0 0 0 / 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              color: tooltipColor
            }}
            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)} kW` : ''}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            iconType="line"
          />
          {relevantFacilities.map((facility, index) => 
            visibleLines[facility.name] ? (
              <Line
                key={facility.id}
                type="monotone"
                dataKey={facility.name}
                stroke={getFacilityColor(facility.type, index)}
                strokeWidth={2}
                name={facility.name}
                dot={false}
                connectNulls
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
