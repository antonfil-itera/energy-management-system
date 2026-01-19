import { useState, useMemo, useEffect } from 'react';
import type { TimePeriod, Facility, TimeseriesData } from '../types';
import { fetchFacilities, fetchTimeseries } from '../api';
import { transformBackendData, calculateTotalsFromBackend } from '../utils/dataTransform';
import { DynamicLineChart } from './DynamicLineChart';
import { EnergyPieChart } from './EnergyPieChart';

export const Dashboard: React.FC = () => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading energy data...</p>
          <p className="text-gray-400 text-sm mt-2">Processing {period === 'month' ? 'monthly' : period === 'week' ? 'weekly' : 'daily'} data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Error loading data</p>
          <p className="text-red-600 text-sm">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Energy Management System</h1>
              <p className="text-blue-100 mt-1 text-xs md:text-sm">Smart Home Energy Monitoring</p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-800">Time Series Analysis</h2>
            </div>
            {data.length > 0 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {data.length} data points • Optimized for {period}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6">
            <DynamicLineChart data={data} facilities={facilities} period={period} type="generation" theme="light" />
            <DynamicLineChart data={data} facilities={facilities} period={period} type="consumption" theme="light" />
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
            <h3 className="text-xl font-bold text-gray-800">Facilities Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

              const getColorClass = (type: string) => {
                if (type === 'producer') return 'from-amber-50 to-orange-50 border-amber-200';
                if (type === 'accumulator') return 'from-fuchsia-50 to-pink-50 border-fuchsia-200';
                return 'from-sky-50 to-blue-50 border-sky-200';
              };

              const getBadgeClass = (type: string) => {
                if (type === 'producer') return 'bg-amber-200 text-amber-800';
                if (type === 'accumulator') return 'bg-fuchsia-200 text-fuchsia-800';
                return 'bg-sky-200 text-sky-800';
              };

              return (
                <div 
                  key={facility.id}
                  className={`bg-gradient-to-br ${getColorClass(facility.type)} border-2 rounded-xl p-4 hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0 drop-shadow">
                      {getIcon(facility.type, facility.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-800 text-sm leading-tight truncate" title={facility.name}>
                          {facility.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] ${getBadgeClass(facility.type)} px-2 py-0.5 rounded-full font-medium`}>
                          {facility.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-green-700 font-medium">
                          {facility.max_power} kW
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
