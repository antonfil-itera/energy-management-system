import { useState, useMemo, useEffect } from 'react';
import type { TimePeriod, Facility, TimeseriesData } from '../types';
import { fetchFacilities, fetchTimeseries } from '../api';
import { transformBackendData, calculateTotalsFromBackend } from '../utils/dataTransform';
import { DynamicLineChart } from './DynamicLineChart';
import { EnergyPieChart } from './EnergyPieChart';

export const DashboardV2: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('day');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from backend
  useEffect(() => {
    loadData(period);
  }, [period]);

  const loadData = async (selectedPeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch facilities
      const facilitiesData = await fetchFacilities();
      setFacilities(facilitiesData);

      // Calculate time range based on period
      const endTime = new Date();
      let startTime: Date;

      switch (selectedPeriod) {
        case 'week':
          startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'day':
        default:
          startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch timeseries data
      const timeseries = await fetchTimeseries(startTime, endTime);
      setTimeseriesData(timeseries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Transform backend data to chart format
  const data = useMemo(() => 
    transformBackendData(facilities, timeseriesData, period), 
    [facilities, timeseriesData, period]
  );
  
  const totals = useMemo(() => 
    calculateTotalsFromBackend(facilities, timeseriesData), 
    [facilities, timeseriesData]
  );

  const currentGeneration = useMemo(() => {
    if (data.length === 0) return 0;
    const latest = data[data.length - 1];
    const producers = facilities.filter(f => f.type === 'producer');
    return producers.reduce((sum, facility) => {
      return sum + (Number(latest[facility.name]) || 0);
    }, 0);
  }, [data, facilities]);

  const currentConsumption = useMemo(() => {
    if (data.length === 0) return 0;
    const latest = data[data.length - 1];
    const consumers = facilities.filter(f => f.type === 'consumer');
    return consumers.reduce((sum, facility) => {
      return sum + (Number(latest[facility.name]) || 0);
    }, 0);
  }, [data, facilities]);

  const currentBattery = useMemo(() => {
    return totals.averageBattery;
  }, [totals]);

  const netPower = currentGeneration - currentConsumption;
  const netPowerPercentage = currentConsumption > 0 
    ? Math.abs((netPower / currentConsumption) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-300 text-lg">Loading energy data...</p>
          <p className="text-slate-500 text-sm mt-2">Processing {period === 'month' ? 'monthly' : period === 'week' ? 'weekly' : 'daily'} data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-6 max-w-md">
          <p className="text-red-300 font-semibold mb-2">Error loading data</p>
          <p className="text-red-400 text-sm">{error}</p>
          <button 
            onClick={() => loadData(period)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          <div>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-xl font-semibold text-white">Time Series</h3>
                </div>
                {data.length > 0 && (
                  <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                    {data.length} data points • Optimized
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-6">
                <DynamicLineChart data={data} facilities={facilities} period={period} type="generation" theme="dark" />
                <DynamicLineChart data={data} facilities={facilities} period={period} type="consumption" theme="dark" />
              </div>
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

            {/* Facilities Status Table */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-semibold text-white">Facilities Overview</h3>
              </div>
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Facility</th>
                      <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Type</th>
                      <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Max Power</th>
                      <th className="text-center px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {facilities.map((facility) => {
                      const getIcon = (type: string, name: string) => {
                        const lowerName = name.toLowerCase();
                        if (type === 'producer') {
                          if (lowerName.includes('solar')) return '☀️';
                          if (lowerName.includes('wind')) return '💨';
                          return '⚡';
                        }
                        if (type === 'accumulator') return '🔋';
                        // Consumer icons
                        if (lowerName.includes('kitchen')) return '🍳';
                        if (lowerName.includes('living')) return '🛋️';
                        if (lowerName.includes('bedroom')) return '🛏️';
                        if (lowerName.includes('bathroom')) return '🚿';
                        if (lowerName.includes('office')) return '💼';
                        if (lowerName.includes('garage') || lowerName.includes('workshop')) return '🔧';
                        if (lowerName.includes('garden') || lowerName.includes('light')) return '💡';
                        if (lowerName.includes('pool')) return '🏊';
                        return '🏠';
                      };

                      const getBadgeClass = (type: string) => {
                        if (type === 'producer') return 'bg-amber-500/20 text-amber-300';
                        if (type === 'accumulator') return 'bg-pink-500/20 text-pink-300';
                        return 'bg-cyan-500/20 text-cyan-300';
                      };

                      return (
                        <tr key={facility.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getIcon(facility.type, facility.name)}</span>
                              <span className="font-medium text-white">{facility.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs ${getBadgeClass(facility.type)} px-2 py-1 rounded-full capitalize`}>
                              {facility.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {facility.max_power} kW
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
