import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any; // Index signature for Recharts compatibility
}

interface EnergyPieChartProps {
  data: ChartData[];
  title: string;
  theme?: 'light' | 'dark';
}

export const EnergyPieChart: React.FC<EnergyPieChartProps> = ({ data, title, theme = 'light' }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Theme-aware styling
  const isDark = theme === 'dark';
  const containerClass = isDark
    ? 'bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/30 p-6 hover:shadow-2xl transition-shadow duration-300'
    : 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow duration-300';
  const titleClass = isDark ? 'text-slate-100' : 'text-gray-800';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#e5e7eb';
  const tooltipColor = isDark ? '#e2e8f0' : '#000000';
  const legendColor = isDark ? '#cbd5e1' : '#374151';
  const borderColor = isDark ? 'border-slate-600' : 'border-gray-200';
  const totalTextColor = isDark ? 'text-slate-300' : 'text-gray-600';
  const totalValueColor = isDark ? 'text-slate-100' : 'text-gray-900';
  
  // Custom label renderer with theme support
  const renderLabel = ({ name, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  return (
    <div className={containerClass}>
      <h3 className={`text-lg font-bold mb-6 ${titleClass} flex items-center gap-2`}>
        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            style={{ fontSize: '12px' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)} kWh` : ''}
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: isDark ? '0 10px 15px -3px rgb(0 0 0 / 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              color: tooltipColor
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px', paddingTop: '8px', color: legendColor }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className={`mt-6 pt-4 border-t ${borderColor}`}>
        <p className={`text-sm ${totalTextColor} text-center`}>Total: <span className={`font-bold ${totalValueColor} text-lg`}>{total.toFixed(1)} kWh</span></p>
      </div>
    </div>
  );
};
