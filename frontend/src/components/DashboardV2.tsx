import { useState, useMemo } from 'react';
import type { TimePeriod } from '../types';
import { generateMockData, calculateTotals } from '../utils/mockData';
import { EnergyLineChart } from './EnergyLineChart';
import { EnergyPieChart } from './EnergyPieChart';

export const DashboardV2: React.FC = () => {
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
    <div className="min-h-screen bg-slate-900 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Energy Hub</h1>
              <p className="text-xs text-slate-400">Trade Enterprise</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Live Monitoring</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-slate-800">
          <div className="mb-6">
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-3 block">Time Range</label>
            <div className="space-y-2">
              {(['day', 'week', 'month'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-3 block">Power Mode</label>
            <div className="space-y-2">
              <button
                onClick={() => setPowerMode('surplus')}
                className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all ${
                  powerMode === 'surplus'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                ⬆️ Surplus
              </button>
              <button
                onClick={() => setPowerMode('deficit')}
                className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all ${
                  powerMode === 'deficit'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                ⬇️ Deficit
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="p-6 flex-1 overflow-y-auto">
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-4 block">Current Status</label>
          
          <div className="space-y-4">
            {/* Generation */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Generation</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">AC+DC</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{currentGeneration.toFixed(1)}</span>
                <span className="text-sm text-slate-400">kW</span>
              </div>
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Consumption */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Consumption</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">AC</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{currentConsumption.toFixed(1)}</span>
                <span className="text-sm text-slate-400">kW</span>
              </div>
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Net Power */}
            <div className={`rounded-xl p-4 border ${
              netPower > 0 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-orange-500/10 border-orange-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: netPower > 0 ? '#10b981' : '#f97316' }}>
                  {netPower > 0 ? 'Surplus' : 'Deficit'}
                </span>
                <span className="text-2xl">{netPower > 0 ? '⬆️' : '⬇️'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{Math.abs(netPower).toFixed(1)}</span>
                <span className="text-sm text-slate-400">kW</span>
              </div>
              <div className="text-xs mt-1" style={{ color: netPower > 0 ? '#6ee7b7' : '#fdba74' }}>
                {netPowerPercentage.toFixed(1)}% {netPower > 0 ? 'of consumption' : 'shortfall'}
              </div>
            </div>

            {/* Battery */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Battery</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">DC</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{currentBattery.toFixed(1)}</span>
                <span className="text-sm text-slate-400">%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${currentBattery}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">© 2026 Energy Hub</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
            <p className="text-slate-400">Comprehensive energy monitoring and insights</p>
          </div>

          {/* Charts Grid */}
          <div className="space-y-8">
            {/* Time Series */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-semibold text-white">Time Series</h3>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <EnergyLineChart data={data} period={period} type="generation" theme="dark" />
                <EnergyLineChart data={data} period={period} type="consumption" theme="dark" />
              </div>
              <EnergyLineChart data={data} period={period} type="storage" theme="dark" />
            </section>

            {/* Distribution */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-semibold text-white">Distribution</h3>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <EnergyPieChart 
                  data={totals.generation} 
                  title="Generation Distribution"
                  theme="dark"
                />
                <EnergyPieChart 
                  data={totals.consumption} 
                  title="Consumption Distribution"
                  theme="dark"
                />
              </div>
            </section>

            {/* Device Status Table */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-semibold text-white">Device Status</h3>
              </div>
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Device</th>
                      <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Type</th>
                      <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Current</th>
                      <th className="text-center px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">☀️</span>
                          <span className="font-medium text-white">Solar Station</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Generation</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">DC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💨</span>
                          <span className="font-medium text-white">Wind Station</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Generation</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">AC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🛗</span>
                          <span className="font-medium text-white">Elevator</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Consumption</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-1 rounded-full">AC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Running
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">❄️</span>
                          <span className="font-medium text-white">Refrigerator</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Consumption</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">AC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Running
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🌡️</span>
                          <span className="font-medium text-white">HVAC System</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Consumption</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">AC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Running
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💡</span>
                          <span className="font-medium text-white">Lighting</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Consumption</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">AC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Active
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🧊</span>
                          <span className="font-medium text-white">Freezer</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">Consumption</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">AC</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Running
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
