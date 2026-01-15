import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EnergyDataPoint, TimePeriod } from '../types';

interface EnergyLineChartProps {
  data: EnergyDataPoint[];
  period: TimePeriod;
  type: 'generation' | 'consumption' | 'storage';
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

export const EnergyLineChart: React.FC<EnergyLineChartProps> = ({ data, period, type, theme = 'light' }) => {
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    solar: true,
    wind: true,
    elevator: true,
    refrigerator: true,
    hvac: true,
    lighting: true,
    freezer: true,
    battery: true,
  });

  // Theme-aware styling
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
  const lineWidth = isDark ? 3 : 2;
  
  // Line colors adjusted for theme
  const colors = {
    solar: isDark ? '#fcd34d' : '#fbbf24',
    wind: isDark ? '#60a5fa' : '#3b82f6',
    elevator: isDark ? '#f87171' : '#ef4444',
    refrigerator: isDark ? '#a78bfa' : '#8b5cf6',
    hvac: isDark ? '#22d3ee' : '#06b6d4',
    lighting: isDark ? '#fbbf24' : '#f59e0b',
    freezer: isDark ? '#34d399' : '#10b981',
    battery: isDark ? '#34d399' : '#10b981',
  };

  const toggleLine = (key: string) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const chartData = data.map(point => ({
    ...point,
    time: formatTimestamp(point.timestamp, period),
  }));

  const renderLines = () => {
    if (type === 'generation') {
      return (
        <>
          {visibleLines.solar && <Line type="monotone" dataKey="solar" stroke={colors.solar} strokeWidth={lineWidth} name="Solar Station" dot={false} />}
          {visibleLines.wind && <Line type="monotone" dataKey="wind" stroke={colors.wind} strokeWidth={lineWidth} name="Wind Station" dot={false} />}
        </>
      );
    } else if (type === 'consumption') {
      return (
        <>
          {visibleLines.elevator && <Line type="monotone" dataKey="elevator" stroke={colors.elevator} strokeWidth={lineWidth} name="Elevator" dot={false} />}
          {visibleLines.refrigerator && <Line type="monotone" dataKey="refrigerator" stroke={colors.refrigerator} strokeWidth={lineWidth} name="Refrigerator" dot={false} />}
          {visibleLines.hvac && <Line type="monotone" dataKey="hvac" stroke={colors.hvac} strokeWidth={lineWidth} name="HVAC" dot={false} />}
          {visibleLines.lighting && <Line type="monotone" dataKey="lighting" stroke={colors.lighting} strokeWidth={lineWidth} name="Lighting" dot={false} />}
          {visibleLines.freezer && <Line type="monotone" dataKey="freezer" stroke={colors.freezer} strokeWidth={lineWidth} name="Freezer" dot={false} />}
        </>
      );
    } else {
      return (
        <Line type="monotone" dataKey="battery" stroke={colors.battery} strokeWidth={lineWidth} name="Battery Level" dot={false} />
      );
    }
  };

  const getToggleClass = (isActive: boolean, activeColor: string) => {
    if (isDark) {
      return `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? `${activeColor} border-2`
          : 'bg-slate-700/50 text-slate-500 border-2 border-slate-600'
      }`;
    }
    return `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? `${activeColor} border-2`
        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
    }`;
  };

  const renderToggles = () => {
    if (type === 'generation') {
      return (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => toggleLine('solar')}
            className={getToggleClass(
              visibleLines.solar,
              isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/50' : 'bg-amber-100 text-amber-800 border-amber-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-amber-400 mr-2"></span>
            Solar
          </button>
          <button
            onClick={() => toggleLine('wind')}
            className={getToggleClass(
              visibleLines.wind,
              isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' : 'bg-blue-100 text-blue-800 border-blue-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-blue-400 mr-2"></span>
            Wind
          </button>
        </div>
      );
    } else if (type === 'consumption') {
      return (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => toggleLine('elevator')}
            className={getToggleClass(
              visibleLines.elevator,
              isDark ? 'bg-red-500/20 text-red-300 border-red-400/50' : 'bg-red-100 text-red-800 border-red-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-red-400 mr-2"></span>
            Elevator
          </button>
          <button
            onClick={() => toggleLine('refrigerator')}
            className={getToggleClass(
              visibleLines.refrigerator,
              isDark ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-purple-100 text-purple-800 border-purple-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-purple-400 mr-2"></span>
            Refrigerator
          </button>
          <button
            onClick={() => toggleLine('hvac')}
            className={getToggleClass(
              visibleLines.hvac,
              isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-cyan-100 text-cyan-800 border-cyan-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-cyan-400 mr-2"></span>
            HVAC
          </button>
          <button
            onClick={() => toggleLine('lighting')}
            className={getToggleClass(
              visibleLines.lighting,
              isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/50' : 'bg-amber-100 text-amber-800 border-amber-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-amber-400 mr-2"></span>
            Lighting
          </button>
          <button
            onClick={() => toggleLine('freezer')}
            className={getToggleClass(
              visibleLines.freezer,
              isDark ? 'bg-green-500/20 text-green-300 border-green-400/50' : 'bg-green-100 text-green-800 border-green-400'
            )}
          >
            <span className="inline-block w-3 h-0.5 bg-green-400 mr-2"></span>
            Freezer
          </button>
        </div>
      );
    }
    return null;
  };

  const getTitle = () => {
    if (type === 'generation') return 'Energy Generation (kW)';
    if (type === 'consumption') return 'Energy Consumption (kW)';
    return 'Battery Storage (%)';
  };

  return (
    <div className={containerClass}>
      <h3 className={`text-lg font-bold mb-4 ${titleClass} flex items-center gap-2`}>
        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
        {getTitle()}
      </h3>
      {renderToggles()}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={isDark ? 0.3 : 1} />
          <XAxis 
            dataKey="time" 
            stroke={axisStroke}
            style={{ fontSize: '12px' }}
            tick={{ fill: tickColor }}
            tickMargin={10}
          />
          <YAxis 
            stroke={axisStroke}
            style={{ fontSize: '12px' }}
            tick={{ fill: tickColor }}
            tickMargin={10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: isDark ? '0 10px 15px -3px rgb(0 0 0 / 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              color: tooltipColor
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px', paddingTop: '16px' }}
            iconType="line"
          />
          {renderLines()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
