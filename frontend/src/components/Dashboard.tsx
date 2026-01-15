import { useState, useMemo } from 'react';
import type { TimePeriod } from '../types';
import { generateMockData, calculateTotals } from '../utils/mockData';
import { EnergyLineChart } from './EnergyLineChart';
import { EnergyPieChart } from './EnergyPieChart';

export const Dashboard: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Energy Management System</h1>
              <p className="text-blue-100 mt-1 text-xs md:text-sm">Wholesale & Retail Trade Enterprise</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Time Period Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Time Period</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Dev Mode Switcher */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setPowerMode('surplus')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    powerMode === 'surplus'
                      ? 'bg-green-600 text-white shadow-md shadow-green-200 scale-105'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  ⬆️ Surplus
                </button>
                <button
                  onClick={() => setPowerMode('deficit')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    powerMode === 'deficit'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-200 scale-105'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  ⬇️ Deficit
                </button>
              </div>
              {/* Time Period Buttons */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setPeriod('day')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  period === 'day'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                    : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  period === 'week'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                    : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  period === 'month'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                    : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                Month
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-violet-50 text-sm font-semibold uppercase tracking-wide">Generation</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] bg-violet-700/50 px-2 py-0.5 rounded-full">AC+DC</span>
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition-transform">⚡</div>
              </div>
              <p className="text-4xl font-bold mb-1">{currentGeneration.toFixed(1)}</p>
              <p className="text-violet-100 text-sm font-medium">kW</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-cyan-50 text-sm font-semibold uppercase tracking-wide">Consumption</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] bg-cyan-700/50 px-2 py-0.5 rounded-full">AC</span>
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition-transform">🔌</div>
              </div>
              <p className="text-4xl font-bold mb-1">{currentConsumption.toFixed(1)}</p>
              <p className="text-cyan-100 text-sm font-medium">kW</p>
            </div>
          </div>

          <div className={`bg-gradient-to-br rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300 ${
            netPower > 0 ? 'from-lime-400 via-green-500 to-emerald-600' : 'from-amber-400 via-orange-500 to-orange-600'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-semibold uppercase tracking-wide ${
                  netPower > 0 ? 'text-lime-50' : 'text-amber-50'
                }`}>Net Power</p>
                <div className="text-4xl group-hover:scale-110 transition-transform">{netPower > 0 ? '⬆️' : '⬇️'}</div>
              </div>
              <p className="text-4xl font-bold mb-1">{Math.abs(netPower).toFixed(1)}</p>
              <p className={`text-sm font-medium ${
                netPower > 0 ? 'text-lime-100' : 'text-amber-100'
              }`}>{netPower > 0 ? 'Surplus' : 'Deficit'} ({netPowerPercentage.toFixed(1)}%)</p>
              <p className={`text-xs mt-1 ${
                netPower > 0 ? 'text-lime-200' : 'text-amber-200'
              }`}>{netPower > 0 ? 'of consumption' : 'shortfall'}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-400 via-pink-500 to-rose-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-fuchsia-50 text-sm font-semibold uppercase tracking-wide">Battery</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] bg-fuchsia-700/50 px-2 py-0.5 rounded-full">DC</span>
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition-transform">🔋</div>
              </div>
              <p className="text-4xl font-bold mb-1">{currentBattery.toFixed(1)}</p>
              <p className="text-fuchsia-100 text-sm font-medium">% Charged</p>
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentBattery}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Charts Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Time Series Analysis</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <EnergyLineChart data={data} period={period} type="generation" theme="light" />
            <EnergyLineChart data={data} period={period} type="consumption" theme="light" />
          </div>
          <div className="grid grid-cols-1">
            <EnergyLineChart data={data} period={period} type="storage" theme="light" />
          </div>
        </div>

        {/* Pie Charts Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Distribution Overview</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Device Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-800">Device Status</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">☀️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">Solar Station</p>
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">DC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">💨</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">Wind Station</p>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">AC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">🛗</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">Elevator</p>
                    <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-medium">AC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Running</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">❄️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">Refrigerator</p>
                    <span className="text-[10px] bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full font-medium">AC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Running</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">🌡️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">HVAC System</p>
                    <span className="text-[10px] bg-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full font-medium">AC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Running</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">💡</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">Lighting</p>
                    <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-medium">AC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0 drop-shadow">🧊</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-lg">Freezer</p>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium">AC</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">Running</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 text-gray-300 mt-16 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">Energy Management System POC © 2026</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
