import { useState, useMemo } from 'react';
import type { TimePeriod } from '../types';
import { generateMockData, calculateTotals } from '../utils/mockData';
import { EnergyLineChart } from './EnergyLineChart';
import { EnergyPieChart } from './EnergyPieChart';

export const DashboardV3: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('day');
  const [powerMode, setPowerMode] = useState<'surplus' | 'deficit'>('deficit');

  const data = useMemo(() => generateMockData(period, powerMode), [period, powerMode]);
  const totals = useMemo(() => calculateTotals(data), [data]);

  const currentGeneration = useMemo(() => {
    const latest = data[data.length - 1];
    return latest ? latest.solar + latest.wind : 0;
  }, [data]);

  const currentConsumption = useMemo(() => {
    const latest = data[data.length - 1];
    return latest ? latest.elevator + latest.refrigerator + latest.hvac + latest.lighting + latest.freezer : 0;
  }, [data]);

  const currentBattery = useMemo(() => {
    const latest = data[data.length - 1];
    return latest ? latest.battery : 0;
  }, [data]);

  const netPower = currentGeneration - currentConsumption;
  const netPowerPercentage = currentConsumption > 0 
    ? Math.abs((netPower / currentConsumption) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10">
        {/* Compact Header */}
        <header className="backdrop-blur-md bg-white/40 border-b border-white/60 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Energy Hub
                  </h1>
                  <p className="text-xs text-gray-600">Real-time monitoring</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Time Period */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-xl shadow-sm border border-white/80">
                  {(['day', 'week', 'month'] as TimePeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        period === p
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Power Mode */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-xl shadow-sm border border-white/80">
                  <button
                    onClick={() => setPowerMode('surplus')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      powerMode === 'surplus'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    ⬆️ Surplus
                  </button>
                  <button
                    onClick={() => setPowerMode('deficit')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      powerMode === 'deficit'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    ⬇️ Deficit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-6 py-6">
          {/* Metrics Cards - Horizontal Scroll on Mobile */}
          <div className="flex gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {/* Generation */}
            <div className="min-w-[280px] flex-1 bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Generation</p>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">AC+DC</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{currentGeneration.toFixed(1)}</span>
                <span className="text-lg text-gray-500">kW</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-violet-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Consumption */}
            <div className="min-w-[280px] flex-1 bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Consumption</p>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">AC</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔌</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{currentConsumption.toFixed(1)}</span>
                <span className="text-lg text-gray-500">kW</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Net Power */}
            <div className={`min-w-[280px] flex-1 backdrop-blur-lg rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
              netPower > 0 
                ? 'bg-emerald-50/70 border-emerald-200/60' 
                : 'bg-orange-50/70 border-orange-200/60'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-sm font-medium uppercase tracking-wide ${
                    netPower > 0 ? 'text-emerald-700' : 'text-orange-700'
                  }`}>
                    {netPower > 0 ? 'Surplus' : 'Deficit'}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                    netPower > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {netPowerPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  netPower > 0 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-br from-orange-400 to-amber-500'
                }`}>
                  <span className="text-2xl">{netPower > 0 ? '⬆️' : '⬇️'}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{Math.abs(netPower).toFixed(1)}</span>
                <span className="text-lg text-gray-500">kW</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  netPower > 0 
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-r from-orange-400 to-amber-500'
                }`} style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Battery */}
            <div className="min-w-[280px] flex-1 bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Battery</p>
                  <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full mt-1 inline-block">DC</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔋</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{currentBattery.toFixed(1)}</span>
                <span className="text-lg text-gray-500">%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${currentBattery}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <EnergyLineChart data={data} period={period} type="generation" theme="light" />
            <EnergyLineChart data={data} period={period} type="consumption" theme="light" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-1">
              <EnergyLineChart data={data} period={period} type="storage" theme="light" />
            </div>
            <div className="xl:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnergyPieChart 
                  data={totals.generation} 
                  title="Generation Distribution"
                  theme="light"
                />
                <EnergyPieChart 
                  data={totals.consumption} 
                  title="Consumption Distribution"
                  theme="light"
                />
              </div>
            </div>
          </div>

          {/* Device Grid */}
          <div className="bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
              Active Devices
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: 'Solar', icon: '☀️', type: 'DC', color: 'from-amber-400 to-orange-500' },
                { name: 'Wind', icon: '💨', type: 'AC', color: 'from-blue-400 to-cyan-500' },
                { name: 'Elevator', icon: '🛗', type: 'AC', color: 'from-red-400 to-rose-500' },
                { name: 'Refrigerator', icon: '❄️', type: 'AC', color: 'from-purple-400 to-violet-500' },
                { name: 'HVAC', icon: '🌡️', type: 'AC', color: 'from-cyan-400 to-teal-500' },
                { name: 'Lighting', icon: '💡', type: 'AC', color: 'from-yellow-400 to-amber-500' },
                { name: 'Freezer', icon: '🧊', type: 'AC', color: 'from-emerald-400 to-green-500' },
              ].map((device) => (
                <div 
                  key={device.name}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${device.color} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-md mx-auto`}>
                    {device.icon}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 text-center mb-1">{device.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{device.type}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
